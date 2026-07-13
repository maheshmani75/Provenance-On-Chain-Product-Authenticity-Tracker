import {
  Contract,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Address,
  xdr,
  scValToNative,
} from '@stellar/stellar-sdk';
import { NETWORK, CONTRACTS } from './config';

const server = new rpc.Server(NETWORK.rpcUrl, { allowHttp: false });

// ─── ScVal helpers ────────────────────────────────────────────────────────────
// Build XDR ScVals manually to avoid nativeToScVal address-type issues.

function scAddress(strKey) {
  return Address.fromString(strKey).toScVal();
}

function scString(str) {
  return xdr.ScVal.scvString(new TextEncoder().encode(str));
}

function scU64(n) {
  const big = typeof n === 'bigint' ? n : BigInt(n);
  return xdr.ScVal.scvU64(xdr.Uint64.fromString(big.toString()));
}

// ─── Base client ─────────────────────────────────────────────────────────────

class BaseClient {
  constructor(contractId) {
    this.contract = new Contract(contractId);
  }

  async _buildAndSimulate(method, args, sourceAddress) {
    const account = await server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(60)
      .build();

    const simulated = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }
    return { tx, simulated };
  }

  async view(method, args = [], sourceAddress) {
    const { simulated } = await this._buildAndSimulate(method, args, sourceAddress);
    if (simulated.result?.retval) {
      return scValToNative(simulated.result.retval);
    }
    return null;
  }

  async invoke(method, args, sourceAddress, signTransaction) {
    const { tx, simulated } = await this._buildAndSimulate(method, args, sourceAddress);
    const prepared = rpc.assembleTransaction(tx, simulated).build();

    const signedXdr = await signTransaction(prepared.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase);

    const sendResponse = await server.sendTransaction(signedTx);
    if (sendResponse.status === 'ERROR') {
      throw new Error(`Transaction submission failed: ${JSON.stringify(sendResponse.errorResult)}`);
    }

    return this._pollTransaction(sendResponse.hash);
  }

  async _pollTransaction(hash, attempts = 20) {
    for (let i = 0; i < attempts; i++) {
      const result = await server.getTransaction(hash);
      if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return { hash, status: 'SUCCESS', result };
      }
      if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction failed on-chain: ${hash}`);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error(`Transaction ${hash} did not confirm in time`);
  }
}

// ─── ProductRegistry client ───────────────────────────────────────────────────

export class RegistryClient extends BaseClient {
  constructor(contractId = CONTRACTS.REGISTRY_CONTRACT_ID) {
    super(contractId);
  }

  registerProduct(manufacturer, name, serialNumber, transferLog, signTransaction) {
    const args = [
      scAddress(manufacturer),
      scString(name),
      scString(serialNumber),
      scAddress(transferLog),
    ];
    return this.invoke('register_product', args, manufacturer, signTransaction);
  }

  transferCustody(productId, to, location, currentOwner, signTransaction) {
    const args = [
      scU64(productId),
      scAddress(to),
      scString(location),
    ];
    return this.invoke('transfer_custody', args, currentOwner, signTransaction);
  }

  flagCounterfeit(productId, flaggedBy, signTransaction) {
    const args = [scU64(productId), scAddress(flaggedBy)];
    return this.invoke('flag_counterfeit', args, flaggedBy, signTransaction);
  }

  getProduct(productId, sourceAddress) {
    return this.view('get_product', [scU64(productId)], sourceAddress);
  }
}

// ─── TransferLog client (read-only) ──────────────────────────────────────────

export class TransferLogClient extends BaseClient {
  constructor(contractId = CONTRACTS.TRANSLOG_CONTRACT_ID) {
    super(contractId);
  }

  getHistory(productId, sourceAddress) {
    return this.view('get_history', [scU64(productId)], sourceAddress);
  }
}

export const registryClient = new RegistryClient();
export const transferLogClient = new TransferLogClient();
