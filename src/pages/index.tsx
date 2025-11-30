import { useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { Smartphone, RefreshCw } from 'lucide-react';
import GradientButton from '@/components/GradientButton';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [scanError, setScanError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  

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
          <h1 className="home-title" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Image 
              src="/icons/icon-96x96.png" 
              alt="Ponto Digital" 
              width={80} 
              height={80}
              style={{ borderRadius: '16px' }}
            />
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
          <div className="glass-panel card" style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'inherit', padding: '1.5rem' }}>
            <div className="card-icon" style={{ marginBottom: '0.75rem', background: 'transparent', border: '1px solid #fff' }}>
              {locationStatus === 'requesting' ? (
                <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: '#fff' }} />
              ) : (
                <Smartphone size={32} style={{ color: '#fff' }} />
              )}
            </div>
            <h2 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              {locationStatus === 'requesting' ? 'Obtendo localização...' : 'Registrar Ponto'}
            </h2>
            <p className="card-desc" style={{ marginTop: '0.5rem' }}>
              {locationStatus === 'requesting' ? 'Aguarde...' : 'Registrar entrada/saída manualmente.'}
            </p>
            <div style={{ marginTop: '1rem' }}>
              <GradientButton
                onClick={handleRegistrarPonto}
                disabled={locationStatus === 'requesting'}
                width="150px"
                height="44px"
              >
                {locationStatus === 'requesting' ? 'Obtendo...' : 'Registrar'}
              </GradientButton>
            </div>
          </div>
        </div>
      </div>

      
    </Layout>
  );
}
