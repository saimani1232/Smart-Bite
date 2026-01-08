import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { InventoryItem } from '../types';
import { calculateExpiryStatus, getOpenedExpiryDate } from '../utils/logic';
import { findBestRecipes } from '../services/recipeService';
import { sendExpiryReminder, isEmailConfigured } from '../services/emailService';
import { sendWhatsAppReminder } from '../services/whatsappService';
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

    // Check all items for reminders that need to be sent (Email + WhatsApp)
    const checkReminders = useCallback(async () => {
        console.log('🔔 [REMINDER CHECK] Starting reminder check...');
        console.log('📦 Total items:', items.length);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('📅 Today:', today.toISOString().split('T')[0]);

        // Find items that need reminders (either email OR whatsapp)
        const itemsToRemind = items.filter(item => {
            console.log(`\n--- Checking: ${item.name} ---`);

            // Check 1: Reminder days set?
            if (item.reminderDays === 0) {
                console.log(`  ❌ SKIP: reminderDays = 0 (no reminder requested)`);
                return false;
            }
            console.log(`  ✓ reminderDays: ${item.reminderDays}`);

            // Check 2: Already sent?
            if (item.reminderSent) {
                console.log(`  ❌ SKIP: reminderSent = true (already notified)`);
                return false;
            }
            console.log(`  ✓ reminderSent: false`);

            // Check 3: Contact info provided?
            if (!item.reminderEmail && !item.reminderPhone) {
                console.log(`  ❌ SKIP: No email or phone set`);
                return false;
            }
            console.log(`  ✓ Contact: Email=${item.reminderEmail || 'none'}, Phone=${item.reminderPhone || 'none'}`);

            // Check 4: Within reminder window?
            const expiry = new Date(item.expiryDate);
            expiry.setHours(0, 0, 0, 0);
            const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            console.log(`  📅 Expiry: ${item.expiryDate}, Days left: ${daysUntilExpiry}`);

            // Must be within reminder window AND not already expired
            const shouldRemind = daysUntilExpiry <= item.reminderDays && daysUntilExpiry > 0;

            if (!shouldRemind) {
                if (daysUntilExpiry <= 0) {
                    console.log(`  ❌ SKIP: Already expired (${daysUntilExpiry} days)`);
                } else {
                    console.log(`  ❌ SKIP: Not in reminder window yet (${daysUntilExpiry} days > ${item.reminderDays} reminder days)`);
                }
                return false;
            }

            console.log(`  ✅ WILL REMIND: Within ${item.reminderDays}-day window`);
            return true;
        });

        console.log(`\n🎯 Items needing reminders: ${itemsToRemind.length}`);

        for (const item of itemsToRemind) {
            console.log(`\n📬 Processing reminder for: ${item.name}`);

            const allItemNames = items.map(i => i.name);
            const recipes = await findBestRecipes(item.name, allItemNames);
            console.log(`🍳 Found ${recipes.length} recipes`);

            let emailSent = false;
            let whatsAppSent = false;

            // Send Email if configured
            if (item.reminderEmail && isEmailConfigured()) {
                console.log(`📧 Sending email to: ${item.reminderEmail}`);
                emailSent = await sendExpiryReminder(item, recipes);
                console.log(`📧 Email sent: ${emailSent}`);
            }

            // Send WhatsApp if phone is set
            if (item.reminderPhone) {
                console.log(`📱 Sending WhatsApp to: ${item.reminderPhone}`);
                whatsAppSent = await sendWhatsAppReminder(item, recipes);
                console.log(`📱 WhatsApp sent: ${whatsAppSent}`);
            }

            // Mark as sent if either succeeded
            if (emailSent || whatsAppSent) {
                console.log(`✅ Marking ${item.name} reminder as sent`);
                try {
                    await itemsAPI.update(item.id, { reminderSent: true });
                    setItems(prev => prev.map(i =>
                        i.id === item.id ? { ...i, reminderSent: true } : i
                    ));
                } catch (error) {
                    console.error('❌ Failed to update reminder status:', error);
                }
            }
        }

        console.log('🔔 [REMINDER CHECK] Complete\n');
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
