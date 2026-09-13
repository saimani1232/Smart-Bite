import React, { useState } from 'react';
import {
    X,
    AlertTriangle,
    Clock,
    Timer,
    Bell,
    ChefHat,
    Mail,
    CheckCircle2
} from 'lucide-react';
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
    const [selectedTab, setSelectedTab] = useState<'all' | 'urgent' | 'soon'>('all');

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

    const urgentCount = expiredItems.length + expiringToday.length + expiringSoon.length;

    if (!isOpen) return null;

    const getCategoryEmoji = (category: string) => {
        switch (category) {
            case 'Dairy': return '🥛';
            case 'Grain': return '🌾';
            case 'Vegetable': return '🥬';
            case 'Meat': return '🍖';
            case 'Snacks': return '🍿';
            default: return '📦';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Slide-Over Drawer */}
            <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-slide-in">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Freshness Alerts
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {notifications.length === 0
                                        ? '✨ Everything is fresh'
                                        : `${notifications.length} item${notifications.length !== 1 ? 's' : ''} need attention`
                                    }
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Quick filter tabs */}
                    {notifications.length > 0 && (
                        <div className="flex gap-2 mt-4 pt-1">
                            <button
                                onClick={() => setSelectedTab('all')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    selectedTab === 'all'
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                All ({notifications.length})
                            </button>
                            <button
                                onClick={() => setSelectedTab('urgent')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    selectedTab === 'urgent'
                                        ? 'bg-rose-500 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                Urgent ({urgentCount})
                            </button>
                            <button
                                onClick={() => setSelectedTab('soon')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    selectedTab === 'soon'
                                        ? 'bg-amber-500 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                Soon ({expiringLater.length})
                            </button>
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                                No Expiry Alerts!
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                                All your food items have plenty of shelf life remaining. Keep up the good work managing your kitchen inventory!
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Expired Section */}
                            {(selectedTab === 'all' || selectedTab === 'urgent') && expiredItems.length > 0 && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                            <AlertTriangle size={14} />
                                        </div>
                                        <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                            Expired Items ({expiredItems.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {expiredItems.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-xs shrink-0">
                                                        {getCategoryEmoji(item.category)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                                                            {Math.abs(item.daysLeft)} day{Math.abs(item.daysLeft) !== 1 ? 's' : ''} overdue
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shrink-0">
                                                    Expired
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expiring Today */}
                            {(selectedTab === 'all' || selectedTab === 'urgent') && expiringToday.length > 0 && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                            <Timer size={14} />
                                        </div>
                                        <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                                            Expiring Today ({expiringToday.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {expiringToday.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/50 flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-xs shrink-0">
                                                        {getCategoryEmoji(item.category)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                                            Expires today!
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onOpenRecipes(item.id)}
                                                    className="btn-brand py-1.5 px-3 text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                                                >
                                                    <ChefHat size={13} />
                                                    <span>Cook</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expiring Soon (1-3 Days) */}
                            {(selectedTab === 'all' || selectedTab === 'urgent') && expiringSoon.length > 0 && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                            <Clock size={14} />
                                        </div>
                                        <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                            Use Soon (1-3 Days)
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {expiringSoon.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-xs shrink-0">
                                                        {getCategoryEmoji(item.category)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                            {item.daysLeft} day{item.daysLeft !== 1 ? 's' : ''} left
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onOpenRecipes(item.id)}
                                                    className="btn-brand py-1.5 px-3 text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                                                >
                                                    <ChefHat size={13} />
                                                    <span>Recipes</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upcoming (4-7 Days) */}
                            {(selectedTab === 'all' || selectedTab === 'soon') && expiringLater.length > 0 && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                                            <Bell size={14} />
                                        </div>
                                        <h3 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                                            Upcoming (4-7 Days)
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {expiringLater.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg shadow-xs shrink-0">
                                                        {getCategoryEmoji(item.category)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            {item.daysLeft} days left
                                                        </p>
                                                    </div>
                                                </div>
                                                {item.reminderEmail && (
                                                    <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400" title="Email reminder enabled">
                                                        <Mail size={13} />
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
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
