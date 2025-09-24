import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { institutionsAPI } from '../../services/api';
import InstitutionModal from './InstitutionModal';

function InstitutionList() {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInstitution, setEditingInstitution] = useState(null);

    useEffect(() => {
        fetchInstitutions();
    }, []);

    const fetchInstitutions = async () => {
        try {
            setLoading(true);
            const data = await institutionsAPI.getAll();
            setInstitutions(data);
        } catch (err) {
            setError('Ошибка загрузки учреждений');
            console.error('Error fetching institutions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInstitution = () => {
        setEditingInstitution(null);
        setIsModalOpen(true);
    };

    const handleEditInstitution = (institution) => {
        setEditingInstitution(institution);
        setIsModalOpen(true);
    };

    const handleDeleteInstitution = async (institution) => {
        if (window.confirm(`Вы уверены, что хотите удалить учреждение "${institution.name}"?`)) {
            try {
                await institutionsAPI.delete(institution.id);
                await fetchInstitutions(); // Перезагружаем список
            } catch (err) {
                setError('Ошибка удаления учреждения');
                console.error('Delete error:', err);
            }
        }
    };

    const handleSaveSuccess = () => {
        fetchInstitutions();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingInstitution(null);
    };

    if (loading) return <div style={styles.loading}>Загрузка...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>Театры и концертные залы</h2>
                <button onClick={handleAddInstitution} style={styles.addButton}>
                    + Добавить учреждение
                </button>
            </div>

            <div style={styles.grid}>
                {institutions.map((institution) => (
                    <div key={institution.id} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h3 style={styles.cardTitle}>{institution.name}</h3>
                            <div style={styles.cardActions}>
                                <button
                                    onClick={() => handleEditInstitution(institution)}
                                    style={styles.editButton}
                                    title="Редактировать"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDeleteInstitution(institution)}
                                    style={styles.deleteButton}
                                    title="Удалить"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <p style={styles.address}>
                            <strong>Адрес:</strong> {institution.address}
                        </p>

                        <div style={styles.links}>
                            {institution.dgis_link && (
                                <a
                                    href={institution.dgis_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.link}
                                >
                                    2GIS
                                </a>
                            )}
                            {institution.yandex_maps_link && (
                                <a
                                    href={institution.yandex_maps_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.link}
                                >
                                    Яндекс Карты
                                </a>
                            )}
                        </div>

                        <div style={styles.cardFooter}>
                            <Link to={`/institutions/${institution.id}`} style={styles.detailLink}>
                                Подробнее и отзывы →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {institutions.length === 0 && (
                <div style={styles.emptyState}>
                    <h3>Пока нет учреждений</h3>
                    <p>Добавьте первое учреждение, чтобы начать работу с отзывами</p>
                    <button onClick={handleAddInstitution} style={styles.addButton}>
                        + Добавить учреждение
                    </button>
                </div>
            )}

            {/* Модальное окно для добавления/редактирования */}
            <InstitutionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                institution={editingInstitution}
                onSave={handleSaveSuccess}
            />
        </div>
    );
}

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    addButton: {
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        textDecoration: 'none',
        display: 'inline-block',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '2rem',
    },
    card: {
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backgroundColor: 'white',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem',
    },
    cardTitle: {
        margin: 0,
        color: '#2c3e50',
        fontSize: '1.3rem',
        flex: 1,
        marginRight: '1rem',
    },
    cardActions: {
        display: 'flex',
        gap: '0.5rem',
    },
    editButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.2rem',
        padding: '0.25rem',
        borderRadius: '4px',
        transition: 'background-color 0.2s',
    },
    deleteButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.2rem',
        padding: '0.25rem',
        borderRadius: '4px',
        transition: 'background-color 0.2s',
        color: '#e74c3c',
    },
    address: {
        margin: '1rem 0',
        color: '#7f8c8d',
        lineHeight: '1.5',
    },
    links: {
        display: 'flex',
        gap: '1rem',
        margin: '1rem 0',
    },
    link: {
        color: '#3498db',
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        border: '1px solid #3498db',
        borderRadius: '4px',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
    },
    cardFooter: {
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid #eee',
    },
    detailLink: {
        color: '#3498db',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '1rem',
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        color: '#7f8c8d',
    },
    loading: {
        textAlign: 'center',
        padding: '4rem',
        fontSize: '1.2rem',
        color: '#7f8c8d',
    },
    error: {
        textAlign: 'center',
        padding: '2rem',
        color: '#e74c3c',
        backgroundColor: '#ffeaea',
        borderRadius: '8px',
        margin: '2rem',
    },
};

export default InstitutionList;
