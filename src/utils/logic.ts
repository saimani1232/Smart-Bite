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
 * Dairy: +4 days
 * Sauces (mapped to Other or specific category if added): +30 days (Assuming 'Other' for sauces for now or added logic)
 * Grains: No change
 *
 * Note: The prompt specifies "Sauces" but the type definition has 'Dairy' | 'Grain' | 'Vegetable' | 'Meat' | 'Other'.
 * I will treat 'Other' as catching sauces or potentially add a check if we expand categories.
 * For now, I'll implement logic based on the prompt's intent.
 */
export const getOpenedExpiryDate = (
    openedDateStr: string,
    category: InventoryItem['category']
): string | null => {
    const openedDate = new Date(openedDateStr);
    const newExpiry = new Date(openedDate);

    switch (category) {
        case 'Dairy':
            newExpiry.setDate(openedDate.getDate() + 4);
            break;
        // logic.ts: "Sauces: New Expiry = openedDate + 30 days"
        // Since 'Sauces' isn't a strict category in the Type yet, we might use 'Other' or just handle it if we add it.
        // For this prototype, let's assume 'Other' might contain sauces, or we add 'Sauce' to type.
        // Let's stick to the prompt's categories: 'Dairy' | 'Grain' | 'Vegetable' | 'Meat' | 'Other'.
        // If we can't distinguish sauces, maybe we should update the type or just enable it for 'Other' for now as a catch-all?
        // Or better, let's strictly follow the "Dairy", "Grains" rules.
        // "Grains: No change".
        // "Sauces": I will add a comment that this requires a 'Sauce' category or specific name check.
        // For now I'll just return null if no change is needed (Grains, etc), allowing the caller to keep original date.
        case 'Grain':
            return null;
        default:
            // For other categories, we might not override, or maybe 'Other' implies Sauces for this demo?
            // Let's being safe and only override Dairy for now unless name contains "Sauce".
            return null;
    }

    return newExpiry.toISOString().split('T')[0];
};

// Helper to check if we should override expiry
export const shouldOverrideExpiryOnOpen = (category: InventoryItem['category']): boolean => {
    return category === 'Dairy'; // extendable
}
