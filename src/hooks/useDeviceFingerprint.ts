import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const DEVICE_ID_KEY = 'ponto_device_id';

// Gera um UUID v4
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Salva no IndexedDB para maior persistência
async function saveToIndexedDB(deviceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PontoDigitalDB', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('device')) {
                db.createObjectStore('device', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['device'], 'readwrite');
            const store = transaction.objectStore('device');
            store.put({ id: 'deviceId', value: deviceId });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };
    });
}

// Recupera do IndexedDB
async function getFromIndexedDB(): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PontoDigitalDB', 1);
        
        request.onerror = () => resolve(null);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('device')) {
                db.createObjectStore('device', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['device'], 'readonly');
            const store = transaction.objectStore('device');
            const getRequest = store.get('deviceId');
            
            getRequest.onsuccess = () => {
                resolve(getRequest.result?.value || null);
            };
            getRequest.onerror = () => resolve(null);
        };
    });
}

// Obtém ou gera o Device ID persistente
async function getOrCreateDeviceId(): Promise<string> {
    // 1. Tentar recuperar do localStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    // 2. Se não encontrou, tentar do IndexedDB
    if (!deviceId) {
        deviceId = await getFromIndexedDB();
    }
    
    // 3. Se ainda não tem, gerar novo UUID + fingerprint
    if (!deviceId) {
        try {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            // Combina UUID com parte do fingerprint para maior unicidade
            deviceId = `${generateUUID()}-${result.visitorId.substring(0, 8)}`;
        } catch {
            // Se fingerprint falhar, usa só UUID
            deviceId = generateUUID();
        }
    }
    
    // 4. Salvar em ambos os storages para redundância
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    try {
        await saveToIndexedDB(deviceId);
    } catch (e) {
        console.warn('Não foi possível salvar no IndexedDB:', e);
    }
    
    return deviceId;
}

export function useDeviceFingerprint() {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initDeviceId = async () => {
            try {
                const id = await getOrCreateDeviceId();
                console.log('📱 Device ID (Persistente):', id);
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
