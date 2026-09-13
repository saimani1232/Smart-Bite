// API Service for SmartBite (Connected to Cloud Database)
import { localStore } from './localStore';
import type { InventoryItem } from '../types';

const API_BASE = '/api';

// Get auth token from localStorage
export const getToken = (): string | null => {
    return localStorage.getItem('smartbite-token');
};

// Set auth token
export const setToken = (token: string): void => {
    localStorage.setItem('smartbite-token', token);
};

// Remove auth token
export const removeToken = (): void => {
    localStorage.removeItem('smartbite-token');
};

// Generic fetch with auth
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    let data: any = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const message = data?.error || data?.details || `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    localStore.setSyncMode('cloud');
    return data;
}

// Auth API - Validates strictly with Cloud Database
export const authAPI = {
    register: async (username: string, password: string) => {
        const data = await fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        return data as { token: string; user: { id: string; username: string } };
    },

    login: async (username: string, password: string) => {
        const data = await fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        return data as { token: string; user: { id: string; username: string } };
    },

    googleLogin: async (credential: string) => {
        const data = await fetchWithAuth('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential })
        });
        return data as { token: string; user: { id: string; username: string; email?: string; picture?: string } };
    }
};

// Items API - Real-time sync with Cloud Database
export const itemsAPI = {
    getAll: async (): Promise<InventoryItem[]> => {
        const data = await fetchWithAuth('/items');
        if (Array.isArray(data)) {
            return data as InventoryItem[];
        }
        return [];
    },

    create: async (item: {
        name: string;
        quantity: number;
        unit: string;
        category: string;
        expiryDate: string;
        isOpened?: boolean;
        reminderDays?: number;
        reminderEmail?: string;
    }): Promise<InventoryItem> => {
        const data = await fetchWithAuth('/items', {
            method: 'POST',
            body: JSON.stringify(item)
        });
        return data as InventoryItem;
    },

    update: async (id: string, updates: Record<string, unknown>): Promise<InventoryItem> => {
        const data = await fetchWithAuth(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        return data as InventoryItem;
    },

    delete: async (id: string): Promise<{ message: string }> => {
        return await fetchWithAuth(`/items/${id}`, {
            method: 'DELETE'
        }) as { message: string };
    }
};
