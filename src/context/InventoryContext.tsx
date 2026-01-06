import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { InventoryItem } from '../types';
import { calculateExpiryStatus, getOpenedExpiryDate } from '../utils/logic';
import { findBestRecipes } from '../services/recipeService';
import { sendExpiryReminder, isEmailConfigured } from '../services/emailService';
import { itemsAPI } from '../services/api';
import { useAuth } from './AuthContext';

type InventoryContextType = {
    items: InventoryItem[];
    isLoading: boolean;
    addItem: (item: Omit<InventoryItem, 'id' | 'status' | 'isOpened'>) => Promise<void>;
    updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    toggleOpened: (id: string) => Promise<void>;
    refreshStatus: () => void;
    checkReminders: () => Promise<void>;
    sendTestReminder: (itemId: string) => Promise<boolean>;
    refetchItems: () => Promise<void>;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch items from database
    const refetchItems = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            const data = await itemsAPI.getAll();
            // Add client-side status calculation
            const itemsWithStatus = data.map((item: InventoryItem) => ({
                ...item,
                status: calculateExpiryStatus(item)
            }));
            setItems(itemsWithStatus);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    }, [isAuthenticated]);

    // Fetch items on auth change
    useEffect(() => {
        if (isAuthenticated) {
            refetchItems();
        } else {
            setItems([]);
            setIsLoading(false);
        }
    }, [isAuthenticated, refetchItems]);

    // Recalculate status
    const refreshStatus = useCallback(() => {
        setItems(prev => prev.map(item => ({
            ...item,
            status: calculateExpiryStatus(item)
        })));
    }, []);

    // Check all items for reminders that need to be sent
    const checkReminders = useCallback(async () => {
        console.log('🔔 Checking reminders...');
        console.log('📧 Email configured:', isEmailConfigured());

        if (!isEmailConfigured()) {
            console.warn('⚠️ EmailJS not configured! Please set VITE_EMAILJS_* environment variables.');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const itemsToRemind = items.filter(item => {
            if (item.reminderDays === 0 || !item.reminderEmail || item.reminderSent) {
                return false;
            }

            const expiry = new Date(item.expiryDate);
            expiry.setHours(0, 0, 0, 0);
            const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return daysUntilExpiry <= item.reminderDays && daysUntilExpiry > 0;
        });

        for (const item of itemsToRemind) {
            const allItemNames = items.map(i => i.name);
            const recipes = await findBestRecipes(item.name, allItemNames);
            const success = await sendExpiryReminder(item, recipes);

            if (success) {
                // Update in database
                try {
                    await itemsAPI.update(item.id, { reminderSent: true });
                    setItems(prev => prev.map(i =>
                        i.id === item.id ? { ...i, reminderSent: true } : i
                    ));
                } catch (error) {
                    console.error('Failed to update reminder status:', error);
                }
            }
        }
    }, [items]);

    // Send a test reminder for a specific item
    const sendTestReminder = useCallback(async (itemId: string): Promise<boolean> => {
        const item = items.find(i => i.id === itemId);
        if (!item || !item.reminderEmail) {
            return false;
        }

        const allItemNames = items.map(i => i.name);
        const recipes = await findBestRecipes(item.name, allItemNames);
        return await sendExpiryReminder(item, recipes);
    }, [items]);

    // Run checkReminders after initialization
    useEffect(() => {
        if (isInitialized && items.length > 0) {
            const timer = setTimeout(() => {
                checkReminders();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isInitialized, checkReminders, items.length]);

    const addItem = async (newItem: Omit<InventoryItem, 'id' | 'status' | 'isOpened'>) => {
        try {
            const created = await itemsAPI.create({
                name: newItem.name,
                quantity: newItem.quantity,
                unit: newItem.unit,
                category: newItem.category,
                expiryDate: newItem.expiryDate,
                isOpened: false,
                reminderDays: newItem.reminderDays || 0,
                reminderEmail: newItem.reminderEmail || ''
            });

            const itemWithStatus = {
                ...created,
                status: calculateExpiryStatus(created)
            };

            setItems(prev => [itemWithStatus, ...prev]);
        } catch (error) {
            console.error('Failed to add item:', error);
            throw error;
        }
    };

    const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
        try {
            const updated = await itemsAPI.update(id, updates);

            setItems(prev => prev.map(item => {
                if (item.id === id) {
                    const newItem = { ...item, ...updated };
                    newItem.status = calculateExpiryStatus(newItem);
                    // Reset reminderSent if expiry date changes
                    if (updates.expiryDate && updates.expiryDate !== item.expiryDate) {
                        newItem.reminderSent = false;
                    }
                    return newItem;
                }
                return item;
            }));
        } catch (error) {
            console.error('Failed to update item:', error);
            throw error;
        }
    };

    const removeItem = async (id: string) => {
        try {
            await itemsAPI.delete(id);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to delete item:', error);
            throw error;
        }
    };

    const toggleOpened = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item || item.isOpened) return;

        const openedDate = new Date().toISOString().split('T')[0];
        const newExpiry = getOpenedExpiryDate(openedDate, item.category);

        const updates = {
            isOpened: true,
            openedDate,
            expiryDate: newExpiry || item.expiryDate,
            reminderSent: false
        };

        await updateItem(id, updates);
    };

    return (
        <InventoryContext.Provider value={{
            items,
            isLoading,
            addItem,
            updateItem,
            removeItem,
            toggleOpened,
            refreshStatus,
            checkReminders,
            sendTestReminder,
            refetchItems
        }}>
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
