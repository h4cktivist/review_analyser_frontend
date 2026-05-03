import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { importAPI } from '../../services/api';

const POLL_MS = 2000;

function normalizeTaskPayload(data) {
    if (!data || typeof data !== 'object') return { state: 'UNKNOWN', meta: {} };

    const state =
        data.state ??
        data.status ??
        data.task_status ??
        'Неизвестно';

    let meta = {};
    if (data.result != null && typeof data.result === 'object') {
        Object.assign(meta, data.result);
    } else if (typeof data.result === 'string') {
        meta.message = data.result;
    }

    if (state === 'FAILURE') {
        ['error', 'traceback', 'message', 'detail'].forEach((key) => {
            if (data[key] != null && meta[key] == null) meta[key] = data[key];
        });
    }

    return { state, meta };
}

function isTaskRunning(state) {
    return (
        state === 'PENDING' ||
        state === 'STARTED' ||
        state === 'PROGRESS' ||
        state === 'RETRY'
    );
}

function ImportTaskDetail() {
    const { taskId } = useParams();
    const [payload, setPayload] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        let timerId;

        const tick = async () => {
            try {
                setError('');
                const data = await importAPI.getImportTask(taskId);
                if (cancelled) return;
                setPayload(data);
                const { state } = normalizeTaskPayload(data);
                if (isTaskRunning(state)) {
                    timerId = window.setTimeout(tick, POLL_MS);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(err);
                    const httpStatus = err.response?.status;
                    const detail = err.response?.data?.detail;
                    if (httpStatus === 401 || httpStatus === 403) {
                        setError(
                            'Доступ к статусу запрещён без авторизации. Оставайтесь на этой странице после входа в приложение; ' +
                            'прямой переход по URL API в браузере не передаёт токен.'
                        );
                    } else if (detail) {
                        setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
                    } else {
                        setError('Не удалось загрузить статус задачи');
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        setLoading(true);
        tick();

        return () => {
            cancelled = true;
            if (timerId) window.clearTimeout(timerId);
        };
    }, [taskId]);

    const { state, meta } = normalizeTaskPayload(payload);

    const statusRu = {
        PENDING: 'В очереди',
        STARTED: 'Выполняется',
        PROGRESS: 'Выполняется',
        RETRY: 'Повторная попытка',
        SUCCESS: 'Успешно',
        FAILURE: 'Ошибка',
        UNKNOWN: 'Неизвестно',
    }[state] || state;

    return (
        <div style={styles.container}>
            <nav style={styles.breadcrumb}>
                <Link to="/import-tasks" style={styles.breadcrumbLink}>Задачи импорта</Link>
                <span style={styles.breadcrumbSeparator}>/</span>
                <span style={styles.breadcrumbCurrent}>{taskId}</span>
            </nav>

            <h1 style={styles.title}>Статус импорта</h1>

            {loading && !payload && (
                <div style={styles.loading}>Загрузка...</div>
            )}

            {error && (
                <div style={styles.error}>{error}</div>
            )}

            {payload && (
                <div style={styles.card}>
                    <div style={styles.row}>
                        <strong>ID задачи</strong>
                        <span style={styles.mono}>{payload.task_id ?? taskId}</span>
                    </div>
                    <div style={styles.row}>
                        <strong>Состояние</strong>
                        <span style={{
                            ...styles.badge,
                            ...(state === 'SUCCESS' ? styles.badgeOk : {}),
                            ...(state === 'FAILURE' ? styles.badgeErr : {}),
                        }}>
                            {statusRu}
                        </span>
                    </div>

                    {isTaskRunning(state) && (
                        <p style={styles.hint}>
                            Задача выполняется на сервере. Страница обновляется автоматически.
                        </p>
                    )}

                    {state === 'SUCCESS' && (
                        <div style={styles.resultBlock}>
                            <h3 style={styles.resultTitle}>Итог</h3>
                            <ul style={styles.resultList}>
                                {meta.source != null && (
                                    <li><strong>Источник:</strong> {String(meta.source)}</li>
                                )}
                                {meta.imported_count != null && (
                                    <li><strong>Импортировано новых отзывов:</strong> {meta.imported_count}</li>
                                )}
                            </ul>
                            <Link to="/reviews" style={styles.linkBtn}>Перейти к отзывам</Link>
                        </div>
                    )}

                    {state === 'FAILURE' && (
                        <div style={styles.failureBlock}>
                            <p>Импорт завершился с ошибкой.</p>
                            {(meta.error || meta.traceback || meta.message) && (
                                <pre style={styles.pre}>
                                    {meta.error || meta.message || meta.traceback}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '80vh',
    },
    breadcrumb: {
        marginBottom: '1.5rem',
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
        wordBreak: 'break-all',
    },
    title: {
        color: '#2c3e50',
        fontSize: '2rem',
        marginTop: 0,
    },
    loading: {
        color: '#7f8c8d',
    },
    error: {
        padding: '1rem',
        backgroundColor: '#ffeaea',
        color: '#e74c3c',
        borderRadius: '8px',
    },
    card: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginTop: '1rem',
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
    },
    mono: {
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        wordBreak: 'break-all',
    },
    badge: {
        padding: '0.35rem 0.75rem',
        borderRadius: '6px',
        backgroundColor: '#ecf0f1',
        color: '#2c3e50',
        fontWeight: 'bold',
    },
    badgeOk: {
        backgroundColor: '#d4edda',
        color: '#155724',
    },
    badgeErr: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
    },
    hint: {
        color: '#7f8c8d',
        fontSize: '0.95rem',
        marginTop: '0.5rem',
    },
    resultBlock: {
        marginTop: '1.25rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid #ecf0f1',
    },
    resultTitle: {
        marginTop: 0,
        color: '#2c3e50',
        fontSize: '1.1rem',
    },
    resultList: {
        paddingLeft: '1.25rem',
        lineHeight: 1.8,
        color: '#34495e',
    },
    linkBtn: {
        display: 'inline-block',
        marginTop: '1rem',
        backgroundColor: '#3498db',
        color: 'white',
        padding: '0.6rem 1.2rem',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
    failureBlock: {
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#fff5f5',
        borderRadius: '8px',
        color: '#721c24',
    },
    pre: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: '0.8rem',
        marginTop: '0.75rem',
    },
};

export default ImportTaskDetail;
