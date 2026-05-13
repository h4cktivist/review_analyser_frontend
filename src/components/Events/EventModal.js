import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../../services/api';

function EventModal({ isOpen, onClose, existingEvent, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        is_rent: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (existingEvent) {
            setFormData({
                name: existingEvent.name || '',
                date: existingEvent.date || '',
                is_rent: Boolean(existingEvent.is_rent),
            });
        } else {
            setFormData({
                name: '',
                date: '',
                is_rent: false,
            });
        }
        setError('');
    }, [existingEvent, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (existingEvent) {
                await eventsAPI.update(existingEvent.id, formData);
            } else {
                await eventsAPI.create(formData);
            }

            onSave();
            onClose();

        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения метроприятия');
            console.error('Save event error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={handleOverlayClick}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>
                        {existingEvent ? 'Редактировать мероприятие' : 'Добавить новое мероприятие'}
                    </h2>
                    <button onClick={onClose} style={styles.closeButton}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && <div style={styles.error}>{error}</div>}

                    <div style={styles.formGroup}>
                        <label htmlFor="name" style={styles.label}>
                            Название мероприятия *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            placeholder="Например: Концерт"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="date" style={styles.label}>
                            Дата *
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={
                                formData.date && !isNaN(new Date(formData.date).getTime())
                                    ? new Date(formData.date).toISOString().split('T')[0]
                                    : ''
                            }
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="is_rent"
                                checked={formData.is_rent}
                                onChange={handleChange}
                                style={styles.checkbox}
                            />
                            Арендное мероприятие
                        </label>
                    </div>

                    <div style={styles.footer}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={styles.cancelButton}
                            disabled={loading}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={styles.submitButton}
                        >
                            {loading ? 'Сохранение...' : (existingEvent ? 'Сохранить' : 'Добавить')}
                        </button>
                    </div>
                </form>
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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
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
        fontSize: '1.5rem',
        color: '#2c3e50',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '2rem',
        cursor: 'pointer',
        color: '#7f8c8d',
        padding: 0,
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    form: {
        padding: '1.5rem',
    },
    error: {
        backgroundColor: '#ffeaea',
        color: '#e74c3c',
        padding: '0.75rem',
        borderRadius: '6px',
        marginBottom: '1rem',
        fontSize: '0.9rem',
    },
    formGroup: {
        marginBottom: '1.5rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '600',
        color: '#2c3e50',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '1rem',
        transition: 'border-color 0.2s',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '600',
        color: '#2c3e50',
        cursor: 'pointer',
    },
    checkbox: {
        width: '1.1rem',
        height: '1.1rem',
        cursor: 'pointer',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e9ecef',
    },
    cancelButton: {
        padding: '0.75rem 1.5rem',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        color: '#7f8c8d',
    },
    submitButton: {
        padding: '0.75rem 1.5rem',
        border: 'none',
        backgroundColor: '#3498db',
        color: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
    },
};

export default EventModal;
