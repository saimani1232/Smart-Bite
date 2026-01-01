import React from 'react';
import { X, AlertTriangle, Clock, Timer, Bell, ChefHat, Mail, CheckCircle2 } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenRecipes: (itemId: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
    isOpen,
    onClose,
    onOpenRecipes
}) => {
    const { items } = useInventory();

    // Calculate days left for each item
    const getDaysLeft = (expiryDate: string) => {
        const expiry = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Get notifications sorted by urgency
    const notifications = items
        .map(item => ({
            ...item,
            daysLeft: getDaysLeft(item.expiryDate)
        }))
        .filter(item => item.daysLeft <= 7) // Only items expiring within 7 days or expired
        .sort((a, b) => a.daysLeft - b.daysLeft);

    const expiredItems = notifications.filter(n => n.daysLeft < 0);
    const expiringToday = notifications.filter(n => n.daysLeft === 0);
    const expiringSoon = notifications.filter(n => n.daysLeft > 0 && n.daysLeft <= 3);
    const expiringLater = notifications.filter(n => n.daysLeft > 3 && n.daysLeft <= 7);

    if (!isOpen) return null;

    const getCategoryEmoji = (category: string) => {
        switch (category) {
            case 'Dairy': return '🥛';
            case 'Grain': return '🌾';
            case 'Vegetable': return '🥬';
            case 'Meat': return '🍖';
            default: return '📦';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Bell size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Notifications</h2>
                                <p className="text-white/80 text-sm">
                                    {notifications.length === 0
                                        ? 'All items are fresh!'
                                        : `${notifications.length} item${notifications.length !== 1 ? 's' : ''} need attention`
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto h-[calc(100%-88px)]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={40} className="text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">All Clear!</h3>
                            <p className="text-gray-500 dark:text-gray-400">No items expiring soon. Great job managing your inventory!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Expired Section */}
                            {expiredItems.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle size={18} className="text-rose-500" />
                                        <h3 className="font-bold text-rose-600 dark:text-rose-400">Expired ({expiredItems.length})</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {expiredItems.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 rounded-xl flex items-center gap-3"
                                            >
                                                <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                                    <p className="text-xs text-rose-600 dark:text-rose-400">
                                                        Expired {Math.abs(item.daysLeft)} day{Math.abs(item.daysLeft) !== 1 ? 's' : ''} ago
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded-full">
                                                    Expired
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expiring Today */}
                            {expiringToday.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Timer size={18} className="text-orange-500" />
                                        <h3 className="font-bold text-orange-600 dark:text-orange-400">Expiring Today ({expiringToday.length})</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {expiringToday.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800/50 rounded-xl flex items-center gap-3"
                                            >
                                                <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                                    <p className="text-xs text-orange-600 dark:text-orange-400">Use it today!</p>
                                                </div>
                                                <button
                                                    onClick={() => onOpenRecipes(item.id)}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1 hover:shadow-md transition-all"
                                                >
                                                    <ChefHat size={12} />
                                                    Recipes
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expiring in 1-3 days */}
                            {expiringSoon.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock size={18} className="text-amber-500" />
                                        <h3 className="font-bold text-amber-600 dark:text-amber-400">Use Soon ({expiringSoon.length})</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {expiringSoon.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 rounded-xl flex items-center gap-3"
                                            >
                                                <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                                        {item.daysLeft} day{item.daysLeft !== 1 ? 's' : ''} left • {formatDate(item.expiryDate)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => onOpenRecipes(item.id)}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1 hover:shadow-md transition-all"
                                                >
                                                    <ChefHat size={12} />
                                                    Recipes
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expiring in 4-7 days */}
                            {expiringLater.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Bell size={18} className="text-blue-500" />
                                        <h3 className="font-bold text-blue-600 dark:text-blue-400">Upcoming ({expiringLater.length})</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {expiringLater.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-xl flex items-center gap-3"
                                            >
                                                <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                                        {item.daysLeft} days left • {formatDate(item.expiryDate)}
                                                    </p>
                                                </div>
                                                {item.reminderEmail && (
                                                    <div className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                                                        <Mail size={12} />
                                                        <span>Reminder set</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper to get notification count
export const getNotificationCount = (items: { expiryDate: string }[]): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.filter(item => {
        const expiry = new Date(item.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7;
    }).length;
};
