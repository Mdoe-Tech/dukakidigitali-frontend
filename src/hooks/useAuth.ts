import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import { getCookie, setCookie } from 'cookies-next';
import axios from "axios";

interface AuthUser {
    id: number;
    name: string;
    email: string;
    imageUrl: string | null;
    role: string;
    phoneNumber: string | null;
    enabled: boolean;
    authorities: Array<{ authority: string }>;
}

interface SessionResponse {
    status: string;
    message: string;
    data: {
        user: AuthUser;
        token: string;
        expiresIn: number;
    };
    errors: null | any;
}

export const useAuth = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSession = async () => {
        try {
            const { data } = await axiosInstance.get<SessionResponse>('/auth/session');

            if (data.status === 'SUCCESS' && data.data.user) {
                setUser(data.data.user);
                setCookie('accessToken', data.data.token, {
                    maxAge: data.data.expiresIn / 1000,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });
            }
            setError(null);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Failed to fetch session');
                setUser(null);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSession();
    }, []);

    const logout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
        } catch (err) {
            console.error('Logout API call failed:', err);
        } finally {
            // Clear cookies regardless of API call success
            ['accessToken', 'refreshToken'].forEach(cookieName => {
                setCookie(cookieName, '', {
                    maxAge: 0,
                    path: '/',
                });
            });
            setUser(null);
            window.location.href = '/login';
        }
    };

    const isAuthenticated = !!user && !!getCookie('accessToken');

    const hasRole = (role: string) => {
        return user?.authorities?.some(auth => auth.authority === role) ?? false;
    };

    return {
        user,
        loading,
        error,
        logout,
        isAuthenticated,
        hasRole,
        refreshSession: fetchSession
    };
};
