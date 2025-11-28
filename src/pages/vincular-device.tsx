import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';
import { Smartphone, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function VincularDevice() {
    const router = useRouter();
    const { userId } = router.query;
    const { deviceId, loading: fpLoading } = useDeviceFingerprint();

    const [status, setStatus] = useState<'idle' | 'binding' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (userId && deviceId && status === 'idle') {
            bindDevice();
        }
    }, [userId, deviceId, status]);

    const bindDevice = async () => {
        if (!userId || !deviceId) return;

        setStatus('binding');
        try {
            const res = await fetch('/api/device-bind', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, deviceId }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message || 'Dispositivo vinculado com sucesso!');
            } else {
                setStatus('error');
                setMessage(data.error || 'Falha ao vincular dispositivo');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Erro de conexão');
        }
    };

    return (
        <Layout title="Vincular Dispositivo">
            <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="mb-6 p-4 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)' }}>
                        <Smartphone size={48} />
                    </div>

                    <h1 className="text-2xl font-bold mb-2">Configuração de Ponto</h1>

                    {fpLoading || status === 'binding' ? (
                        <div className="flex-center" style={{ flexDirection: 'column' }}>
                            <div style={{ height: '1rem', width: '8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                            <p className="text-muted">Identificando dispositivo...</p>
                        </div>
                    ) : status === 'success' ? (
                        <div className="flex-center" style={{ flexDirection: 'column', color: 'var(--success)' }}>
                            <CheckCircle size={32} className="mb-2" />
                            <p className="font-bold">{message}</p>
                            <p className="text-sm text-muted mt-4">
                                Agora você pode registrar seu ponto escaneando o QR Code do local.
                            </p>
                        </div>
                    ) : status === 'error' ? (
                        <div className="flex-center" style={{ flexDirection: 'column', color: 'var(--error)' }}>
                            <AlertCircle size={32} className="mb-2" />
                            <p className="font-bold">{message}</p>
                            <p className="text-sm text-muted mt-4">
                                Tente novamente ou contate o administrador.
                            </p>
                        </div>
                    ) : (
                        <p className="text-muted">Aguardando dados...</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}
