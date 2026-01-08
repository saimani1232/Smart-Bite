// Push Notification Service for browser notifications
import type { InventoryItem } from '../types';

// Check if push notifications are supported
export function isPushSupported(): boolean {
    return 'Notification' in window;
}

// Get current permission status
export function getPushPermission(): NotificationPermission | 'unsupported' {
    if (!isPushSupported()) return 'unsupported';
    return Notification.permission;
}

// Request permission for push notifications
export async function requestPushPermission(): Promise<boolean> {
    if (!isPushSupported()) {
        console.warn('Push notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('Push notifications were denied by user');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}

// Send a push notification for expiring item
export async function sendPushNotification(
    item: InventoryItem,
    recipes: { name: string; id: string }[] = []
): Promise<boolean> {
    if (!isPushSupported()) {
        console.warn('Push notifications not supported');
        return false;
    }

    if (Notification.permission !== 'granted') {
        console.warn('Push notifications not permitted');
        return false;
    }

    // Calculate days left
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Build notification title and body
    let title = `🍎 ${item.name} expires soon!`;
    let body = '';

    if (daysLeft <= 0) {
        title = `⚠️ ${item.name} has expired!`;
        body = 'Check your inventory for expired items.';
    } else if (daysLeft === 1) {
        title = `⏰ ${item.name} expires tomorrow!`;
        body = 'Use it today or find a recipe!';
    } else {
        body = `Expires in ${daysLeft} days. `;
    }

    // Add recipe suggestion if available
    if (recipes.length > 0) {
        body += `Try making: ${recipes[0].name}`;
    }

    try {
        const notification = new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `expiry-${item.id}`, // Prevents duplicate notifications
            requireInteraction: false,
            silent: false
        });

        // Close after 10 seconds
        setTimeout(() => notification.close(), 10000);

        // Handle click - focus/open the app
        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        console.log('✅ Push notification sent for:', item.name);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
}

// Check if user has enabled push notifications (stored in localStorage)
export function isPushEnabled(): boolean {
    return localStorage.getItem('pushNotificationsEnabled') === 'true';
}

// Enable/disable push notifications
export function setPushEnabled(enabled: boolean): void {
    localStorage.setItem('pushNotificationsEnabled', enabled ? 'true' : 'false');
}
