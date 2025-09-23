import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    login: async (email, password) => {
        const response = await api.post('/auth/login/', { email, password });
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register/', userData);
        return response.data;
    },
};

export const institutionsAPI = {
    getAll: async () => {
        const response = await api.get('/institutions/');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/institutions/${id}/`);
        return response.data;
    },
};

export const eventsAPI = {
    getAll: async () => {
        const response = await api.get('/events/');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/events/${id}/`);
        return response.data;
    },
};

export const reviewsAPI = {
    getAll: async () => {
        const response = await api.get('/reviews/');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/reviews/${id}/`);
        return response.data;
    },
};

export default api;
