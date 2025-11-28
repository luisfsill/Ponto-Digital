import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Smartphone, ScanLine, X, MapPin, RefreshCw } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const scannerRef = useRef<any>(null);

  // Iniciar scanner quando o modal estiver pronto
  useEffect(() => {
    if (showScanner && scannerReady) {
      initScanner();
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {
          // Ignorar erro de cleanup
        }
      }
    };
  }, [showScanner, scannerReady]);

  const initScanner = async () => {
    try {
      // Importar dinamicamente para evitar SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Verificar se o elemento existe
      const element = document.getElementById('qr-reader');
      if (!element) {
        setScanError('Erro ao inicializar scanner');
        return;
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

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
          setScannerReady(false);
          
          try {
            const url = new URL(decodedText);
            const path = url.pathname + url.search;
            
            // Detectar tipo de QR Code
            if (decodedText.includes('/ponto')) {
              router.push(path);
            } else if (decodedText.includes('/vincular-device')) {
              router.push(path);
            } else {
              setScanError('QR Code inválido. Use um QR Code de ponto ou de vincular dispositivo.');
            }
          } catch {
            if (decodedText.includes('/ponto') || decodedText.includes('/vincular-device')) {
              router.push(decodedText);
            } else {
              setScanError('QR Code inválido. Use um QR Code de ponto ou de vincular dispositivo.');
            }
          }
        },
        () => {
          // Erro de scan (ignorar, continua tentando)
        }
      );
    } catch (err: any) {
      console.error('Erro ao iniciar câmera:', err);
      setScanError(err.message || 'Não foi possível acessar a câmera. Verifique as permissões.');
      setShowScanner(false);
      setScannerReady(false);
    }
  };

  const openScanner = () => {
    setScanError(null);
    setShowScanner(true);
    // Aguardar o DOM renderizar antes de iniciar
    setTimeout(() => setScannerReady(true), 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
      } catch (e) {
        // Ignorar
      }
    }
    scannerRef.current = null;
    setShowScanner(false);
    setScannerReady(false);
  };

  const handleRegistrarPonto = () => {
    if (!navigator.geolocation) {
      setScanError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setLocationStatus('requesting');
    setScanError(null);

    // Usar watchPosition para forçar localização fresca (sem cache)
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Localização obtida - parar o watch e redirecionar
        navigator.geolocation.clearWatch(watchId);
        setLocationStatus('granted');
        router.push('/ponto');
      },
      (error) => {
        navigator.geolocation.clearWatch(watchId);
        setLocationStatus('denied');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setScanError('Permissão de localização negada. Habilite nas configurações do navegador para registrar o ponto.');
            break;
          case error.POSITION_UNAVAILABLE:
            setScanError('Localização indisponível. Verifique se o GPS está ativado.');
            break;
          case error.TIMEOUT:
            setScanError('Tempo esgotado ao obter localização. Tente novamente.');
            break;
          default:
            setScanError('Erro ao obter localização. Tente novamente.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0  // NUNCA usar cache
      }
    );

    // Timeout de segurança
    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
    }, 16000);
  };

  return (
    <Layout>
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', textAlign: 'center', gap: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h1 className="home-title" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>
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
          <button 
            onClick={handleRegistrarPonto}
            disabled={locationStatus === 'requesting'}
            className="glass-panel card home-card-neon" 
            style={{ width: '100%', border: 'none', cursor: locationStatus === 'requesting' ? 'wait' : 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'inherit' }}
          >
            <div className="card-icon">
              {locationStatus === 'requesting' ? (
                <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Smartphone size={40} />
              )}
            </div>
            <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
              {locationStatus === 'requesting' ? 'Obtendo localização...' : 'Registrar Ponto'}
            </h2>
            <p className="card-desc">
              {locationStatus === 'requesting' ? 'Aguarde...' : 'Registrar entrada/saída manualmente.'}
            </p>
          </button>

          <button 
            onClick={openScanner}
            className="glass-panel card home-card-neon" 
            style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'inherit' }}
          >
            <div className="card-icon">
              <ScanLine size={40} />
            </div>
            <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Escanear QR Code</h2>
            <p className="card-desc">
              Bater ponto ou vincular dispositivo.
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
              Aponte para um QR Code de ponto ou vinculação
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
