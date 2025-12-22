import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { InventoryItem } from '../types';
import { calculateExpiryStatus, getOpenedExpiryDate } from '../utils/logic';

// Fallback for UUID since we didn't install the package
const generateId = () => Math.random().toString(36).substr(2, 9);

type InventoryContextType = {
    items: InventoryItem[];
    addItem: (item: Omit<InventoryItem, 'id' | 'status' | 'isOpened'>) => void;
    updateItem: (id: string, updates: Partial<InventoryItem>) => void;
    removeItem: (id: string) => void;
    toggleOpened: (id: string) => void;
    refreshStatus: () => void;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Mock Data
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
    },
    {
        id: '3',
        name: 'Tomato Puree',
        expiryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // 2 days
        quantity: 2,
        unit: 'pkg',
        category: 'Vegetable', // or Other
        isOpened: false,
        status: 'Expiring Soon',
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
    }, []);

    const addItem = (newItem: Omit<InventoryItem, 'id' | 'status' | 'isOpened'>) => {
        const item: InventoryItem = {
            ...newItem,
            id: generateId(),
            isOpened: false,
            status: 'Good', // temporary, will be recalculated
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
                    expiryDate: newExpiry || item.expiryDate // Use new expiry if logic dictates, else keep original
                };
                updated.status = calculateExpiryStatus(updated);
                return updated;
            }
            return item;
        }));
    };

    return (
        <InventoryContext.Provider value={{ items, addItem, updateItem, removeItem, toggleOpened, refreshStatus }}>
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
