// WhatsApp Service for sending reminders
import type { InventoryItem } from '../types';

const API_BASE = '/api';

interface Recipe {
    name: string;
    id: string;
    image?: string;
    sourceUrl?: string;
}

export async function sendWhatsAppReminder(
    item: InventoryItem,
    recipes: Recipe[] = []
): Promise<boolean> {
    if (!item.reminderPhone) {
        console.warn('No phone number set for item:', item.name);
        return false;
    }

    // Calculate days left
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    try {
        const response = await fetch(`${API_BASE}/whatsapp/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: item.reminderPhone,
                itemName: item.name,
                expiryDate: item.expiryDate,
                daysLeft,
                // Pass full recipe data including image and link
                recipes: recipes.map(r => ({
                    name: r.name,
                    image: r.image || '',
                    link: r.sourceUrl || `https://www.themealdb.com/meal/${r.id}`
                }))
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp send failed:', data.error);
            return false;
        }

        console.log('✅ WhatsApp reminder sent:', data.messageId);
        return true;
    } catch (error) {
        console.error('WhatsApp error:', error);
        return false;
    }
}

export function isWhatsAppConfigured(): boolean {
    // Check if we're in production (Vercel) where Twilio is configured
    return true; // Config is on server side
}
