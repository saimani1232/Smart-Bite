// API Service for backend communication
const API_BASE = '/api';

// Get auth token from localStorage
const getToken = (): string | null => {
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
        ...options.headers as Record<string, string>
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// Auth API
export const authAPI = {
    register: async (username: string, password: string) => {
        return fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    login: async (username: string, password: string) => {
        return fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    googleLogin: async (credential: string) => {
        return fetchWithAuth('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential })
        });
    }
};

// Items API
export const itemsAPI = {
    getAll: async () => {
        return fetchWithAuth('/items');
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
        reminderPhone?: string;
    }) => {
        return fetchWithAuth('/items', {
            method: 'POST',
            body: JSON.stringify(item)
        });
    },

    update: async (id: string, updates: Record<string, unknown>) => {
        return fetchWithAuth(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    delete: async (id: string) => {
        return fetchWithAuth(`/items/${id}`, {
            method: 'DELETE'
        });
    }
};
