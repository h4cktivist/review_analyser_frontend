import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {eventsAPI, reviewsAPI} from '../../services/api';


function EventDetail() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [latestReviews, setLatestReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        const fetchInstitutionData = async () => {
            try {
                setLoading(true);

                const eventData = await eventsAPI.getById(id);
                setEvent(eventData);

                const allReviews = await reviewsAPI.getAll();

                const eventReviews = allReviews.filter(
                    review => review.event === parseInt(id)
                );

                setReviews(eventReviews);

                const sortedReviews = [...eventReviews].sort((a, b) =>
                    new Date(b.reviewed_at) - new Date(a.reviewed_at)
                );
                setLatestReviews(sortedReviews.slice(0, 3));

            } catch (err) {
                setError('Ошибка загрузки данных учреждения');
                console.error('Error fetching institution:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstitutionData();
    }, [id]);

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '#27ae60';
            case 'negative': return '#e74c3c';
            case 'neutral': return '#95a5a6';
            default: return '#34495e';
        }
    };

    const getSentimentText = (sentiment) => {
        switch(sentiment) {
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

    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;

        const truncated = text.substr(0, maxLength);
        return truncated.substr(0, Math.min(truncated.length, truncated.lastIndexOf(' '))) + '...';
    };

    const getReviewsStats = () => {
        const total = reviews.length;
        const positive = reviews.filter(r => r.sentiment === 'positive').length;
        const negative = reviews.filter(r => r.sentiment === 'negative').length;
        const spam = reviews.filter(r => r.sentiment === 'neutral').length;

        return { total, positive, negative, spam };
    };

    const stats = getReviewsStats();

    if (loading) return <div style={styles.loading}>Загрузка данных мероприятия...</div>;
    if (error) return <div style={styles.error}>{error}</div>;
    if (!event) return <div style={styles.error}>Мероприятие не найдено</div>;

    return (
        <div style={styles.container}>
            <nav style={styles.breadcrumb}>
                <Link to="/events" style={styles.breadcrumbLink}>Мероприятия</Link>
                <span style={styles.breadcrumbSeparator}>/</span>
                <span style={styles.breadcrumbCurrent}>{event.name}</span>
            </nav>

            <div style={styles.header}>
                <h1 style={styles.title}>{event.name}</h1>
            </div>

            <div style={styles.mainInfo}>
                <div style={styles.statsCard}>
                    <h3 style={styles.infoTitle}>Статистика</h3>
                    <div style={styles.statsGrid}>
                        <div style={styles.statItem}>
                            <span style={styles.statNumber}>{stats.total}</span>
                            <span style={styles.statLabel}>Всего отзывов</span>
                        </div>
                        <div style={{...styles.statItem, color: '#27ae60'}}>
                            <span style={styles.statNumber}>{stats.positive}</span>
                            <span style={styles.statLabel}>Положительных</span>
                        </div>
                        <div style={{...styles.statItem, color: '#e74c3c'}}>
                            <span style={styles.statNumber}>{stats.negative}</span>
                            <span style={styles.statLabel}>Отрицательных</span>
                        </div>
                        <div style={{...styles.statItem, color: '#95a5a6'}}>
                            <span style={styles.statNumber}>{stats.spam}</span>
                            <span style={styles.statLabel}>Нейтальных</span>
                        </div>
                    </div>
                </div>
            </div>

            {latestReviews.length > 0 && (
                <div style={styles.latestReviews}>
                    <h3 style={styles.sectionTitle}>Последние отзывы</h3>
                    <div style={styles.reviewsGrid}>
                        {latestReviews.map((review) => (
                            <div key={review.id} style={styles.reviewCard}>
                                <div style={styles.reviewHeader}>
                  <span
                      style={{
                          ...styles.sentimentBadge,
                          backgroundColor: getSentimentColor(review.sentiment)
                      }}
                  >
                    {getSentimentText(review.sentiment)}
                  </span>
                                    <span style={styles.reviewDate}>
                    {new Date(review.reviewed_at).toLocaleDateString('ru-RU')}
                  </span>
                                </div>

                                <p style={styles.reviewText}>
                                    {truncateText(review.text, 120)}
                                </p>

                                <div style={styles.reviewFooter}>
                                    <Link to={`/reviews/${review.id}`} style={styles.detailLink}>
                                        Подробнее →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    {reviews.length > 3 && (
                        <div style={styles.moreReviews}>
                            <Link to="/reviews" style={styles.moreLink}>
                                Показать все {reviews.length} отзывов →
                            </Link>
                        </div>
                    )}
                </div>
            )}

            <div style={styles.tabs}>
                <button
                    onClick={() => setActiveTab('info')}
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'info' ? styles.activeTab : {})
                    }}
                >
                    Позитивные и негативные аспекты
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'reviews' ? styles.activeTab : {})
                    }}
                >
                    Предлагаемые действия
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '80vh',
    },
    breadcrumb: {
        marginBottom: '2rem',
        fontSize: '0.9rem',
        color: '#7f8c8d',
    },
    breadcrumbLink: {
        color: '#3498db',
        textDecoration: 'none',
    },
    breadcrumbSeparator: {
        margin: '0 0.5rem',
    },
    breadcrumbCurrent: {
        color: '#2c3e50',
        fontWeight: 'bold',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    title: {
        color: '#2c3e50',
        fontSize: '2.5rem',
        margin: 0,
    },
    mainInfo: {
        display: 'grid',
        gap: '2rem',
        marginBottom: '3rem',
    },
    statsCard: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    infoTitle: {
        marginTop: 0,
        marginBottom: '1.5rem',
        color: '#2c3e50',
        fontSize: '1.3rem',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    statItem: {
        textAlign: 'center',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
    },
    statNumber: {
        display: 'block',
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem',
    },
    statLabel: {
        fontSize: '0.9rem',
        color: '#7f8c8d',
    },
    latestReviews: {
        marginBottom: '3rem',
    },
    sectionTitle: {
        color: '#2c3e50',
        fontSize: '1.5rem',
        marginBottom: '1.5rem',
    },
    reviewsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
    },
    reviewCard: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '2px solid #f8f9fa',
    },
    reviewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    sentimentBadge: {
        color: 'white',
        padding: '0.3rem 0.8rem',
        borderRadius: '15px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
    },
    reviewDate: {
        fontSize: '0.8rem',
        color: '#7f8c8d',
    },
    reviewText: {
        lineHeight: '1.6',
        marginBottom: '1rem',
        fontSize: '0.95rem',
    },
    reviewFooter: {
        textAlign: 'right',
    },
    detailLink: {
        color: '#3498db',
        textDecoration: 'none',
        fontSize: '0.9rem',
    },
    moreReviews: {
        textAlign: 'center',
    },
    moreLink: {
        color: '#3498db',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '1rem',
    },
    tabs: {
        display: 'flex',
        marginBottom: '2rem',
        borderBottom: '1px solid #ddd',
    },
    tab: {
        padding: '1rem 2rem',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '1rem',
        borderBottom: '3px solid transparent',
        transition: 'all 0.2s',
    },
    activeTab: {
        borderBottomColor: '#3498db',
        color: '#3498db',
        fontWeight: 'bold',
    },
    tabContent: {
        minHeight: '400px',
    },
    infoContent: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    error: {
        textAlign: 'center',
        padding: '4rem',
        fontSize: '1.2rem',
        color: '#e74c3c',
        backgroundColor: '#ffeaea',
        borderRadius: '8px',
        margin: '2rem',
    },
    loading: {
        textAlign: 'center',
        padding: '4rem',
        fontSize: '1.2rem',
        color: '#7f8c8d',
    },
};

export default EventDetail;
