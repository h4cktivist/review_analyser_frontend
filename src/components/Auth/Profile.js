import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, clearVkAccessToken, getVkAccessToken, saveVkAccessToken } from '../../services/api';

const VK_DIRECT_AUTH_URL = 'https://id.vk.com/auth?return_auth_hash=aaf4efcd98b6a3ce40&redirect_uri=https%3A%2F%2Foauth.vk.com%2Fblank.html&redirect_uri_hash=b6f46624f99cf5313f&force_hash=1&app_id=6287487&response_type=token&code_challenge=&code_challenge_method=&scope=408861919&state=';

const FIELD_ORDER = [
    'email',
    'username',
    'first_name',
    'last_name',
    'is_staff',
    'is_active',
    'date_joined',
    'id',
];

const FIELD_LABELS = {
    id: 'ID',
    email: 'Email',
    username: 'Имя пользователя',
    first_name: 'Имя',
    last_name: 'Фамилия',
    is_staff: 'Администратор',
    is_active: 'Активен',
    date_joined: 'Дата регистрации',
};

function formatValue(key, value) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }
    if (typeof value === 'boolean') {
        return value ? 'Да' : 'Нет';
    }
    if (key === 'date_joined' && typeof value === 'string') {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) {
            return d.toLocaleString('ru-RU');
        }
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [vkToken, setVkToken] = useState(() => getVkAccessToken());
    const [vkAuthError, setVkAuthError] = useState('');
    const [vkRedirectResultUrl, setVkRedirectResultUrl] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await authAPI.getMe();
                const profile = data.user != null ? data.user : data;
                if (!cancelled) {
                    setUser(profile && typeof profile === 'object' ? profile : null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError('Не удалось загрузить профиль. Попробуйте войти снова.');
                    console.error('Profile load error:', err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const rows = user
        ? (() => {
              const keys = new Set(Object.keys(user));
              const ordered = FIELD_ORDER.filter((k) => keys.has(k));
              const rest = [...keys].filter((k) => !FIELD_ORDER.includes(k)).sort();
              return [...ordered, ...rest];
          })()
        : [];

    const handleVKAuth = () => {
        window.open(VK_DIRECT_AUTH_URL, '_blank', 'noopener,noreferrer');
    };

    const handleApplyVkTokenFromUrl = () => {
        try {
            const parsedUrl = new URL(vkRedirectResultUrl.trim());
            const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
            const token = hashParams.get('access_token');

            if (!token) {
                setVkAuthError('В ссылке нет access_token. Вставьте полный URL после редиректа VK.');
                return;
            }

            saveVkAccessToken(token);
            setVkToken(token);
            setVkAuthError('');
            setVkRedirectResultUrl('');
        } catch (e) {
            setVkAuthError('Некорректный URL. Вставьте полный URL из адресной строки после авторизации VK.');
        }
    };

    const handleClearVkToken = () => {
        clearVkAccessToken();
        setVkToken('');
        setVkAuthError('');
    };

    return (
        <div style={styles.container}>
            <div style={styles.content}>
            <div style={styles.card}>
                <h2 style={styles.title}>Профиль</h2>

                {loading && <p style={styles.muted}>Загрузка…</p>}
                {error && !loading && <div style={styles.error}>{error}</div>}

                {!loading && !error && user && (
                    <dl style={styles.dl}>
                        {rows.map((key) => (
                            <div key={key} style={styles.row}>
                                <dt style={styles.dt}>{FIELD_LABELS[key] || key}</dt>
                                <dd style={styles.dd}>{formatValue(key, user[key])}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                <p style={styles.back}>
                    <Link to="/dashboard">На главную</Link>
                </p>
            </div>
            <div style={styles.card}>
                <h2 style={styles.title}>Интеграция VK</h2>
                <p style={styles.muted}>
                    Получите access token через VK ID и сохраните его для импорта отзывов из VK.
                </p>
                <div style={styles.vkActions}>
                    <button
                        type="button"
                        onClick={handleVKAuth}
                        style={{ ...styles.button, ...styles.vkAuthButton }}
                    >
                        Открыть авторизацию VK
                    </button>
                    <button
                        type="button"
                        onClick={handleClearVkToken}
                        style={{ ...styles.button, ...styles.clearButton }}
                    >
                        Очистить token
                    </button>
                </div>
                <p style={styles.hint}>Авторизация открывается в новой вкладке.</p>
                <input
                    type="text"
                    value={vkRedirectResultUrl}
                    onChange={(e) => setVkRedirectResultUrl(e.target.value)}
                    placeholder="Вставьте URL после редиректа VK (с access_token в hash)"
                    style={styles.vkRedirectInput}
                />
                <button
                    type="button"
                    onClick={handleApplyVkTokenFromUrl}
                    style={{ ...styles.button, ...styles.saveButton }}
                >
                    Сохранить token из URL
                </button>
                {vkAuthError && <div style={styles.error}>{vkAuthError}</div>}
                <div style={vkToken ? styles.tokenStatusSuccess : styles.tokenStatusMuted}>
                    {vkToken ? 'VK token сохранен в localStorage и готов к импорту.' : 'VK token пока не сохранен.'}
                </div>
            </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '80vh',
        padding: '2rem',
    },
    content: {
        width: '100%',
        maxWidth: '640px',
        display: 'grid',
        gap: '1rem',
    },
    card: {
        width: '100%',
        padding: '2rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
    },
    title: {
        marginTop: 0,
        marginBottom: '1.25rem',
    },
    muted: {
        color: '#7f8c8d',
        margin: 0,
    },
    error: {
        color: '#c0392b',
        padding: '0.75rem',
        backgroundColor: '#ffeaea',
        borderRadius: '4px',
        marginBottom: '1rem',
    },
    dl: {
        margin: 0,
    },
    row: {
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: '0.5rem 1rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid #ecf0f1',
    },
    dt: {
        margin: 0,
        fontWeight: 600,
        color: '#2c3e50',
        fontSize: '0.9rem',
    },
    dd: {
        margin: 0,
        color: '#34495e',
        wordBreak: 'break-word',
    },
    back: {
        marginTop: '1.5rem',
        marginBottom: 0,
        textAlign: 'center',
    },
    vkActions: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginTop: '1rem',
        marginBottom: '0.5rem',
    },
    button: {
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        padding: '0.7rem 1.2rem',
        fontSize: '0.95rem',
        fontWeight: 600,
        cursor: 'pointer',
    },
    vkAuthButton: {
        backgroundColor: '#4680C2',
    },
    clearButton: {
        backgroundColor: '#64748b',
    },
    saveButton: {
        marginTop: '0.75rem',
        backgroundColor: '#2f855a',
    },
    vkRedirectInput: {
        marginTop: '0.75rem',
        width: '100%',
        padding: '0.75rem 0.9rem',
        border: '1px solid #d0d7de',
        borderRadius: '8px',
        fontSize: '0.95rem',
    },
    hint: {
        margin: '0.5rem 0 0',
        color: '#7f8c8d',
        fontSize: '0.9rem',
    },
    tokenStatusSuccess: {
        marginTop: '0.75rem',
        padding: '0.7rem 0.9rem',
        borderRadius: '6px',
        backgroundColor: '#e6fffa',
        color: '#22543d',
        fontSize: '0.9rem',
    },
    tokenStatusMuted: {
        marginTop: '0.75rem',
        padding: '0.7rem 0.9rem',
        borderRadius: '6px',
        backgroundColor: '#f1f5f9',
        color: '#475569',
        fontSize: '0.9rem',
    },
};

export default Profile;
