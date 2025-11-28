import React from 'react';
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
    if (!isOpen) return null;

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
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div 
                className="modal-content flex-center" 
                style={{ flexDirection: 'column', textAlign: 'center', maxWidth: '400px' }}
            >
                <button onClick={onClose} className="close-btn">
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
                            <button onClick={onClose} className="btn btn-outline">
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (onConfirm) onConfirm();
                                    onClose();
                                }}
                                className={`btn ${getButtonColor()}`}
                            >
                                Confirmar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
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
