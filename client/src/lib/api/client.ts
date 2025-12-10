import axios from 'axios';
import { browser } from '$app/environment';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(
    (config) => {
        if (browser) {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && browser) {
            // Handle unauthorized access (e.g., redirect to login)
            console.warn('Unauthorized access');
        }
        return Promise.reject(error);
    }
);

export default client;
