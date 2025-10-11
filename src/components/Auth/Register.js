import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

function Register() {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        password2: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);
    const navigate = useNavigate();

    const validatePassword = (password) => {
        const errors = [];

        if (password.length < 8) {
            errors.push('Пароль должен содержать минимум 8 символов');
        }

        if (!/\d/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну цифру');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну заглавную букву');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну строчную букву');
        }

        if (!/[@$!%*?&]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы один специальный символ (@$!%*?&)');
        }

        const commonPasswords = ['password', '12345678', 'qwerty', 'password123'];
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Пароль слишком простой');
        }

        return errors;
    };

    const getPasswordStrength = (password) => {
        if (password.length === 0) return { strength: 0, label: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/\d/.test(password)) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;

        const labels = ['', 'Слабый', 'Средний', 'Хороший', 'Отличный'];
        const colors = ['#e74c3c', '#e74c3c', '#f39c12', '#27ae60', '#2ecc71'];

        return {
            strength,
            label: labels[strength],
            color: colors[strength] || '#e74c3c'
        };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'password') {
            const errors = validatePassword(value);
            setPasswordErrors(errors);
        }

        if (name === 'password2' && formData.password !== value) {
            setError('Пароли не совпадают');
        } else if (name === 'password2' && formData.password === value) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const passwordValidationErrors = validatePassword(formData.password);
        if (passwordValidationErrors.length > 0) {
            setPasswordErrors(passwordValidationErrors);
            setError('Исправьте ошибки в пароле');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.password2) {
            setError('Пароли не совпадают');
            setLoading(false);
            return;
        }

        try {
            await authAPI.register(formData);
            navigate('/login');
        } catch (err) {
            console.log(err);
            let errorText = 'Ошибка регистрации. Повторите попытку позднее';
            if (err.status === 400 && 'email' in err.response.data) {
                errorText = 'Пользователь с таким e-mail уже существует'
            } else if (err.status === 400 && 'username' in err.response.data)
                errorText = 'Пользователь с таким именем пользователя уже существует'
            setError(errorText);
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h2>Регистрация</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="username">Имя пользователя:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="first_name">Имя:</label>
                        <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="last_name">Фамилия:</label>
                        <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="password">Пароль:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{
                                ...styles.input,
                                ...(passwordErrors.length > 0 && formData.password && styles.inputError),
                                ...(passwordStrength.strength >= 3 && styles.inputSuccess)
                            }}
                        />

                        {formData.password && (
                            <div style={styles.passwordStrength}>
                                <div style={styles.strengthBar}>
                                    <div
                                        style={{
                                            ...styles.strengthFill,
                                            width: `${(passwordStrength.strength / 4) * 100}%`,
                                            backgroundColor: passwordStrength.color
                                        }}
                                    />
                                </div>
                                <span style={{ color: passwordStrength.color, fontSize: '0.8rem' }}>
                  {passwordStrength.label}
                </span>
                            </div>
                        )}

                        {passwordErrors.length > 0 && (
                            <div style={styles.passwordErrors}>
                                {passwordErrors.map((error, index) => (
                                    <div key={index} style={styles.passwordErrorItem}>• {error}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="password2">Подтвердите пароль:</label>
                        <input
                            type="password"
                            id="password2"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            required
                            style={{
                                ...styles.input,
                                ...(formData.password2 && formData.password !== formData.password2 && styles.inputError),
                                ...(formData.password2 && formData.password === formData.password2 && styles.inputSuccess)
                            }}
                        />
                        {formData.password2 && formData.password !== formData.password2 && (
                            <div style={styles.errorText}>Пароли не совпадают</div>
                        )}
                        {formData.password2 && formData.password === formData.password2 && (
                            <div style={styles.successText}>Пароли совпадают</div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || passwordErrors.length > 0}
                        style={{
                            ...styles.button,
                            ...((loading || passwordErrors.length > 0) && styles.buttonDisabled)
                        }}
                    >
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>

                <p style={styles.loginLink}>
                    Уже есть аккаунт? <Link to="/login">Войдите</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '2rem',
        backgroundColor: '#f8f9fa',
    },
    formContainer: {
        width: '100%',
        maxWidth: '450px',
        padding: '2rem',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    formGroup: {
        marginBottom: '1.5rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '600',
        color: '#2c3e50',
        fontSize: '0.9rem',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '1rem',
        transition: 'all 0.2s',
        boxSizing: 'border-box',
    },
    inputError: {
        borderColor: '#e74c3c',
        backgroundColor: '#ffeaea',
    },
    inputSuccess: {
        borderColor: '#27ae60',
        backgroundColor: '#f0fff4',
    },
    passwordStrength: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '0.5rem',
    },
    strengthBar: {
        flex: 1,
        height: '4px',
        backgroundColor: '#ecf0f1',
        borderRadius: '2px',
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        transition: 'all 0.3s',
    },
    passwordErrors: {
        marginTop: '0.5rem',
        padding: '0.75rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '6px',
        fontSize: '0.8rem',
    },
    passwordErrorItem: {
        color: '#856404',
        margin: '0.25rem 0',
        fontSize: '0.75rem',
    },
    errorText: {
        color: '#e74c3c',
        fontSize: '0.8rem',
        marginTop: '0.25rem',
        fontWeight: '500',
    },
    successText: {
        color: '#27ae60',
        fontSize: '0.8rem',
        marginTop: '0.25rem',
        fontWeight: '500',
    },
    button: {
        padding: '0.9rem',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        transition: 'all 0.2s',
        marginTop: '1rem',
    },
    buttonDisabled: {
        backgroundColor: '#95a5a6',
        cursor: 'not-allowed',
        opacity: '0.6',
    },
    error: {
        color: '#e74c3c',
        backgroundColor: '#ffeaea',
        padding: '0.75rem',
        borderRadius: '6px',
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
        textAlign: 'center',
    },
    loginLink: {
        marginTop: '1.5rem',
        textAlign: 'center',
        color: '#7f8c8d',
        fontSize: '0.9rem',
    },
};

export default Register;
