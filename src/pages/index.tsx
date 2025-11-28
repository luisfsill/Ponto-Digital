import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Smartphone, ScanLine, X } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    setShowScanner(true);
    setScanError(null);

    // Importar dinamicamente para evitar SSR issues
    const { Html5Qrcode } = await import('html5-qrcode');
    
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR Code lido com sucesso
          scanner.stop().catch(() => {});
          setShowScanner(false);
          
          // Verificar se é uma URL válida do ponto
          if (decodedText.includes('/ponto')) {
            // Extrair o path relativo
            try {
              const url = new URL(decodedText);
              router.push(url.pathname + url.search);
            } catch {
              // Se não for URL completa, tentar usar diretamente
              router.push(decodedText);
            }
          } else {
            setScanError('QR Code inválido. Use um QR Code de ponto.');
          }
        },
        () => {
          // Erro de scan (ignorar, continua tentando)
        }
      );
    } catch (err: any) {
      console.error('Erro ao iniciar câmera:', err);
      setScanError(err.message || 'Não foi possível acessar a câmera');
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    setShowScanner(false);
    setScanError(null);
  };

  return (
    <Layout>
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', textAlign: 'center', gap: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>
            Ponto Digital
          </h1>
          <p className="text-muted" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
            Sistema de registro de ponto com identificação de dispositivo e geolocalização.
          </p>
        </div>

        {scanError && (
          <div className="alert alert-error" style={{ maxWidth: '400px' }}>
            {scanError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
          <Link href="/ponto" className="glass-panel card home-card-neon" style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="card-icon" style={{ color: 'white', background: 'rgba(255, 255, 255, 0.1)' }}>
              <Smartphone size={40} />
            </div>
            <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Registrar Ponto</h2>
            <p className="card-desc">
              Registrar entrada/saída manualmente.
            </p>
          </Link>

          <button 
            onClick={startScanner}
            className="glass-panel card home-card-neon" 
            style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'inherit' }}
          >
            <div className="card-icon" style={{ color: 'white', background: 'rgba(255, 255, 255, 0.1)' }}>
              <ScanLine size={40} />
            </div>
            <h2 className="card-title" style={{ fontSize: '1.5rem', color: 'white' }}>Escanear QR Code</h2>
            <p className="card-desc" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Escaneie o QR Code do local para bater ponto.
            </p>
          </button>
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', padding: '1.5rem' }}>
            <button onClick={stopScanner} className="close-btn">
              <X size={24} />
            </button>
            <h2 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Escanear QR Code
            </h2>
            <p className="text-muted" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              Aponte a câmera para o QR Code do local
            </p>
            <div 
              id="qr-reader" 
              style={{ 
                width: '100%', 
                borderRadius: '12px', 
                overflow: 'hidden',
                background: '#000'
              }}
            />
            <button 
              onClick={stopScanner} 
              className="btn btn-outline w-full mt-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
