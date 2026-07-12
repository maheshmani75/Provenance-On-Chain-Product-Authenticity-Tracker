import React, { useState } from 'react';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import QRScanner from './components/QRScanner';
import ProductQRCode from './components/ProductQRCode';
import VerificationSeal from './components/VerificationSeal';
import RegisterProductForm from './components/RegisterProductForm';
import TransferCustodyForm from './components/TransferCustodyForm';
import EventFeed from './components/EventFeed';
import Banner from './components/Banner';
import Skeleton from './components/Skeleton';
import { useWallet } from './hooks/useWallet';
import { useContractEvents } from './hooks/useContractEvents';
import { registryClient, transferLogClient } from './contracts/registryClient';
import { CONTRACTS } from './contracts/config';

export default function App() {
  const wallet = useWallet();
  const { events, connected, error: eventError } = useContractEvents();

  const [view, setView] = useState('verify');
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [verifiedProductId, setVerifiedProductId] = useState(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [flagLoading, setFlagLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registeredProductId, setRegisteredProductId] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleVerify(productId) {
    setError(null);
    setLoadingVerify(true);
    try {
      const productResult = await registryClient.getProduct(productId, wallet.address);
      const historyResult = await transferLogClient.getHistory(productId, wallet.address);
      setProduct(productResult);
      setHistory(historyResult || []);
      setVerifiedProductId(productId);
    } catch (err) {
      setError(`Could not verify product #${productId}. It may not be registered, or contract IDs in config.js need updating. (${err.message})`);
      setProduct(null);
      setHistory([]);
    } finally {
      setLoadingVerify(false);
    }
  }

  async function handleRegister({ name, serialNumber }) {
    if (!wallet.isConnected) {
      setError('Connect a wallet first to register a product.');
      return;
    }
    setError(null);
    setRegistering(true);
    try {
      const result = await registryClient.registerProduct(
        wallet.address,
        name,
        serialNumber,
        CONTRACTS.TRANSLOG_CONTRACT_ID,
        wallet.signTransaction
      );
      setSuccess(`Product registered on-chain. Transaction: ${result.hash}`);
      // In a production build, decode the return value from the tx result to get the exact ID.
      setRegisteredProductId('see transaction result / next sequential ID');
    } catch (err) {
      setError(`Failed to register product: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  }

  async function handleTransfer({ productId, toAddress, location }) {
    if (!wallet.isConnected) {
      setError('Connect a wallet first.');
      return;
    }
    setError(null);
    setTransferring(true);
    try {
      const result = await registryClient.transferCustody(
        productId,
        toAddress,
        location,
        wallet.address,
        wallet.signTransaction
      );
      setSuccess(`Custody transferred on-chain. Transaction: ${result.hash}`);
    } catch (err) {
      setError(`Transfer failed: ${err.message}`);
    } finally {
      setTransferring(false);
    }
  }

  async function handleFlag() {
    if (!wallet.isConnected) {
      setError('Connect a wallet first to flag a product.');
      return;
    }
    if (verifiedProductId === null) return;
    setError(null);
    setFlagLoading(true);
    try {
      await registryClient.flagCounterfeit(verifiedProductId, wallet.address, wallet.signTransaction);
      await handleVerify(verifiedProductId);
      setSuccess('Product flagged. Thank you for helping keep the registry honest.');
    } catch (err) {
      setError(`Could not flag product: ${err.message}`);
    } finally {
      setFlagLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar wallet={wallet} view={view} onViewChange={setView} />
      {view === 'verify' && <Hero />}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
        {(error || wallet.error) && <Banner type="error" message={error || wallet.error} onDismiss={() => setError(null)} />}
        {success && <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {view === 'verify' && (
              <>
                <QRScanner onScan={handleVerify} />
                {loadingVerify ? (
                  <Skeleton />
                ) : (
                  <VerificationSeal product={product} history={history} onFlag={handleFlag} flagLoading={flagLoading} />
                )}
              </>
            )}

            {view === 'manufacturer' && (
              <RegisterProductForm onRegister={handleRegister} loading={registering} registeredProductId={registeredProductId} />
            )}

            {view === 'custody' && (
              <>
                <TransferCustodyForm onTransfer={handleTransfer} loading={transferring} />
                {verifiedProductId !== null && (
                  <div className="panel p-5 sm:p-6 flex justify-center">
                    <ProductQRCode productId={verifiedProductId} />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="lg:col-span-1">
            <EventFeed events={events} connected={connected} error={eventError} />
          </div>
        </div>
      </main>

      <footer className="border-t border-rule py-8 text-center">
        <p className="text-xs text-slate-600 font-mono">
          Provenance · Soroban Testnet · Registry {CONTRACTS.REGISTRY_CONTRACT_ID.slice(0, 6)}…{CONTRACTS.REGISTRY_CONTRACT_ID.slice(-4)}
        </p>
      </footer>
    </div>
  );
}
