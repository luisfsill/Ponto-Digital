import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';
import { MapPin, CheckCircle, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Ponto() {
    const router = useRouter();
    const { geofenceId } = router.query;
    const { deviceId, loading: fpLoading } = useDeviceFingerprint();
    const [location, setLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
    const [locLoading, setLocLoading] = useState(true);
    const [locError, setLocError] = useState<string | null>(null);

    const [status, setStatus] = useState<'idle' | 'registering' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    });
                    setLocLoading(false);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setLocError('Permissão de localização negada ou indisponível.');
                    setLocLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocError('Geolocalização não suportada neste navegador.');
            setLocLoading(false);
        }
    }, []);

    const handleRegister = async () => {
        if (!deviceId || !location) return;

        setStatus('registering');
        try {
            const res = await fetch('/api/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId,
                    location,
                    geofenceId: geofenceId || undefined,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
                setUserName(data.user);
            } else {
                setStatus('error');
                setMessage(data.error || 'Falha ao registrar ponto');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Erro de conexão');
        }
    };

    // Auto-register when ready
    useEffect(() => {
        if (deviceId && location && status === 'idle' && !locError) {
            handleRegister();
        }
    }, [deviceId, location, status, locError]);

    return (
        <Layout title="Registrar Ponto">
            <div className="flex-center" style={{ minHeight: '70vh', flexDirection: 'column', textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Status Indicators */}
                    <div className="mb-8">
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            {format(new Date(), 'HH:mm', { locale: ptBR })}
                        </div>
                        <div className="text-muted">
                            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </div>
                    </div>

                    {(fpLoading || locLoading || status === 'registering') ? (
                        <div className="flex-center" style={{ flexDirection: 'column', padding: '2rem 0' }}>
                            <RefreshCw className="text-primary mb-4" size={48} style={{ animation: 'spin 1s linear infinite' }} />
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            <p className="text-muted font-bold">
                                {fpLoading ? 'Identificando dispositivo...' :
                                    locLoading ? 'Obtendo localização...' :
                                        'Registrando ponto...'}
                            </p>
                        </div>
                    ) : status === 'success' ? (
                        <div className="flex-center" style={{ flexDirection: 'column', padding: '1rem 0' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--success)' }}>
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-success font-bold mb-2" style={{ fontSize: '1.5rem' }}>
                                Ponto Registrado!
                            </h2>
                            <p className="font-bold mb-1" style={{ fontSize: '1.125rem' }}>Olá, {userName}</p>
                            <p className="text-sm text-muted">{message}</p>
                        </div>
                    ) : (
                        <div className="flex-center" style={{ flexDirection: 'column', padding: '1rem 0' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--error)' }}>
                                <AlertTriangle size={40} />
                            </div>
                            <h2 className="text-error font-bold mb-2" style={{ fontSize: '1.25rem' }}>
                                Não foi possível registrar
                            </h2>
                            <p className="text-muted mb-4">
                                {locError || message}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary mt-4"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    )}

                    {/* Location Debug Info */}
                    {location && (
                        <div className="mt-4 text-xs text-muted flex-center">
                            <MapPin size={12} style={{ marginRight: '4px' }} />
                            <span>
                                {location.lat.toFixed(4)}, {location.lon.toFixed(4)} (±{Math.round(location.accuracy)}m)
                            </span>
                        </div>
                    )}

                    <Link href="/" className="btn btn-outline" style={{ marginTop: '1.5rem', width: '100%' }}>
                        <ArrowLeft size={16} />
                        Voltar para Início
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
