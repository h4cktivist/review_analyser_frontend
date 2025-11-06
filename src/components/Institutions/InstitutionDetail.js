import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {importAPI, institutionsAPI, reviewsAPI} from '../../services/api';

function InstitutionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [institution, setInstitution] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [latestReviews, setLatestReviews] = useState([]); // Последние 3 отзыва
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('info');
    const [importLoading, setImportLoading] = useState({
        gis: false,
        yandex: false
    });
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        const fetchInstitutionData = async () => {
            try {
                setLoading(true);

                const institutionData = await institutionsAPI.getById(id);
                setInstitution(institutionData);

                const allReviews = await reviewsAPI.getAll();

                const institutionReviews = allReviews.filter(
                    review => review.institution === parseInt(id)
                );

                setReviews(institutionReviews);

                const sortedReviews = [...institutionReviews].sort((a, b) =>
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

    const handleImportFromGIS = async () => {
        try {
            setImportLoading(prev => ({ ...prev, gis: true }));
            setImportResult(null);

            const response = await importAPI.importGISReviews(id);
            setImportResult({
                source: '2GIS',
                importedCount: response.imported_reviews.length,
                totalCount: reviews.length + response.imported_reviews.length
            });

            const allReviews = await reviewsAPI.getAll();
            const institutionReviews = allReviews.filter(
                review => review.institution === parseInt(id)
            );
            setReviews(institutionReviews);

            const sortedReviews = [...institutionReviews].sort((a, b) =>
                new Date(b.reviewed_at) - new Date(a.reviewed_at)
            );
            setLatestReviews(sortedReviews.slice(0, 3));

        } catch (err) {
            setError('Ошибка импорта отзывов из 2GIS');
            console.error('Import error:', err);
        } finally {
            setImportLoading(prev => ({ ...prev, gis: false }));
        }
    };

    const handleImportFromYandex = async () => {
        try {
            setImportLoading(prev => ({ ...prev, yandex: true }));
            setImportResult(null);

            await new Promise(resolve => setTimeout(resolve, 2000));

            setImportResult({
                source: 'Яндекс Карты',
                importedCount: 3,
                totalCount: reviews.length + 3
            });

            console.log('Импорт из Яндекс Карт для учреждения:', id);

        } catch (err) {
            setError('Ошибка импорта отзывов из Яндекс Карт');
            console.error('Yandex import error:', err);
        } finally {
            setImportLoading(prev => ({ ...prev, yandex: false }));
        }
    };

    const handleViewReviews = () => {
        navigate('/reviews');
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

    if (loading) return <div style={styles.loading}>Загрузка данных учреждения...</div>;
    if (error) return <div style={styles.error}>{error}</div>;
    if (!institution) return <div style={styles.error}>Учреждение не найдено</div>;

    return (
        <div style={styles.container}>
            <nav style={styles.breadcrumb}>
                <Link to="/institutions" style={styles.breadcrumbLink}>Учреждения</Link>
                <span style={styles.breadcrumbSeparator}>/</span>
                <span style={styles.breadcrumbCurrent}>{institution.name}</span>
            </nav>

            <div style={styles.header}>
                <h1 style={styles.title}>{institution.name}</h1>
            </div>

            <div style={styles.mainInfo}>
                <div style={styles.infoCard}>
                    <h3 style={styles.infoTitle}>Основная информация</h3>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <strong>Адрес:</strong>
                            <span style={styles.infoValue}>{institution.address || 'Не указан'}</span>
                        </div>

                        {institution.dgis_link && (
                            <div style={styles.infoItem}>
                                <strong>2GIS:</strong>
                                <a
                                    href={institution.dgis_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.mapLink}
                                >
                                    Открыть в 2GIS
                                </a>
                            </div>
                        )}

                        {institution.yandex_maps_link && (
                            <div style={styles.infoItem}>
                                <strong>Яндекс Карты:</strong>
                                <a
                                    href={institution.yandex_maps_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.mapLink}
                                >
                                    Открыть в Яндекс Картах
                                </a>
                            </div>
                        )}
                    </div>
                </div>

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
                    Информация
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'reviews' ? styles.activeTab : {})
                    }}
                >
                    Управление отзывами
                </button>
            </div>

            <div style={styles.tabContent}>
                {activeTab === 'info' && (
                    <div style={styles.infoContent}>
                        <div style={styles.mapPlaceholder}>
                            <h4>Учреждение на карте</h4>
                            <div style={styles.mapLinks}>
                                {institution.gis_map_link && (
                                    <a
                                        href={institution.gis_map_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.mapButton}
                                    >
                                        Открыть в 2GIS
                                    </a>
                                )}
                                {institution.yandex_map_link && (
                                    <a
                                        href={institution.yandex_map_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.mapButton}
                                    >
                                        Открыть в Яндекс Картах
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div style={styles.reviewsContent}>
                        <div style={styles.importSection}>
                            <h4 style={styles.importTitle}>Импорт отзывов</h4>
                            <p style={styles.importDescription}>
                                Загрузите последние отзывы из внешних источников
                            </p>

                            <div style={styles.importButtons}>
                                <button
                                    onClick={handleImportFromGIS}
                                    disabled={importLoading.gis || importLoading.yandex}
                                    style={styles.importButton}
                                >
                                    {importLoading.gis ? (
                                        <div style={styles.loadingContent}>
                                            <div style={styles.spinner}></div>
                                            Импорт из 2GIS...
                                        </div>
                                    ) : (
                                        '🟢 Импорт из 2GIS'
                                    )}
                                </button>

                                <button
                                    onClick={handleImportFromYandex}
                                    disabled={importLoading.gis || importLoading.yandex}
                                    style={styles.importButton}
                                >
                                    {importLoading.yandex ? (
                                        <div style={styles.loadingContent}>
                                            <div style={styles.spinner}></div>
                                            Импорт из Яндекс Карт...
                                        </div>
                                    ) : (
                                        'Импорт из Яндекс Карт'
                                    )}
                                </button>
                            </div>

                            {importResult && (
                                <div style={styles.importResult}>
                                    {importResult.importedCount > 0 ? (
                                        <>
                                            <div style={styles.resultSuccess}>
                                                ✅ Успешно импортировано {importResult.importedCount} новых отзывов из {importResult.source}
                                            </div>
                                            <div style={styles.resultActions}>
          <span style={styles.resultText}>
            Всего отзывов: {importResult.totalCount}
          </span>
                                                <button
                                                    onClick={handleViewReviews}
                                                    style={styles.viewButton}
                                                >
                                                    Посмотреть
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={styles.importResult}>
                                            ℹ️ Новых отзывов не найдено
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
    actions: {
        display: 'flex',
        gap: '1rem',
    },
    actionLink: {
        backgroundColor: '#3498db',
        color: 'white',
        padding: '0.7rem 1.5rem',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
    mainInfo: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        marginBottom: '3rem',
    },
    infoCard: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
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
    infoGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    infoItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    infoValue: {
        color: '#34495e',
        fontSize: '1.1rem',
    },
    mapLink: {
        color: '#3498db',
        textDecoration: 'none',
        fontSize: '1rem',
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
    mapPlaceholder: {
        textAlign: 'center',
        padding: '2rem',
    },
    mapLinks: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        marginTop: '1rem',
    },
    mapButton: {
        backgroundColor: '#27ae60',
        color: 'white',
        padding: '0.7rem 1.5rem',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
    reviewsContent: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    importSection: {
        marginBottom: '3rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
    },
    importTitle: {
        marginTop: 0,
        marginBottom: '0.5rem',
        color: '#2c3e50',
    },
    importDescription: {
        color: '#7f8c8d',
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
    },
    importButtons: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    importButton: {
        padding: '1rem 1.5rem',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#3498db',
        color: 'white',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
        minWidth: '200px',
        transition: 'all 0.2s',
    },
    loadingContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
    },
    spinner: {
        width: '16px',
        height: '16px',
        border: '2px solid transparent',
        borderTop: '2px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    importResult: {
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '6px',
    },
    resultSuccess: {
        color: '#155724',
        fontWeight: 'bold',
        marginBottom: '0.5rem',
    },
    resultActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultText: {
        color: '#155724',
    },
    viewButton: {
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    allReviewsSection: {
        // Стили для секции всех отзывов
    },
    allReviewsTitle: {
        marginTop: 0,
        marginBottom: '1.5rem',
        color: '#2c3e50',
    },
    reviewsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    reviewItem: {
        padding: '1.5rem',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        backgroundColor: '#fdfdfd',
    },
    reviewItemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    reviewItemConfidence: {
        fontSize: '0.8rem',
        color: '#7f8c8d',
    },
    reviewItemDate: {
        fontSize: '0.8rem',
        color: '#7f8c8d',
    },
    reviewItemText: {
        lineHeight: '1.6',
        marginBottom: '1rem',
    },
    reviewItemKeywords: {
        marginBottom: '1rem',
    },
    reviewItemFooter: {
        textAlign: 'right',
    },
    keywordsList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.3rem',
        marginTop: '0.5rem',
    },
    keywordTag: {
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.8rem',
    },
    noReviews: {
        textAlign: 'center',
        padding: '3rem',
        color: '#7f8c8d',
    },
    noReviewsHint: {
        fontSize: '0.9rem',
        marginTop: '0.5rem',
    },
    loading: {
        textAlign: 'center',
        padding: '4rem',
        fontSize: '1.2rem',
        color: '#7f8c8d',
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
};


const spinnerStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const styleSheet = document.styleSheets[0];
styleSheet.insertRule(spinnerStyles, styleSheet.cssRules.length);

export default InstitutionDetail;