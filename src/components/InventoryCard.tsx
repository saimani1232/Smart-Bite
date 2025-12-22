import React from 'react';
import type { InventoryItem } from '../types';
import { useInventory } from '../context/InventoryContext';
import { Calendar, Milk, Wheat, Carrot, Drumstick, Box, Clock } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface InventoryCardProps {
    item: InventoryItem;
    onPreserve?: (item: InventoryItem) => void;
}

const getCategoryIcon = (category: InventoryItem['category']) => {
    const iconClass = "text-gray-400";
    switch (category) {
        case 'Dairy': return <Milk size={20} className={iconClass} />;
        case 'Grain': return <Wheat size={20} className={iconClass} />;
        case 'Vegetable': return <Carrot size={20} className={iconClass} />;
        case 'Meat': return <Drumstick size={20} className={iconClass} />;
        default: return <Box size={20} className={iconClass} />;
    }
};

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, onPreserve }) => {
    const { removeItem, toggleOpened } = useInventory();

    const getCardStyle = () => {
        switch (item.status) {
            case 'Expired': return 'card-danger glow-rose';
            case 'Expiring Soon': return 'card-warning glow-amber';
            default: return 'card-fresh';
        }
    };

    const getBadge = () => {
        switch (item.status) {
            case 'Expired': return <span className="badge badge-danger pulse-subtle">Expired</span>;
            case 'Expiring Soon': return <span className="badge badge-warning pulse-subtle">Use Soon</span>;
            default: return <span className="badge badge-fresh">Fresh</span>;
        }
    };

    const daysLeft = () => {
        const expiry = new Date(item.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const left = daysLeft();
    const maxDays = 30;
    const progressPercent = Math.max(0, Math.min(100, (left / maxDays) * 100));

    const getProgressColor = () => {
        if (left <= 0) return 'bg-rose-500';
        if (left <= 7) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className={twMerge("card p-5", getCardStyle())}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        {getBadge()}
                        {item.isOpened && (
                            <span className="badge bg-blue-100 text-blue-700">Opened</span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{item.quantity} {item.unit}</p>
                </div>

                <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    {getCategoryIcon(item.category)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5">
                    <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{item.expiryDate}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold">
                        <Clock size={12} />
                        <span className={left <= 3 ? 'text-rose-600' : left <= 7 ? 'text-amber-600' : 'text-emerald-600'}>
                            {left <= 0 ? 'Expired' : `${left} days left`}
                        </span>
                    </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={twMerge("h-full rounded-full transition-all duration-500", getProgressColor())}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100/80">
                {!item.isOpened && item.status !== 'Expired' && (
                    <button
                        onClick={() => toggleOpened(item.id)}
                        className="flex-1 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                        Mark Opened
                    </button>
                )}

                {item.status === 'Expiring Soon' && onPreserve && (
                    <button
                        onClick={() => onPreserve(item)}
                        className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 rounded-xl transition-all shadow-sm"
                    >
                        {item.quantity >= 2 ? '✨ Preserve' : '🍳 Recipes'}
                    </button>
                )}

                <button
                    onClick={() => removeItem(item.id)}
                    className="flex-1 py-2.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                    ✓ Used Up
                </button>
            </div>
        </div>
    );
};
