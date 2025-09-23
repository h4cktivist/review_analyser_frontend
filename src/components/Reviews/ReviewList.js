import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewsAPI } from '../../services/api';

function ReviewList() {
    const [allReviews, setAllReviews] = useState([]);
    const [currentReviews, setCurrentReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewsPerPage] = useState(6);

    const MAX_TEXT_LENGTH = 150;

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
            case 'положительный': return '#27ae60';
            case 'отрицательный': return '#e74c3c';
            case 'спам': return '#95a5a6';
            default: return '#34495e';
        }
    };

    const totalPages = Math.ceil(allReviews.length / reviewsPerPage);

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

            {/* Информация о пагинации */}
            <div style={styles.paginationInfo}>
                Показано {currentReviews.length} из {allReviews.length} отзывов
                {totalPages > 1 && (
                    <span style={styles.pageInfo}> - Страница {currentPage} из {totalPages}</span>
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

const ReviewCard = ({ review, maxTextLength, getSentimentColor, truncateText }) => {
    const isTextLong = review.text && review.text.length > maxTextLength;

    return (
        <div style={styles.card}>
            <div style={styles.header}>
        <span
            style={{
                ...styles.sentiment,
                backgroundColor: getSentimentColor(review.sentiment)
            }}
        >
          {review.sentiment}
        </span>
                <span style={styles.confidence}>
          Уверенность: {(review.confidence * 100).toFixed(1)}%
        </span>
            </div>

            <p style={styles.text}>
                {truncateText(review.text, maxTextLength)}
            </p>

            {isTextLong && (
                <Link to={`/reviews/${review.id}`} style={styles.readMore}>
                    Читать полностью
                </Link>
            )}

            {review.keywords && (
                <div style={styles.keywords}>
                    <strong>Ключевые слова:</strong>
                    <div style={styles.keywordsList}>
                        {review.keywords.map((keyword, index) => (
                            <span key={index} style={styles.keywordTag}>
                {keyword.trim()}
              </span>
                        ))}
                    </div>
                </div>
            )}

            <div style={styles.footer}>
                <small style={styles.date}>
                    {new Date(review.reviewed_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                </small>
                <Link to={`/reviews/${review.id}`} style={styles.detailLink}>
                    Подробнее →
                </Link>
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
    keywords: {
        marginBottom: '1rem',
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
        border: '1px solid #bbdefb',
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #eee',
        paddingTop: '1rem',
        marginTop: 'auto',
    },
    date: {
        color: '#7f8c8d',
        fontSize: '0.9rem',
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
};

export default ReviewList;
