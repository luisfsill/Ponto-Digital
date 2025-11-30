'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, QrCode } from 'lucide-react';

interface QRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

export default function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasStarted = useRef(false);

    useEffect(() => {
        if (isOpen && !hasStarted.current) {
            startScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isOpen]);

    const startScanner = async () => {
        if (hasStarted.current) return;
        hasStarted.current = true;
        setError(null);

        try {
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
                    onScan(decodedText);
                    stopScanner();
                    onClose();
                },
                () => {
                    // Erro de leitura (ignorar, continua tentando)
                }
            );
            setIsScanning(true);
        } catch (err) {
            console.error('Erro ao iniciar scanner:', err);
            setError('Não foi possível acessar a câmera. Verifique as permissões.');
            hasStarted.current = false;
        }
    };

    const stopScanner = async () => {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        hasStarted.current = false;
        setIsScanning(false);

        if (scanner) {
            try {
                if (scanner.isScanning) {
                    await scanner.stop();
                }
                scanner.clear();
            } catch (err) {
                console.error('Erro ao parar scanner:', err);
            }
        }
    };

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '400px', padding: '1.5rem' }}
            >
                <button onClick={handleClose} className="close-btn">
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        background: 'rgba(99, 102, 241, 0.2)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <QrCode size={28} className="text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Escanear QR Code</h2>
                    <p className="text-sm text-muted">
                        Aponte a câmera para o QR Code de vinculação
                    </p>
                </div>

                {error ? (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        <Camera size={18} />
                        {error}
                    </div>
                ) : (
                    <div 
                        id="qr-reader" 
                        style={{ 
                            width: '100%', 
                            borderRadius: '12px', 
                            overflow: 'hidden',
                            background: '#000'
                        }}
                    />
                )}

                {!isScanning && !error && (
                    <div className="flex-center" style={{ padding: '2rem' }}>
                        <div className="text-muted">Iniciando câmera...</div>
                    </div>
                )}
            </div>
        </div>
    );
}
