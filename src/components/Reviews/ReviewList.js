import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI, institutionsAPI, reviewsAPI } from '../../services/api';

function ReviewList() {
    const [allReviews, setAllReviews] = useState([]);
    let [currentReviews, setCurrentReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewsPerPage] = useState(6);
    const [filters, setFilters] = useState({
        sentiment: '',
        institution: '',
        event: '',
        dateFrom: '',
        dateTo: '',
        aspectCountMin: '',
        aspectCountMax: '',
        hasSuggestedActions: '',
        source: '',
    });
    const [institutions, setInstitutions] = useState([]);
    const [events, setEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const MAX_TEXT_LENGTH = 150;

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const data = await institutionsAPI.getAll();
                setInstitutions(data);
            } catch (err) {
                console.error('Error fetching institutions:', err);
            }
        };

        fetchInstitutions();
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await eventsAPI.getAll();
                setEvents(data);
            } catch (err) {
                console.error('Error fetching events:', err);
            }
        };

        fetchEvents();
    }, []);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const data = await reviewsAPI.getAll();
                setAllReviews(data);
            } catch (err) {
                setError('Ошибка загрузки отзывов');
                console.error('Error fetching reviews:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    useEffect(() => {
        if (allReviews.length > 0) {
            const indexOfLastReview = currentPage * reviewsPerPage;
            const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
            const currentReviewsData = allReviews.slice(indexOfFirstReview, indexOfLastReview);
            setCurrentReviews(currentReviewsData);
        }
    }, [currentPage, allReviews, reviewsPerPage]);

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;

        const truncated = text.substr(0, maxLength);
        return truncated.substr(0, Math.min(truncated.length, truncated.lastIndexOf(' '))) + '...';
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '#27ae60';
            case 'negative': return '#e74c3c';
            case 'spam': return '#95a5a6';
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

    const filterReviews = (reviews) => {
        return reviews.filter(review => {
            if (filters.sentiment && review.sentiment !== filters.sentiment) {
                return false;
            }

            if (filters.institution && review.institution !== parseInt(filters.institution)) {
                return false;
            }

            if (filters.event && review.event !== parseInt(filters.event)) {
                return false;
            }

            if (filters.dateFrom && review.reviewed_at < filters.dateFrom) {
                return false;
            }

            if (filters.dateTo && review.reviewed_at > filters.dateTo) {
                return false;
            }

            const totalAspects = (review.positive_aspects?.length || 0) + (review.negative_aspects?.length || 0);

            if (filters.aspectCountMin !== '' && totalAspects < parseInt(filters.aspectCountMin)) {
                return false;
            }

            if (filters.aspectCountMax !== '' && totalAspects > parseInt(filters.aspectCountMax)) {
                return false;
            }

            if (filters.hasSuggestedActions === 'true') {
                if (!review.required_actions || review.required_actions.length === 0) return false;
            } else if (filters.hasSuggestedActions === 'false') {
                if (review.required_actions && review.required_actions.length > 0) return false;
            }

            if (filters.source && review.source !== filters.source) {
                return false;
            }

            return true;
        });
    };

    const searchReviews = async (searchText) => {
        try {
            const data = await reviewsAPI.searchByText(searchText);
            setAllReviews(data);
        } catch (err) {
            setError('Ошибка загрузки отзывов');
            console.error('Error searching reviews:', err);
        }
    }

    const filteredReviews = filterReviews(allReviews);
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
    currentReviews = filteredReviews.slice(
        (currentPage - 1) * reviewsPerPage,
        currentPage * reviewsPerPage
    );

    const goToPage = (page) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            window.scrollTo(0, 0);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            window.scrollTo(0, 0);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    if (loading) return <div style={styles.loading}>Загрузка отзывов...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            <h2>Отзывы посетителей</h2>

            <div style={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Поиск по отзывам..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            searchReviews(searchQuery);
                        }
                    }}
                    style={styles.searchInput}
                />
                <button
                    onClick={() => searchReviews(searchQuery)}
                    style={styles.searchButton}
                >
                    Поиск
                </button>
            </div>

            <div style={styles.filters}>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Тональность:</label>
                    <select
                        value={filters.sentiment}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, sentiment: e.target.value }));
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    >
                        <option value="">Все</option>
                        <option value="positive">Положительные</option>
                        <option value="negative">Отрицательные</option>
                        <option value="neutral">Нейтальные</option>
                    </select>
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Учреждение:</label>
                    <select
                        value={filters.institution}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, institution: e.target.value }));
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    >
                        <option value="">Все</option>
                        {institutions.map(inst => (
                            <option key={inst.id} value={inst.id}>
                                {inst.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Источник:</label>
                    <select
                        value={filters.source}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, source: e.target.value }));
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    >
                        <option value="">Все</option>
                        {Array.from(new Set(allReviews.map((r) => r.source))).map((src) => (
                            <option key={src} value={src}>
                                {src}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Мероприятие:</label>
                    <select
                        value={filters.event}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, event: e.target.value }));
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    >
                        <option value="">Все</option>
                        {events.map(e => (
                            <option key={e.id} value={e.id}>
                                {e.name}{e.is_rent ? ' (аренда)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>С:</label>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, dateFrom: e.target.value }));
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    >

                    </input>
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>По:</label>
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, dateTo: e.target.value }));
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    >

                    </input>
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Аспектов от:</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="мин"
                        value={filters.aspectCountMin}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, aspectCountMin: e.target.value }));
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    />
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Аспектов до:</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="макс"
                        value={filters.aspectCountMax}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, aspectCountMax: e.target.value }));
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    />
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Предложения:</label>
                    <select
                        value={filters.hasSuggestedActions}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, hasSuggestedActions: e.target.value }));
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    >
                        <option value="">Все</option>
                        <option value="true">Есть предложения</option>
                        <option value="false">Нет предложений</option>
                    </select>
                </div>

                {(filters.sentiment || filters.institution || filters.event || filters.dateFrom || filters.hasSuggestedActions || filters.aspectCountMin !== '' || filters.aspectCountMax !== '' || filters.source) && (
                    <button
                        onClick={() => {
                            setFilters({
                                sentiment: '',
                                institution: '',
                                event: '',
                                dateFrom: '',
                                dateTo: '',
                                aspectCountMin: '',
                                aspectCountMax: '',
                                hasSuggestedActions: '',
                                source: '',
                            });
                            setCurrentPage(1);
                        }}
                        style={styles.clearButton}
                    >
                        Очистить фильтры
                    </button>
                )}
            </div>

            <div style={styles.filterInfo}>
                Найдено отзывов: {filteredReviews.length}
                {(filters.sentiment || filters.institution || filters.event || filters.dateFrom || filters.hasSuggestedActions || filters.aspectCountMin !== '' || filters.aspectCountMax !== '' || filters.source) && (
                    <span style={styles.activeFilters}>
                        (отфильтровано)
                    </span>
                )}
            </div>

            {/* Список отзывов */}
            <div style={styles.grid}>
                {currentReviews.length > 0 ? (
                    currentReviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            maxTextLength={MAX_TEXT_LENGTH}
                            getSentimentColor={getSentimentColor}
                            getSentimentText={getSentimentText}
                            truncateText={truncateText}
                        />
                    ))
                ) : (
                    <div style={styles.noReviews}>Отзывы не найдены</div>
                )}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        style={{
                            ...styles.paginationButton,
                            ...(currentPage === 1 ? styles.disabledButton : {})
                        }}
                    >
                        ← Назад
                    </button>

                    <div style={styles.pageNumbers}>
                        {/* Первая страница */}
                        {currentPage > 3 && (
                            <>
                                <button
                                    onClick={() => goToPage(1)}
                                    style={styles.pageButton}
                                >
                                    1
                                </button>
                                {currentPage > 4 && <span style={styles.ellipsis}>...</span>}
                            </>
                        )}

                        {/* Основные страницы */}
                        {getPageNumbers().map((page) => (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                style={{
                                    ...styles.pageButton,
                                    ...(page === currentPage ? styles.activePage : {})
                                }}
                            >
                                {page}
                            </button>
                        ))}

                        {/* Последняя страница */}
                        {currentPage < totalPages - 2 && (
                            <>
                                {currentPage < totalPages - 3 && <span style={styles.ellipsis}>...</span>}
                                <button
                                    onClick={() => goToPage(totalPages)}
                                    style={styles.pageButton}
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        style={{
                            ...styles.paginationButton,
                            ...(currentPage === totalPages ? styles.disabledButton : {})
                        }}
                    >
                        Вперед →
                    </button>
                </div>
            )}
        </div>
    );
}

const ReviewCard = ({ review, maxTextLength, getSentimentColor, getSentimentText, truncateText }) => {
    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <span
                    style={{
                        ...styles.sentiment,
                        backgroundColor: getSentimentColor(review.sentiment)
                    }}
                >
                    {getSentimentText(review.sentiment)}
                </span>
                <span style={styles.confidence}>
                </span>
            </div>

            <p style={styles.text}>
                {truncateText(review.text, maxTextLength)}
            </p>

            <Link to={`/reviews/${review.id}`} style={styles.readMore}>
                Подробнее
            </Link>

            {review.positive_aspects || review.negative_aspects || review.potential_actions || review.required_actions ? (
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
                        {review.potential_actions?.map((action, index) => (
                            <span key={`potential-${index}`} style={styles.potentialTag}>
                                ❓ {action.trim()}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            <div style={styles.footer}>
                <small style={styles.institutionName}>
                    🏛️ {review.institution_name || 'Неизвестное учреждение'}
                </small>
                <small style={styles.date}>
                    {new Date(review.reviewed_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                </small>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '80vh',
    },
    paginationInfo: {
        textAlign: 'center',
        margin: '1rem 0 2rem 0',
        color: '#7f8c8d',
        fontSize: '1rem',
        padding: '0.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
    },
    pageInfo: {
        fontWeight: 'bold',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem',
    },
    card: {
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    cardHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    sentiment: {
        color: 'white',
        padding: '0.3rem 0.8rem',
        borderRadius: '15px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
    },
    confidence: {
        fontSize: '0.8rem',
        color: '#7f8c8d',
        fontWeight: '500',
    },
    text: {
        lineHeight: '1.6',
        marginBottom: '1rem',
        flexGrow: 1,
        fontSize: '1rem',
    },
    readMore: {
        color: '#3498db',
        textDecoration: 'none',
        fontWeight: 'bold',
        marginBottom: '1rem',
        display: 'inline-block',
        fontSize: '0.9rem',
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
    potentialTag: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fde68a'
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #eee',
        paddingTop: '1rem',
        marginTop: 'auto',
    },
    institutionName: {
        color: '#7f8c8d',
        fontSize: '0.8rem',
        fontWeight: '600',
    },
    date: {
        color: '#7f8c8d',
        fontSize: '0.8rem',
    },
    detailLink: {
        color: '#3498db',
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: '500',
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '3rem',
        flexWrap: 'wrap',
    },
    paginationButton: {
        padding: '0.6rem 1.2rem',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        minWidth: '100px',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
    },
    disabledButton: {
        opacity: '0.5',
        cursor: 'not-allowed',
    },
    pageNumbers: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    pageButton: {
        padding: '0.5rem 0.8rem',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        borderRadius: '4px',
        cursor: 'pointer',
        minWidth: '40px',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
    },
    activePage: {
        backgroundColor: '#3498db',
        color: 'white',
        borderColor: '#3498db',
    },
    ellipsis: {
        padding: '0.5rem',
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
        padding: '4rem',
        fontSize: '1.2rem',
        color: '#e74c3c',
        backgroundColor: '#ffeaea',
        borderRadius: '8px',
        margin: '2rem',
    },
    noReviews: {
        textAlign: 'center',
        padding: '3rem',
        color: '#7f8c8d',
        fontSize: '1.1rem',
        gridColumn: '1 / -1',
    },
    filters: {
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'flex-end',
        marginTop: '1.5rem',
        marginBottom: '1rem',
        padding: '1.25rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        minWidth: '150px',
    },
    filterLabel: {
        fontWeight: '600',
        color: '#2c3e50',
        fontSize: '0.9rem',
    },
    select: {
        padding: '0.5rem 0.75rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '0.9rem',
        backgroundColor: 'white',
        cursor: 'pointer',
    },
    clearButton: {
        padding: '0.5rem 1rem',
        border: '1px solid #e74c3c',
        backgroundColor: 'white',
        color: '#e74c3c',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
        marginLeft: 'auto',
    },
    searchContainer: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-end',
        marginTop: '1.5rem',
        marginBottom: '1rem',
        padding: '1.25rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
    },
    searchInput: {
        flex: 1,
        padding: '0.5rem 0.75rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '0.9rem'
    },
    searchButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600'
    },
    filterInfo: {
        marginBottom: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        color: '#7f8c8d',
        fontSize: '0.9rem',
    },
    activeFilters: {
        color: '#3498db',
        fontWeight: '600',
        marginLeft: '0.5rem',
    },
};

export default ReviewList;
