import { Contract, rpc, TransactionBuilder, BASE_FEE, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { NETWORK, CONTRACTS } from './config';

const server = new rpc.Server(NETWORK.rpcUrl);

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

  async _pollTransaction(hash, attempts = 15) {
    for (let i = 0; i < attempts; i++) {
      const result = await server.getTransaction(hash);
      if (result.status === 'SUCCESS') {
        return { hash, status: 'SUCCESS', result };
      }
      if (result.status === 'FAILED') {
        throw new Error(`Transaction failed: ${hash}`);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error(`Transaction ${hash} did not confirm in time`);
  }
}

/** Thin client around the ProductRegistry Soroban contract. */
export class RegistryClient extends BaseClient {
  constructor(contractId = CONTRACTS.REGISTRY_CONTRACT_ID) {
    super(contractId);
  }

  registerProduct(manufacturer, name, serialNumber, transferLog, signTransaction) {
    const args = [
      nativeToScVal(manufacturer, { type: 'address' }),
      nativeToScVal(name, { type: 'string' }),
      nativeToScVal(serialNumber, { type: 'string' }),
      nativeToScVal(transferLog, { type: 'address' }),
    ];
    return this.invoke('register_product', args, manufacturer, signTransaction);
  }

  transferCustody(productId, to, location, currentOwner, signTransaction) {
    const args = [
      nativeToScVal(BigInt(productId), { type: 'u64' }),
      nativeToScVal(to, { type: 'address' }),
      nativeToScVal(location, { type: 'string' }),
    ];
    return this.invoke('transfer_custody', args, currentOwner, signTransaction);
  }

  flagCounterfeit(productId, flaggedBy, signTransaction) {
    const args = [nativeToScVal(BigInt(productId), { type: 'u64' }), nativeToScVal(flaggedBy, { type: 'address' })];
    return this.invoke('flag_counterfeit', args, flaggedBy, signTransaction);
  }

  getProduct(productId, sourceAddress) {
    return this.view('get_product', [nativeToScVal(BigInt(productId), { type: 'u64' })], sourceAddress);
  }
}

/** Thin read-only client around the TransferLog Soroban contract. */
export class TransferLogClient extends BaseClient {
  constructor(contractId = CONTRACTS.TRANSLOG_CONTRACT_ID) {
    super(contractId);
  }

  getHistory(productId, sourceAddress) {
    return this.view('get_history', [nativeToScVal(BigInt(productId), { type: 'u64' })], sourceAddress);
  }
}

export const registryClient = new RegistryClient();
export const transferLogClient = new TransferLogClient();
