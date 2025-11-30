'use client';

import type { HTMLAttributes, CSSProperties } from 'react';

interface GradientButtonProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  width?: string;
  height?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const GradientButton = ({
  children,
  width = '160px',
  height = '48px',
  className = '',
  onClick,
  disabled = false,
  ...props
}: GradientButtonProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  // Estilos inline para o efeito rotativo (antes era no CSS global)
  const rotatingBorderStyle: CSSProperties = {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '50px',
    padding: '2px',
    background: 'conic-gradient(from var(--r), rgba(255,255,255,0.9), rgba(0,0,0,0.9), rgba(255,255,255,0.9))',
    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    maskComposite: 'exclude',
    animation: 'rotatingGradient 3s linear infinite',
  };

  return (
    <div className="gradient-btn-wrapper">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`gradient-btn-rotating ${disabled ? 'disabled' : ''} ${className}`}
        style={{
          minWidth: width,
          height: height
        }}
        onClick={disabled ? undefined : onClick}
        onKeyDown={handleKeyDown}
        aria-disabled={disabled}
        {...props}
      >
        {/* Pseudo-elemento para a borda rotativa */}
        <div style={rotatingBorderStyle} aria-hidden="true" />
        <div className="gradient-btn-inner">
          <span className="gradient-btn-label">
            {children}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GradientButton;
