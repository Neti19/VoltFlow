import axios from 'axios';

const API = axios.create({
    baseURL: 'https://voltflow-backend-r9cj.onrender.com/api',
});

// Automatically inject JWT token from localStorage if present
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;