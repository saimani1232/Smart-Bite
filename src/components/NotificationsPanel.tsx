import React from 'react';
import { X, AlertTriangle, Clock, Timer, Bell, ChefHat, Mail, CheckCircle2, Sparkles, Zap } from 'lucide-react';
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
        .filter(item => item.daysLeft <= 7)
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

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
                {/* Header with gradient and glow effect */}
                <div className="relative overflow-hidden">
                    {/* Background gradient - emerald/teal to match branding */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />

                    {/* Animated glow effect */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-300/30 rounded-full blur-2xl" />

                    {/* Content */}
                    <div className="relative p-6 pb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg shadow-emerald-500/20">
                                    <Bell size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Alerts</h2>
                                    <p className="text-white/70 text-sm font-medium">
                                        {notifications.length === 0
                                            ? '✨ All fresh!'
                                            : `${notifications.length} items need attention`
                                        }
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={22} className="text-white" />
                            </button>
                        </div>

                        {/* Quick stats */}
                        {notifications.length > 0 && (
                            <div className="flex gap-3 mt-2">
                                {expiredItems.length > 0 && (
                                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                        <AlertTriangle size={14} className="text-red-200" />
                                        <span className="text-white text-xs font-bold">{expiredItems.length} expired</span>
                                    </div>
                                )}
                                {(expiringToday.length + expiringSoon.length) > 0 && (
                                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                        <Zap size={14} className="text-yellow-200" />
                                        <span className="text-white text-xs font-bold">{expiringToday.length + expiringSoon.length} urgent</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto h-[calc(100%-180px)]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="relative mb-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={48} className="text-emerald-500" />
                                </div>
                                <div className="absolute -top-1 -right-1">
                                    <Sparkles size={24} className="text-amber-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">All Clear!</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-[250px]">
                                No items expiring soon. You're doing great managing your inventory!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Expired Section */}
                            {expiredItems.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                                            <AlertTriangle size={16} className="text-rose-500" />
                                        </div>
                                        <h3 className="font-bold text-rose-600 dark:text-rose-400 text-sm">EXPIRED</h3>
                                        <span className="text-rose-500 text-xs font-medium bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">{expiredItems.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {expiredItems.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-4 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border border-rose-100 dark:border-rose-800/50 rounded-2xl flex items-center gap-3"
                                            >
                                                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                                                    <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                                        {Math.abs(item.daysLeft)} day{Math.abs(item.daysLeft) !== 1 ? 's' : ''} overdue
                                                    </p>
                                                </div>
                                                <span className="px-2.5 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm">
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
                                        <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                            <Timer size={16} className="text-orange-500" />
                                        </div>
                                        <h3 className="font-bold text-orange-600 dark:text-orange-400 text-sm">TODAY</h3>
                                        <span className="text-orange-500 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">{expiringToday.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {expiringToday.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-100 dark:border-orange-800/50 rounded-2xl flex items-center gap-3"
                                            >
                                                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                                                    <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Use it today!</p>
                                                </div>
                                                <button
                                                    onClick={() => onOpenRecipes(item.id)}
                                                    className="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:shadow-lg hover:shadow-orange-500/25 transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <ChefHat size={14} />
                                                    Cook
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
                                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                            <Clock size={16} className="text-amber-500" />
                                        </div>
                                        <h3 className="font-bold text-amber-600 dark:text-amber-400 text-sm">USE SOON</h3>
                                        <span className="text-amber-500 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">{expiringSoon.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {expiringSoon.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-center gap-3"
                                            >
                                                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                                                    <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                        {item.daysLeft} day{item.daysLeft !== 1 ? 's' : ''} left
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => onOpenRecipes(item.id)}
                                                    className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <ChefHat size={14} />
                                                    Ideas
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
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Bell size={16} className="text-blue-500" />
                                        </div>
                                        <h3 className="font-bold text-blue-600 dark:text-blue-400 text-sm">UPCOMING</h3>
                                        <span className="text-blue-500 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{expiringLater.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {expiringLater.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                                                    <span className="text-xl">{getCategoryEmoji(item.category)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">{item.name}</p>
                                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                                        {item.daysLeft} days left
                                                    </p>
                                                </div>
                                                {item.reminderEmail && (
                                                    <div className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                                                        <Mail size={12} />
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
