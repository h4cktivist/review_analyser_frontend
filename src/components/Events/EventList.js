import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../../services/api';

function EventList() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await eventsAPI.getAll();
                setEvents(data);
            } catch (err) {
                setError('Ошибка загрузки мероприятий');
                console.error('Error fetching events:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) return <div style={styles.loading}>Загрузка...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            <h2>Мероприятия</h2>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                    <tr>
                        <th style={styles.th}>Название</th>
                        <th style={styles.th}>Тип</th>
                    </tr>
                    </thead>
                    <tbody>
                    {events.map((event) => (
                        <tr key={event.id}>
                            <td style={styles.td}>{event.name}</td>
                            <td style={styles.td}>{event.type}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
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
    tableContainer: {
        marginTop: '2rem',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
    th: {
        backgroundColor: '#34495e',
        color: 'white',
        padding: '1rem',
        textAlign: 'left',
        border: '1px solid #ddd',
    },
    td: {
        padding: '1rem',
        border: '1px solid #ddd',
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

export default EventList;
