import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { institutionsAPI } from '../../services/api';

function InstitutionList() {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const data = await institutionsAPI.getAll();
                setInstitutions(data);
            } catch (err) {
                setError('Ошибка загрузки учреждений');
                console.error('Error fetching institutions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstitutions();
    }, []);

    if (loading) return <div style={styles.loading}>Загрузка...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            <h2>Театры и концертные залы</h2>

            <div style={styles.grid}>
                {institutions.map((institution) => (
                    <div key={institution.id} style={styles.card}>
                        <h3>{institution.name}</h3>
                        <p><strong>Адрес:</strong> {institution.address}</p>

                        <div style={styles.links}>
                            {institution.dgis_link && (
                                <a href={institution.dgis_link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                    2GIS
                                </a>
                            )}
                            {institution.yandex_maps_link && (
                                <a href={institution.yandex_maps_link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                    Яндекс Карты
                                </a>
                            )}
                        </div>

                        <Link to={`/institutions/${institution.id}`} style={styles.detailLink}>
                            Подробнее
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '2rem',
    },
    card: {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
    links: {
        margin: '1rem 0',
        display: 'flex',
        gap: '1rem',
    },
    link: {
        color: '#3498db',
        textDecoration: 'none',
        padding: '0.25rem 0.5rem',
        border: '1px solid #3498db',
        borderRadius: '4px',
    },
    detailLink: {
        color: '#27ae60',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
    loading: {
        textAlign: 'center',
        padding: '2rem',
        fontSize: '1.2rem',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        padding: '2rem',
        fontSize: '1.2rem',
    },
};

export default InstitutionList;
