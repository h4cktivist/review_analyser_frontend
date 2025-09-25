import React from 'react';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Удалить", cancelText = "Отмена" }) {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div style={styles.overlay} onClick={handleOverlayClick}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3 style={styles.title}>{title}</h3>
                    <button onClick={onClose} style={styles.closeButton}>×</button>
                </div>

                <div style={styles.content}>
                    <p style={styles.message}>{message}</p>
                </div>

                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.cancelButton}>
                        {cancelText}
                    </button>
                    <button onClick={handleConfirm} style={styles.confirmButton}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '1rem',
    },
    modal: {
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem',
        borderBottom: '1px solid #e9ecef',
    },
    title: {
        margin: 0,
        fontSize: '1.3rem',
        color: '#2c3e50',
        fontWeight: '600',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        color: '#7f8c8d',
        padding: 0,
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: '1.5rem',
    },
    message: {
        margin: 0,
        color: '#5a6c7d',
        lineHeight: '1.5',
        fontSize: '1rem',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        padding: '1.5rem',
        borderTop: '1px solid #e9ecef',
    },
    cancelButton: {
        padding: '0.75rem 1.5rem',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        color: '#5a6c7d',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    confirmButton: {
        padding: '0.75rem 1.5rem',
        border: 'none',
        backgroundColor: '#e74c3c',
        color: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        transition: 'all 0.2s',
    },
};

export default ConfirmModal;
