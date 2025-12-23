import type { InventoryItem } from '../types';

/**
 * Determines if an item is considered "Bulk" based on quantity.
 * Bulk Rule: Quantity >= 2kg OR >= 3 packets.
 */
export const isBulkItem = (quantity: number, unit: InventoryItem['unit']): boolean => {
    if (unit === 'kg' || unit === 'l') { // Treating liters similar to kg for volume logic
        return quantity >= 2;
    }
    if (unit === 'pkg') {
        return quantity >= 3;
    }
    return false;
};

/**
 * Calculates the logic threshold days for an item.
 * Bulk items get 14 days notice, others get 3 days.
 */
export const getLogicThresholdDays = (item: InventoryItem): number => {
    return isBulkItem(item.quantity, item.unit) ? 14 : 3;
};

/**
 * Calculates the current status of an item based on its expiry date and volume logic.
 */
export const calculateExpiryStatus = (item: InventoryItem): InventoryItem['status'] => {
    const today = new Date();
    // Reset time to midnight for accurate date comparison
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(item.expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return 'Expired';
    }

    const threshold = getLogicThresholdDays(item);

    if (diffDays <= threshold) {
        return 'Expiring Soon';
    }

    return 'Good';
};

/**
 * Calculates the new expiry date when an item is opened.
 * Category-based rules:
 * - Dairy: openedDate + 4 days (milk, yogurt spoil quickly)
 * - Meat: openedDate + 3 days (raw meat is very perishable)
 * - Vegetable: openedDate + 5 days (cut veggies last a bit longer)
 * - Grain: No change (sealed grains stay fresh)
 * - Other: openedDate + 7 days (default for packaged foods, sauces, etc.)
 */
export const getOpenedExpiryDate = (
    openedDateStr: string,
    category: InventoryItem['category'],
    originalExpiry?: string
): string | null => {
    const openedDate = new Date(openedDateStr);
    openedDate.setHours(0, 0, 0, 0);
    const newExpiry = new Date(openedDate);

    // Calculate days to add based on category
    let daysToAdd: number | null = null;

    switch (category) {
        case 'Dairy':
            daysToAdd = 4; // Milk, yogurt, cheese - short shelf life once opened
            break;
        case 'Meat':
            daysToAdd = 3; // Raw meat is very perishable
            break;
        case 'Vegetable':
            daysToAdd = 5; // Cut vegetables
            break;
        case 'Grain':
            return null; // Grains, flour, rice - no change needed
        case 'Other':
        default:
            daysToAdd = 7; // Packaged foods, sauces, snacks
            break;
    }

    if (daysToAdd === null) {
        return null;
    }

    newExpiry.setDate(openedDate.getDate() + daysToAdd);

    // If original expiry is sooner than the new calculated one, use the original
    if (originalExpiry) {
        const origDate = new Date(originalExpiry);
        origDate.setHours(0, 0, 0, 0);
        if (origDate < newExpiry) {
            return originalExpiry;
        }
    }

    return newExpiry.toISOString().split('T')[0];
};

// Helper to check if we should override expiry
export const shouldOverrideExpiryOnOpen = (category: InventoryItem['category']): boolean => {
    return category !== 'Grain'; // All categories except Grain get adjusted
};

// Get the number of days added when opening an item of this category
export const getOpenedExpiryDays = (category: InventoryItem['category']): number | null => {
    switch (category) {
        case 'Dairy': return 4;
        case 'Meat': return 3;
        case 'Vegetable': return 5;
        case 'Other': return 7;
        default: return null;
    }
};

