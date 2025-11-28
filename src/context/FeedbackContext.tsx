import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import FeedbackModal, { FeedbackType } from '@/components/FeedbackModal';

interface FeedbackContextType {
    showFeedback: (type: FeedbackType, title: string, message: string, onConfirm?: () => void) => void;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showConfirm: (message: string, titleOrOnConfirm?: string | (() => void), title?: string) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        type: FeedbackType;
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        type: 'info',
        title: '',
        message: '',
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void) => {
        setModalConfig({ type, title, message, onConfirm });
        setIsOpen(true);
    };

    const showSuccess = (message: string, title: string = 'Sucesso') => {
        showFeedback('success', title, message);
    };

    const showError = (message: string, title: string = 'Erro') => {
        showFeedback('error', title, message);
    };

    // Suporta ambos: showConfirm(msg, title) retorna Promise<boolean>
    // ou showConfirm(msg, callback, title) para compatibilidade
    const showConfirm = (message: string, titleOrOnConfirm?: string | (() => void), title?: string): Promise<boolean> => {
        return new Promise((resolve) => {
            let finalTitle = 'Confirmação';
            let callback: (() => void) | undefined;

            if (typeof titleOrOnConfirm === 'function') {
                // Modo callback: showConfirm(msg, onConfirm, title?)
                callback = titleOrOnConfirm;
                finalTitle = title || 'Confirmação';
            } else if (typeof titleOrOnConfirm === 'string') {
                // Modo Promise: showConfirm(msg, title)
                finalTitle = titleOrOnConfirm;
            }

            resolveRef.current = resolve;

            setModalConfig({
                type: 'confirm',
                title: finalTitle,
                message,
                onConfirm: () => {
                    if (callback) callback();
                    resolve(true);
                }
            });
            setIsOpen(true);
        });
    };

    const closeFeedback = () => {
        setIsOpen(false);
        // Se for confirm e fechou sem confirmar, resolve com false
        if (modalConfig.type === 'confirm' && resolveRef.current) {
            resolveRef.current(false);
            resolveRef.current = null;
        }
    };

    return (
        <FeedbackContext.Provider value={{ showFeedback, showSuccess, showError, showConfirm }}>
            {children}
            <FeedbackModal
                isOpen={isOpen}
                onClose={closeFeedback}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
            />
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (context === undefined) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
}
