import axios from 'axios';
import { getCookie, setCookie } from 'cookies-next';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2775/api/v1';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getCookie('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error status is 401 and there is no originalRequest._retry flag,
        // it means the token has expired, and we need to refresh it
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = getCookie('refreshToken');
                const response = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
                const { accessToken } = response.data.data;

                // Set the new access token in cookies
                setCookie('accessToken', accessToken, {
                    maxAge: 24 * 60 * 60, // 24 hours
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });

                // Retry the original request with the new token
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // If refresh token fails, clear all auth cookies and redirect to login
                ['accessToken', 'refreshToken'].forEach(cookieName => {
                    setCookie(cookieName, '', {
                        maxAge: 0,
                        path: '/',
                    });
                });

                // Use Next.js router for client-side navigation if available
                if (typeof window !== 'undefined') {
                    // Check if we're not already on the login page to prevent redirect loops
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
