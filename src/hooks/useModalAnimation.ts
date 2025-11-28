import { useState, useEffect, useCallback } from 'react';

interface UseModalAnimationProps {
    isOpen: boolean;
    onClose: () => void;
    animationDuration?: number;
}

interface UseModalAnimationReturn {
    shouldRender: boolean;
    isClosing: boolean;
    handleClose: () => void;
}

export function useModalAnimation({
    isOpen,
    onClose,
    animationDuration = 250,
}: UseModalAnimationProps): UseModalAnimationReturn {
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setShouldRender(false);
            setIsClosing(false);
            onClose();
        }, animationDuration);
    }, [onClose, animationDuration]);

    return {
        shouldRender,
        isClosing,
        handleClose,
    };
}
