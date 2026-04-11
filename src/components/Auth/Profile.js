import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

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

    return (
        <div style={styles.container}>
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
    card: {
        width: '100%',
        maxWidth: '480px',
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
};

export default Profile;
