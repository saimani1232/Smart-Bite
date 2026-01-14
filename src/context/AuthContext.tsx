import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { authAPI, setToken, removeToken } from '../services/api';

interface User {
    id: string;
    username: string;
    email?: string;
    picture?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    loginWithGoogle: (credential: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('smartbite-user');
        const token = localStorage.getItem('smartbite-token');
        if (savedUser && token) {
            try {
                return JSON.parse(savedUser);
            } catch {
                localStorage.removeItem('smartbite-user');
                localStorage.removeItem('smartbite-token');
                return null;
            }
        }
        return null;
    });
    const [isLoading, setIsLoading] = useState(false);

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authAPI.login(username, password);
            setToken(response.token);
            setUser(response.user);
            localStorage.setItem('smartbite-user', JSON.stringify(response.user));
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authAPI.register(username, password);
            setToken(response.token);
            setUser(response.user);
            localStorage.setItem('smartbite-user', JSON.stringify(response.user));
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async (credential: string) => {
        const response = await authAPI.googleLogin(credential);
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('smartbite-user', JSON.stringify(response.user));
    };

    const logout = () => {
        removeToken();
        setUser(null);
        localStorage.removeItem('smartbite-user');
        localStorage.removeItem('smart-bite-items'); // Clear old local storage items
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                loginWithGoogle,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
