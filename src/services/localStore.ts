// Local-First Resilient Data Store
// Provides perpetual browser storage with realistic pre-seeded pantry inventory
// Ensures SmartBite is 100% functional even if cloud database is unreachable.

import type { InventoryItem } from '../types';

const STORAGE_KEY_ITEMS = 'smartbite_local_items_v2';
const STORAGE_KEY_USERS = 'smartbite_local_users_v2';
const STORAGE_KEY_SYNC_MODE = 'smartbite_sync_mode';

// Generate default items relative to current date
function getDefaultItems(): InventoryItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const addDays = (days: number): string => {
        const d = new Date(today);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    return [
        {
            id: 'demo-1',
            name: 'Fresh Cow Milk',
            quantity: 1,
            unit: 'l',
            category: 'Dairy',
            expiryDate: addDays(1), // Expires tomorrow
            isOpened: false,
            status: 'Expiring Soon',
            reminderDays: 2,
            reminderEmail: 'demo@smartbite.app',
            reminderSent: false
        },
        {
            id: 'demo-2',
            name: 'Whole Wheat Bread',
            quantity: 1,
            unit: 'pkg',
            category: 'Grain',
            expiryDate: addDays(2),
            isOpened: true,
            openedDate: addDays(-1),
            status: 'Expiring Soon',
            reminderDays: 3,
            reminderEmail: '',
            reminderSent: false
        },
        {
            id: 'demo-3',
            name: 'Fresh Tomatoes',
            quantity: 1,
            unit: 'kg',
            category: 'Vegetable',
            expiryDate: addDays(4),
            isOpened: false,
            status: 'Expiring Soon',
            reminderDays: 2,
            reminderEmail: '',
            reminderSent: false
        },
        {
            id: 'demo-4',
            name: 'Chicken Breast',
            quantity: 500,
            unit: 'g',
            category: 'Meat',
            expiryDate: addDays(3),
            isOpened: false,
            status: 'Expiring Soon',
            reminderDays: 2,
            reminderEmail: '',
            reminderSent: false
        },
        {
            id: 'demo-5',
            name: 'Lays Magic Masala',
            quantity: 2,
            unit: 'pkg',
            category: 'Snacks',
            expiryDate: addDays(45),
            isOpened: false,
            status: 'Good',
            reminderDays: 5,
            reminderEmail: '',
            reminderSent: false
        },
        {
            id: 'demo-6',
            name: 'Cheddar Cheese',
            quantity: 200,
            unit: 'g',
            category: 'Dairy',
            expiryDate: addDays(18),
            isOpened: false,
            status: 'Good',
            reminderDays: 3,
            reminderEmail: '',
            reminderSent: false
        },
        {
            id: 'demo-7',
            name: 'Greek Yogurt',
            quantity: 1,
            unit: 'pkg',
            category: 'Dairy',
            expiryDate: addDays(-1), // Expired yesterday
            isOpened: false,
            status: 'Expired',
            reminderDays: 2,
            reminderEmail: '',
            reminderSent: false
        }
    ];
}

function getCurrentUserId(): string {
    try {
        const userStr = localStorage.getItem('smartbite-user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.id) return user.id;
        }
    } catch { }
    return 'default';
}

function getUserItemsKey(): string {
    return `${STORAGE_KEY_ITEMS}_${getCurrentUserId()}`;
}

// Ensure items are seeded per user
function getRawItems(): InventoryItem[] {
    const key = getUserItemsKey();
    try {
        const stored = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY_ITEMS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                localStorage.setItem(key, stored);
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Error reading local items store:', e);
    }

    const defaultItems = getDefaultItems();
    try {
        localStorage.setItem(key, JSON.stringify(defaultItems));
    } catch (e) {
        console.error('Failed to seed default items in localStorage', e);
    }
    return defaultItems;
}

function saveRawItems(items: InventoryItem[]): void {
    const key = getUserItemsKey();
    try {
        localStorage.setItem(key, JSON.stringify(items));
        localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
        console.error('Failed to save items to localStorage', e);
    }
}

export interface LocalUser {
    id: string;
    username: string;
    passwordHash?: string;
    email?: string;
    picture?: string;
}

function getRawUsers(): LocalUser[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_USERS);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Error reading local users store:', e);
    }
    return [
        {
            id: 'user-demo-1',
            username: 'demo_user',
            passwordHash: 'demo123',
            email: 'demo@smartbite.app'
        }
    ];
}

function saveRawUsers(users: LocalUser[]): void {
    try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
        console.error('Failed to save users to localStorage', e);
    }
}

export const localStore = {
    // Mode status
    getSyncMode(): 'cloud' | 'local' {
        return (localStorage.getItem(STORAGE_KEY_SYNC_MODE) as 'cloud' | 'local') || 'local';
    },

    setSyncMode(mode: 'cloud' | 'local'): void {
        localStorage.setItem(STORAGE_KEY_SYNC_MODE, mode);
        window.dispatchEvent(new CustomEvent('smartbite_sync_changed', { detail: mode }));
    },

    // Items CRUD
    getItems(): InventoryItem[] {
        return getRawItems();
    },

    addItem(item: Omit<InventoryItem, 'id' | 'status' | 'isOpened'>): InventoryItem {
        const items = getRawItems();
        const newItem: InventoryItem = {
            ...item,
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            isOpened: false,
            status: 'Good',
            reminderSent: false
        };
        items.unshift(newItem);
        saveRawItems(items);
        return newItem;
    },

    updateItem(id: string, updates: Partial<InventoryItem>): InventoryItem {
        const items = getRawItems();
        let updated: InventoryItem | null = null;

        const newItems = items.map(item => {
            if (item.id === id) {
                updated = { ...item, ...updates };
                return updated;
            }
            return item;
        });

        if (!updated) {
            throw new Error(`Item with id ${id} not found in local store`);
        }

        saveRawItems(newItems);
        return updated;
    },

    deleteItem(id: string): boolean {
        const items = getRawItems();
        const filtered = items.filter(item => item.id !== id);
        saveRawItems(filtered);
        return true;
    },

    resetToDemoData(): InventoryItem[] {
        const fresh = getDefaultItems();
        saveRawItems(fresh);
        return fresh;
    },

    // Users CRUD
    findUser(username: string): LocalUser | null {
        const users = getRawUsers();
        return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    },

    createUser(username: string, passwordHash: string, email?: string): LocalUser {
        const users = getRawUsers();
        const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (existing) {
            throw new Error('Username already taken in local store');
        }

        const newUser: LocalUser = {
            id: 'user_' + Date.now(),
            username: username.toLowerCase(),
            passwordHash,
            email
        };

        users.push(newUser);
        saveRawUsers(users);
        return newUser;
    },

    createGoogleUser(googleUser: { name: string; email: string; picture?: string; googleId: string }): LocalUser {
        const users = getRawUsers();
        const existing = users.find(u => u.email?.toLowerCase() === googleUser.email.toLowerCase());
        if (existing) {
            return existing;
        }

        const newUser: LocalUser = {
            id: 'google_' + Date.now(),
            username: googleUser.name.toLowerCase().replace(/\s+/g, '_'),
            email: googleUser.email.toLowerCase(),
            picture: googleUser.picture
        };

        users.push(newUser);
        saveRawUsers(users);
        return newUser;
    }
};
