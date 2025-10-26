import React, { useState, useEffect } from 'react';
import {eventsAPI} from '../../services/api';
import ConfirmModal from '../ConfirmModal';
import EventModal from "./EventModal";
import {Link} from "react-router-dom";

function EventList() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

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

    const handleAddEvent = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const handleEditEvent = (selectedEvent) => {
        setEditingEvent(selectedEvent);
        setIsModalOpen(true);
    };

    const handleDeleteEvent = (selectedEvent) => {
        setEventToDelete(selectedEvent);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!eventToDelete) return;

        try {
            await eventsAPI.delete(eventToDelete.id);
            await fetchEvents();
            setEventToDelete(null);
        } catch (err) {
            setError('Ошибка удаления мероприятия');
            console.error('Delete error:', err);
        }
    };

    const handleDeleteCancel = () => {
        setEventToDelete(null);
        setIsConfirmModalOpen(false);
    };

    const handleSaveSuccess = () => {
        fetchEvents();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    if (loading) return <div style={styles.loading}>Загрузка...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>Мероприятия</h2>
                <button onClick={handleAddEvent} style={styles.addButton}>
                    + Добавить мероприятие
                </button>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                    <tr>
                        <th style={styles.th}>Название</th>
                        <th style={styles.th}>Дата</th>
                        <th style={styles.th}>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {events.map((event) => (
                        <tr key={event.id}>
                            <td style={styles.td}>
                                <Link to={`/events/${event.id}`} style={styles.detailLink}>
                                    {event.name}
                                </Link>
                            </td>
                            <td style={styles.td}>
                                {new Date(event.date).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </td>
                            <td style={styles.td}>
                                <button
                                    onClick={() => handleEditEvent(event)}
                                    style={styles.editButton}
                                    title="Редактировать"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDeleteEvent(event)}
                                    style={styles.deleteButton}
                                    title="Удалить"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                existingEvent={editingEvent}
                onSave={handleSaveSuccess}
            />

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Подтверждение удаления"
                message={`Вы уверены, что хотите удалить мероприятие "${eventToDelete?.name}"? Это действие нельзя отменить.`}
                confirmText="Удалить"
                cancelText="Отмена"
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
    detailLink: {
        textDecoration: 'none',
        color: 'inherit',
        outline: 'none'
    }
};

export default EventList;
