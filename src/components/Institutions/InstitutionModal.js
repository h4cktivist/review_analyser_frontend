import React, { useState, useEffect } from 'react';
import { institutionsAPI } from '../../services/api';

function InstitutionModal({ isOpen, onClose, institution, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        gis_map_link: '',
        yandex_map_link: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (institution) {
            setFormData({
                name: institution.name || '',
                address: institution.address || '',
                gis_map_link: institution.gis_map_link || '',
                yandex_map_link: institution.yandex_map_link || ''
            });
        } else {
            setFormData({
                name: '',
                address: '',
                gis_map_link: '',
                yandex_map_link: ''
            });
        }
        setError('');
    }, [institution, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (institution) {
                await institutionsAPI.update(institution.id, formData);
            } else {
                await institutionsAPI.create(formData);
            }

            onSave();
            onClose();

        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка сохранения учреждения');
            console.error('Save institution error:', err);
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
                        {institution ? 'Редактировать учреждение' : 'Добавить новое учреждение'}
                    </h2>
                    <button onClick={onClose} style={styles.closeButton}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && <div style={styles.error}>{error}</div>}

                    <div style={styles.formGroup}>
                        <label htmlFor="name" style={styles.label}>
                            Название учреждения *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            placeholder="Например: Тюменский Большой драматический театр"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="address" style={styles.label}>
                            Адрес *
                        </label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            placeholder="Например: Улица Республики, 129"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="gis_map_link" style={styles.label}>
                            Ссылка на 2GIS *
                        </label>
                        <input
                            type="url"
                            id="gis_map_link"
                            name="gis_map_link"
                            value={formData.gis_map_link}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            placeholder="https://2gis.ru/..."
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="yandex_map_link" style={styles.label}>
                            Ссылка на Яндекс Карты *
                        </label>
                        <input
                            type="url"
                            id="yandex_map_link"
                            name="yandex_map_link"
                            value={formData.yandex_map_link}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            placeholder="https://yandex.ru/maps/..."
                        />
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
                            {loading ? 'Сохранение...' : (institution ? 'Сохранить' : 'Добавить')}
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

export default InstitutionModal;
