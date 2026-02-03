import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000); // Auto close after 4s
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        toast: {
            position: 'fixed',
            top: '20px',
            right: '20px', // Top-right corner
            zIndex: 9999,
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out',
            minWidth: '300px',
            maxWidth: '400px',
            backgroundColor: type === 'error' ? '#ef4444' : '#3b82f6',
            color: '#ffffff',
            border: `1px solid ${type === 'error' ? '#dc2626' : '#2563eb'}`
        },
        icon: {
            fontSize: '1.2rem'
        },
        close: {
            marginLeft: 'auto',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            fontSize: '1.2rem',
            fontWeight: 'bold'
        }
    };

    return (
        <div style={styles.toast}>
            <span style={styles.icon}>{type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{message}</span>
            <button style={styles.close} onClick={onClose}>×</button>
            <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
