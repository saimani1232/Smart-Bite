import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { InventoryItem } from '../types';
import { calculateExpiryStatus, getOpenedExpiryDate } from '../utils/logic';
import { findBestRecipes } from '../services/recipeService';
import { sendExpiryReminder } from '../services/emailService';

// Fallback for UUID since we didn't install the package
const generateId = () => Math.random().toString(36).substr(2, 9);

type InventoryContextType = {
    items: InventoryItem[];
    addItem: (item: Omit<InventoryItem, 'id' | 'status' | 'isOpened'>) => void;
    updateItem: (id: string, updates: Partial<InventoryItem>) => void;
    removeItem: (id: string) => void;
    toggleOpened: (id: string) => void;
    refreshStatus: () => void;
    checkReminders: () => Promise<void>;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Mock Data - updated with reminder fields
const INITIAL_ITEMS: InventoryItem[] = [
    {
        id: '1',
        name: 'Whole Milk',
        expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], // 5 days from now
        quantity: 1,
        unit: 'l',
        category: 'Dairy',
        isOpened: false,
        status: 'Good',
        reminderDays: 3,
    },
    {
        id: '2',
        name: 'Wheat Flour',
        expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0], // 60 days
        quantity: 5,
        unit: 'kg',
        category: 'Grain',
        isOpened: false,
        status: 'Good',
        reminderDays: 7,
    },
    {
        id: '3',
        name: 'Tomato Puree',
        expiryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // 2 days
        quantity: 2,
        unit: 'pkg',
        category: 'Vegetable',
        isOpened: false,
        status: 'Expiring Soon',
        reminderDays: 3,
    }
];

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<InventoryItem[]>(() => {
        const saved = localStorage.getItem('smart-bite-inventory');
        return saved ? JSON.parse(saved) : INITIAL_ITEMS;
    });

    useEffect(() => {
        localStorage.setItem('smart-bite-inventory', JSON.stringify(items));
    }, [items]);

    // Recalculate status on mount or when items change
    const refreshStatus = () => {
        setItems(prev => prev.map(item => ({
            ...item,
            status: calculateExpiryStatus(item)
        })));
    };

    useEffect(() => {
        refreshStatus();
        // Check reminders on app load
        checkReminders();
    }, []);

    // Check all items for reminders that need to be sent
    const checkReminders = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const itemsToRemind = items.filter(item => {
            // Skip if no reminder set, no email, or already sent
            if (item.reminderDays === 0 || !item.reminderEmail || item.reminderSent) {
                return false;
            }

            const expiry = new Date(item.expiryDate);
            expiry.setHours(0, 0, 0, 0);
            const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Remind if within reminder window
            return daysUntilExpiry <= item.reminderDays && daysUntilExpiry > 0;
        });

        console.log('Items needing reminder:', itemsToRemind.map(i => i.name));

        for (const item of itemsToRemind) {
            // Get all inventory item names for recipe matching
            const allItemNames = items.map(i => i.name);

            // Find best recipes using the expiring item + other inventory
            const recipes = await findBestRecipes(item.name, allItemNames);

            // Send email reminder
            const success = await sendExpiryReminder(item, recipes);

            if (success) {
                // Mark reminder as sent
                setItems(prev => prev.map(i =>
                    i.id === item.id ? { ...i, reminderSent: true } : i
                ));
            }
        }
    };

    const addItem = (newItem: Omit<InventoryItem, 'id' | 'status' | 'isOpened'>) => {
        const item: InventoryItem = {
            ...newItem,
            id: generateId(),
            isOpened: false,
            status: 'Good', // temporary, will be recalculated
            reminderSent: false,
        };
        item.status = calculateExpiryStatus(item);
        setItems(prev => [...prev, item]);
    };

    const updateItem = (id: string, updates: Partial<InventoryItem>) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, ...updates };
                updated.status = calculateExpiryStatus(updated);
                return updated;
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const toggleOpened = (id: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                if (item.isOpened) return item; // Already opened

                const openedDate = new Date().toISOString().split('T')[0];
                const newExpiry = getOpenedExpiryDate(openedDate, item.category);

                const updated = {
                    ...item,
                    isOpened: true,
                    openedDate,
                    expiryDate: newExpiry || item.expiryDate,
                    reminderSent: false, // Reset reminder for new expiry
                };
                updated.status = calculateExpiryStatus(updated);
                return updated;
            }
            return item;
        }));
    };

    return (
        <InventoryContext.Provider value={{ items, addItem, updateItem, removeItem, toggleOpened, refreshStatus, checkReminders }}>
            {children}
        </InventoryContext.Provider>
    );
};

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};
