import React, { createContext, useContext, useState, ReactNode } from 'react';
import FeedbackModal, { FeedbackType } from '@/components/FeedbackModal';

interface FeedbackContextType {
    showFeedback: (type: FeedbackType, title: string, message: string, onConfirm?: () => void) => void;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
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

    const showConfirm = (message: string, onConfirm: () => void, title: string = 'Confirmação') => {
        showFeedback('confirm', title, message, onConfirm);
    };

    const closeFeedback = () => {
        setIsOpen(false);
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
