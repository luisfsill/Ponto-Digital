import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const DEVICE_ID_KEY = 'ponto_device_id';

// Obtém o Device ID - prioriza localStorage, gera via fingerprint se não existir
async function getOrCreateDeviceId(): Promise<string> {
    // 1. Primeiro, tentar recuperar do localStorage (é persistente)
    const storedId = localStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
        console.log('📱 Device ID (localStorage):', storedId);
        return storedId;
    }
    
    // 2. Se não existe, gerar novo via FingerprintJS
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const deviceId = result.visitorId;
        
        // Salvar no localStorage para próximas vezes
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
        
        console.log('📱 Device ID (novo fingerprint):', deviceId);
        return deviceId;
    } catch (error) {
        console.error('Erro ao gerar fingerprint:', error);
        throw new Error('Não foi possível identificar o dispositivo');
    }
}

export function useDeviceFingerprint() {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initDeviceId = async () => {
            try {
                const id = await getOrCreateDeviceId();
                setDeviceId(id);
            } catch (err) {
                console.error('Failed to get device ID', err);
                setError('Failed to identify device');
            } finally {
                setLoading(false);
            }
        };

        initDeviceId();
    }, []);

    return { deviceId, loading, error };
}
