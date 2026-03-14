import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reviewsAPI, institutionsAPI, eventsAPI } from '../../services/api';

function ReviewDetail() {
    const { id } = useParams();
    const [review, setReview] = useState(null);
    const [institution, setInstitution] = useState(null);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReviewData = async () => {
            try {
                setLoading(true);

                // Получаем данные отзыва
                const reviewData = await reviewsAPI.getById(id);
                setReview(reviewData);

                // Получаем данные учреждения
                if (reviewData.institution) {
                    const institutionData = await institutionsAPI.getById(reviewData.institution);
                    setInstitution(institutionData);
                }

                // Получаем данные мероприятия, если есть
                if (reviewData.event) {
                    const eventData = await eventsAPI.getById(reviewData.event);
                    setEvent(eventData);
                }

            } catch (err) {
                setError('Ошибка загрузки данных отзыва');
                console.error('Error fetching review:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewData();
    }, [id]);

    const handleConfirmAction = async (actionWord, accepted) => {
        try {
            await reviewsAPI.confirmAction(id, actionWord, accepted);
            setReview(prev => {
                if (!prev) return prev;
                const newPotential = (prev.potential_actions || []).filter(a => a !== actionWord);
                const newRequired = accepted
                    ? [...(prev.required_actions || []), actionWord]
                    : prev.required_actions;
                return {
                    ...prev,
                    potential_actions: newPotential,
                    required_actions: newRequired
                };
            });
        } catch (err) {
            console.error('Error confirming action:', err);
            alert('Ошибка при подтверждении действия');
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '#27ae60';
            case 'negative': return '#e74c3c';
            case 'neutral': return '#95a5a6';
            default: return '#34495e';
        }
    };

    const getSentimentText = (sentiment) => {
        switch (sentiment) {
            case 'positive':
                return 'положительный';
            case 'negative':
                return 'отрицательный';
            case 'neutral':
                return 'нейтральный';
            default:
                return sentiment;
        }
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '👍';
            case 'negative': return '👎';
            case 'neutral': return '🚫';
            default: return '📝';
        }
    };

    if (loading) return <div style={styles.loading}>Загрузка отзыва...</div>;
    if (error) return <div style={styles.error}>{error}</div>;
    if (!review) return <div style={styles.error}>Отзыв не найден</div>;

    return (
        <div style={styles.container}>
            <Link to="/reviews" style={styles.backLink}>← Назад к списку отзывов</Link>

            <div style={styles.reviewCard}>
                <div style={styles.header}>
                    <div style={styles.sentimentSection}>
                        <span
                            style={{
                                ...styles.sentimentBadge,
                                backgroundColor: getSentimentColor(review.sentiment)
                            }}
                        >
                            {getSentimentIcon(review.sentiment)} {getSentimentText(review.sentiment)}
                        </span>
                        <span style={styles.confidence}>
                            Уверенность модели: {(review.confidence * 100).toFixed(1)}%
                        </span>
                    </div>

                    <div style={styles.date}>
                        {new Date(review.reviewed_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>

                <div style={styles.content}>
                    <h3 style={styles.reviewTitle}>Текст отзыва:</h3>
                    <p style={styles.reviewText}>{review.text}</p>
                </div>

                {review.positive_aspects || review.negative_aspects || review.required_actions || review.potential_actions ? (
                    <div style={styles.aspects}>
                        <div style={styles.aspectsList}>
                            {review.positive_aspects?.map((aspect, index) => (
                                <span key={`positive-${index}`} style={styles.positiveTag}>
                                    {aspect.trim()}
                                </span>
                            ))}
                            {review.negative_aspects?.map((aspect, index) => (
                                <span key={`negative-${index}`} style={styles.negativeTag}>
                                    {aspect.trim()}
                                </span>
                            ))}
                            {review.required_actions?.map((action, index) => (
                                <span key={`required-${index}`} style={styles.actionTag}>
                                    🎯 {action.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}

                {review.potential_actions && review.potential_actions.length > 0 && (
                    <div style={styles.potentialSection}>
                        <h4 style={styles.potentialTitle}>Проверка потенциальных действий</h4>
                        <p style={styles.potentialDesc}>Являются ли следующие слова призывом к действию или предложением?</p>
                        <div style={styles.potentialList}>
                            {review.potential_actions.map((action, index) => (
                                <div key={`potential-confirm-${index}`} style={styles.potentialItem}>
                                    <span style={styles.potentialWord}>"{action.trim()}"</span>
                                    <div style={styles.potentialButtons}>
                                        <button style={styles.btnYes} onClick={() => handleConfirmAction(action.trim(), true)}>Да</button>
                                        <button style={styles.btnNo} onClick={() => handleConfirmAction(action.trim(), false)}>Нет</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={styles.metadata}>
                    <div style={styles.metadataItem}>
                        <strong>Учреждение:</strong>{' '}
                        {institution ? (
                            <Link to={`/institutions/${institution.id}`} style={styles.link}>
                                {institution.name}
                            </Link>
                        ) : (
                            'Не указано'
                        )}
                    </div>

                    {event && (
                        <div style={styles.metadataItem}>
                            <strong>Мероприятие:</strong>{' '}
                            <span style={styles.eventName}>{event.name}</span>
                        </div>
                    )}

                    <div style={styles.metadataItem}>
                        <strong>Источник:</strong>{' '}
                        <span style={styles.eventName}>{review.source}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
    },
    backLink: {
        color: '#3498db',
        textDecoration: 'none',
        marginBottom: '2rem',
        display: 'inline-block',
        fontSize: '1.1rem',
    },
    reviewCard: {
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        backgroundColor: 'white',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    sentimentSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    sentimentBadge: {
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        fontSize: '1rem',
        fontWeight: 'bold',
        display: 'inline-block',
        width: 'fit-content',
    },
    confidence: {
        fontSize: '0.9rem',
        color: '#7f8c8d',
    },
    date: {
        color: '#7f8c8d',
        fontSize: '0.9rem',
    },
    content: {
        marginBottom: '2rem',
    },
    reviewTitle: {
        marginBottom: '1rem',
        color: '#2c3e50',
    },
    reviewText: {
        lineHeight: '1.6',
        fontSize: '1.1rem',
        color: '#34495e',
        whiteSpace: 'pre-wrap',
    },
    keywordsSection: {
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
    },
    aspects: {
        marginBottom: '12px',
    },
    aspectsList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '4px',
    },
    positiveTag: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0'
    },
    negativeTag: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecaca'
    },
    actionTag: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: '#e0e7ff',
        color: '#3730a3',
        border: '1px solid #c7d2fe'
    },
    potentialSection: {
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        padding: '1.5rem',
        backgroundColor: '#fffbeb',
        borderRadius: '8px',
        border: '1px solid #fde68a'
    },
    potentialTitle: {
        margin: '0 0 0.5rem 0',
        color: '#92400e',
        fontSize: '1.1rem'
    },
    potentialDesc: {
        margin: '0 0 1rem 0',
        color: '#b45309',
        fontSize: '0.9rem'
    },
    potentialList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    potentialItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        backgroundColor: 'white',
        borderRadius: '6px',
        border: '1px solid #fcd34d'
    },
    potentialWord: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: '1rem'
    },
    potentialButtons: {
        display: 'flex',
        gap: '0.5rem'
    },
    btnYes: {
        padding: '0.4rem 1rem',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        transition: 'background-color 0.2s'
    },
    btnNo: {
        padding: '0.4rem 1rem',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        transition: 'background-color 0.2s'
    },
    metadata: {
        borderTop: '1px solid #eee',
        paddingTop: '1rem',
    },
    metadataItem: {
        marginBottom: '0.5rem',
        fontSize: '1rem',
    },
    link: {
        color: '#3498db',
        textDecoration: 'none',
    },
    eventType: {
        color: '#7f8c8d',
        marginLeft: '0.5rem',
    },
    loading: {
        textAlign: 'center',
        padding: '4rem',
        fontSize: '1.2rem',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        padding: '4rem',
        fontSize: '1.2rem',
    },
};

export default ReviewDetail;
