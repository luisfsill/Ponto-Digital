import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: FeedbackType;
    title: string;
    message: string;
    onConfirm?: () => void;
}

export default function FeedbackModal({
    isOpen,
    onClose,
    type,
    title,
    message,
    onConfirm,
}: FeedbackModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShouldRender(false);
            setIsClosing(false);
            onClose();
        }, 250); // Duração da animação de saída
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        handleClose();
    };

    if (!shouldRender) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={48} className="text-success" />;
            case 'error':
                return <XCircle size={48} className="text-error" />;
            case 'warning':
            case 'confirm':
                return <AlertTriangle size={48} className="text-warning" />;
            case 'info':
            default:
                return <Info size={48} className="text-primary" />;
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'success': return 'btn-primary';
            case 'error': return 'btn-primary';
            case 'confirm': return 'btn-primary';
            default: return 'btn-primary';
        }
    };

    return (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} style={{ zIndex: 1000 }}>
            <div 
                className={`modal-content flex-center ${isClosing ? 'closing' : ''}`}
                style={{ flexDirection: 'column', textAlign: 'center', maxWidth: '400px' }}
            >
                <button onClick={handleClose} className="close-btn">
                    <X size={24} />
                </button>

                <div className="mb-6">
                    {getIcon()}
                </div>

                <h2 className="text-xl font-bold mb-3">{title}</h2>
                <p className="text-muted mb-8" style={{ lineHeight: 1.6 }}>{message}</p>

                <div className="modal-actions w-full">
                    {type === 'confirm' ? (
                        <>
                            <button onClick={handleClose} className="btn btn-outline">
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`btn ${getButtonColor()}`}
                            >
                                Confirmar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleClose}
                            className={`btn ${getButtonColor()} w-full`}
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
