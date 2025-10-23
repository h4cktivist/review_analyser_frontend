import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const saveTokens = (access, refresh) => {
    localStorage.setItem('access_token', access);
    if (refresh) {
        localStorage.setItem('refresh_token', refresh);
    }
};

export const getTokens = () => {
    return {
        access: localStorage.getItem('access_token'),
        refresh: localStorage.getItem('refresh_token'),
    };
};

export const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

const refreshAccessToken = async () => {
    const { refresh } = getTokens();

    if (!refresh) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refresh
        });

        const newAccessToken = response.data.access;
        saveTokens(newAccessToken, refresh);

        return newAccessToken;
    } catch (error) {
        clearTokens();
        window.location.href = '/login';
        throw error;
    }
};

api.interceptors.request.use(
    (config) => {
        const { access } = getTokens();

        if (access) {
            config.headers.Authorization = `Bearer ${access}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newAccessToken = await refreshAccessToken();

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const authAPI = {
    login: async (email, password) => {
        const response = await api.post('/auth/login/', {email, password});
        const {access, refresh} = response.data;

        saveTokens(access, refresh);
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

    create: async (institutionData) => {
        const response = await api.post('/institutions/', institutionData);
        return response.data;
    },

    update: async (id, institutionData) => {
        const response = await api.put(`/institutions/${id}/`, institutionData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/institutions/${id}/`);
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

    create: async (eventData) => {
        const response = await api.post('/events/', eventData);
        return response.data;
    },

    update: async (id, eventData) => {
        const response = await api.put(`/events/${id}/`, eventData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/events/${id}/`);
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

    searchByText: async (text) => {
        const response = await api.get(`reviews/search/?q=${text}`);
        return response.data.results;
    }
};

export const importAPI = {
    importGISReviews: async (institutionId) => {
        const response = await api.post('/import-gis-reviews/', {
            institution_id: institutionId
        });
        return response.data;
    },
};

export default api;
