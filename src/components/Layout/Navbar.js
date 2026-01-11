import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('access_token');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('is_admin');
        navigate('/login');
    };

    return (
        <nav style={styles.navbar}>
            <div style={styles.logo}>
                <Link to="/" style={styles.logoLink}>Система анализа отзывов</Link>
            </div>

            <div style={styles.navLinks}>
                <Link to="/institutions" style={styles.link}>Учреждения</Link>
                <Link to="/events" style={styles.link}>Мероприятия</Link>
                <Link to="/reviews" style={styles.link}>Отзывы</Link>
                <Link to="/dashboard" style={styles.link}>Аналитика</Link>
            </div>

            <div style={styles.authLinks}>
                {isAuthenticated ? (
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        Выйти
                    </button>
                ) : (
                    <>
                        <Link to="/login" style={styles.link}>Войти</Link>
                        <Link to="/register" style={styles.link}>Регистрация</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

const styles = {
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: '#2c3e50',
        color: 'white',
    },
    logo: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
    },
    logoLink: {
        color: 'white',
        textDecoration: 'none',
    },
    navLinks: {
        display: 'flex',
        gap: '2rem',
    },
    authLinks: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
    },
    link: {
        color: 'white',
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        transition: 'background-color 0.3s',
    },
    logoutBtn: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default Navbar;
