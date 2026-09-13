import React, { useState } from 'react';
import type { InventoryItem } from '../types';
import { useInventory } from '../context/InventoryContext';
import {
    Calendar,
    Edit3,
    Check,
    X,
    Trash2,
    ChefHat,
    Package,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Mail,
    Plus,
    Minus,
} from 'lucide-react';

interface InventoryCardProps {
    item: InventoryItem;
    onPreserve?: (item: InventoryItem) => void;
}

const getCategoryConfig = (category: InventoryItem['category']) => {
    switch (category) {
        case 'Dairy':
            return { emoji: '🥛', label: 'Dairy', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800/50', text: 'text-blue-700 dark:text-blue-300' };
        case 'Grain':
            return { emoji: '🌾', label: 'Grains', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-300' };
        case 'Vegetable':
            return { emoji: '🥬', label: 'Produce', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-300' };
        case 'Meat':
            return { emoji: '🥩', label: 'Meat', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800/50', text: 'text-rose-700 dark:text-rose-300' };
        case 'Snacks':
            return { emoji: '🍿', label: 'Snacks', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800/50', text: 'text-orange-700 dark:text-orange-300' };
        default:
            return { emoji: '🥫', label: 'Pantry', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300' };
    }
};

const getOpenedExpiryInfo = (category: InventoryItem['category']): string => {
    switch (category) {
        case 'Dairy': return 'Reduces shelf life to ~4 days once opened';
        case 'Meat': return 'Reduces shelf life to ~3 days once opened';
        case 'Vegetable': return 'Reduces shelf life to ~5 days once opened';
        case 'Snacks': return 'Reduces shelf life to ~14 days once opened';
        default: return 'Mark item as opened to track freshness accurately';
    }
};

const CATEGORIES: InventoryItem['category'][] = ['Dairy', 'Grain', 'Vegetable', 'Meat', 'Snacks', 'Other'];
const UNITS: InventoryItem['unit'][] = ['pkg', 'kg', 'g', 'l', 'ml', 'pcs'];

// Edit Modal Component
const EditModal: React.FC<{
    item: InventoryItem;
    onSave: (updates: Partial<InventoryItem>) => void;
    onClose: () => void;
}> = ({ item, onSave, onClose }) => {
    const [editName, setEditName] = useState(item.name);
    const [editQuantity, setEditQuantity] = useState(item.quantity);
    const [editUnit, setEditUnit] = useState(item.unit);
    const [editCategory, setEditCategory] = useState(item.category);
    const [editExpiry, setEditExpiry] = useState(item.expiryDate);
    const [editEmail, setEditEmail] = useState(item.reminderEmail || '');
    const [editReminderDays, setEditReminderDays] = useState(item.reminderDays || 0);

    const handleSave = () => {
        onSave({
            name: editName.trim() || item.name,
            quantity: editQuantity || item.quantity,
            unit: editUnit,
            category: editCategory,
            expiryDate: editExpiry || item.expiryDate,
            reminderEmail: editEmail.trim() || undefined,
            reminderDays: editReminderDays
        });
        onClose();
    };

    const incrementQuantity = () => setEditQuantity(prev => Number((prev + 1).toFixed(1)));
    const decrementQuantity = () => setEditQuantity(prev => Math.max(0.1, Number((prev - 1).toFixed(1))));

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-scale-in">
            <div className="surface-card w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl">
                            {getCategoryConfig(editCategory).emoji}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                                Edit Item
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Update ingredient properties</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                    {/* Item Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Food Name
                        </label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="input-field font-semibold"
                            placeholder="e.g. Greek Yogurt, Tomatoes..."
                        />
                    </div>

                    {/* Quantity & Unit Stepper */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Quantity & Unit
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-1">
                                <button
                                    type="button"
                                    onClick={decrementQuantity}
                                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                                >
                                    <Minus size={14} />
                                </button>
                                <input
                                    type="number"
                                    step="any"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                                    className="w-full text-center bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={incrementQuantity}
                                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            <select
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value as InventoryItem['unit'])}
                                className="input-field font-semibold"
                            >
                                {UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            Category
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {CATEGORIES.map(cat => {
                                const cfg = getCategoryConfig(cat);
                                const isSelected = editCategory === cat;
                                return (
                                    <button
                                        type="button"
                                        key={cat}
                                        onClick={() => setEditCategory(cat)}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <span>{cfg.emoji}</span>
                                        <span>{cat}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Calendar size={13} /> Expiry Date
                        </label>
                        <input
                            type="date"
                            value={editExpiry}
                            onChange={(e) => setEditExpiry(e.target.value)}
                            className="input-field font-semibold"
                        />
                    </div>

                    {/* Reminder Settings */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Clock size={13} /> Notify Me Before Expiry
                            </label>
                            <div className="flex gap-1.5">
                                {[0, 1, 2, 3, 5, 7].map(days => (
                                    <button
                                        type="button"
                                        key={days}
                                        onClick={() => setEditReminderDays(days)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            editReminderDays === days
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        {days === 0 ? 'Off' : `${days}d`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {editReminderDays > 0 && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Mail size={13} /> Notification Email
                                </label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="input-field text-xs"
                                    placeholder="your@email.com"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/70 flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-brand flex-1 py-2.5 text-xs font-bold"
                    >
                        <Check size={16} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, onPreserve }) => {
    const { removeItem, toggleOpened, updateItem } = useInventory();
    const [showEditModal, setShowEditModal] = useState(false);

    const daysLeft = () => {
        const expiry = new Date(item.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const left = daysLeft();
    const catConfig = getCategoryConfig(item.category);

    const getStatusTheme = () => {
        if (left < 0) {
            return {
                label: 'Expired',
                accentBorder: 'border-l-4 border-l-rose-500',
                badgeStyle: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
                barColor: 'bg-rose-500',
                textClass: 'text-rose-600 dark:text-rose-400',
                icon: <AlertTriangle size={13} />,
            };
        }
        if (left <= 3) {
            return {
                label: 'Expiring Soon',
                accentBorder: 'border-l-4 border-l-amber-500',
                badgeStyle: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
                barColor: 'bg-amber-500',
                textClass: 'text-amber-600 dark:text-amber-400',
                icon: <Clock size={13} />,
            };
        }
        if (left <= 7) {
            return {
                label: 'Use Soon',
                accentBorder: 'border-l-4 border-l-amber-400',
                badgeStyle: 'bg-amber-50/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/40',
                barColor: 'bg-amber-400',
                textClass: 'text-amber-600 dark:text-amber-400',
                icon: <Clock size={13} />,
            };
        }
        return {
            label: 'Fresh',
            accentBorder: 'border-l-4 border-l-emerald-500',
            badgeStyle: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
            barColor: 'bg-emerald-500',
            textClass: 'text-emerald-600 dark:text-emerald-400',
            icon: <CheckCircle2 size={13} />,
        };
    };

    const theme = getStatusTheme();

    // Format date string nicely
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate freshness lifecycle percentage (30 days window)
    const progressPercent = Math.max(0, Math.min(100, (left / 30) * 100));

    return (
        <>
            {showEditModal && (
                <EditModal
                    item={item}
                    onSave={(updates) => updateItem(item.id, updates)}
                    onClose={() => setShowEditModal(false)}
                />
            )}

            <div
                className={`surface-card ${theme.accentBorder} p-5 flex flex-col justify-between hover:shadow-elevated transition-all duration-200 group relative`}
            >
                <div>
                    {/* Top Row: Category Emoji, Name & Action Tools */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                            {/* Category Icon */}
                            <div className={`w-11 h-11 rounded-2xl ${catConfig.bg} ${catConfig.border} border flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                                {catConfig.emoji}
                            </div>

                            {/* Name & Metadata */}
                            <div className="min-w-0">
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate leading-snug">
                                    {item.name}
                                </h3>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {item.quantity} {item.unit}
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {item.category}
                                    </span>
                                    {item.isOpened && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                                            Opened
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Utility Buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setShowEditModal(true)}
                                aria-label="Edit item"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                                title="Edit item"
                            >
                                <Edit3 size={15} />
                            </button>
                            <button
                                onClick={() => removeItem(item.id)}
                                aria-label="Delete item"
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Delete item"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Expiry Life Cycle Indicator */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                                <Calendar size={13} />
                                <span>{formatDate(item.expiryDate)}</span>
                            </div>
                            <div className={`font-extrabold flex items-center gap-1 ${theme.textClass}`}>
                                {theme.icon}
                                <span>
                                    {left < 0
                                        ? `${Math.abs(left)}d expired`
                                        : left === 0
                                        ? 'Expires today!'
                                        : `${left}d left`}
                                </span>
                            </div>
                        </div>

                        {/* Freshness Visualizer Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-700/70 h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${theme.barColor}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5 sm:gap-2">
                    {/* Mark Opened Toggle */}
                    {!item.isOpened && left >= 0 && (
                        <button
                            onClick={() => toggleOpened(item.id)}
                            className="flex-1 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer truncate"
                            title={getOpenedExpiryInfo(item.category)}
                        >
                            <Package size={13} className="shrink-0" />
                            <span className="truncate">Opened</span>
                        </button>
                    )}

                    {/* Recipes CTA for near-expiry items */}
                    {left >= 0 && left <= 7 && onPreserve && (
                        <button
                            onClick={() => onPreserve(item)}
                            className="flex-1 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                        >
                            <ChefHat size={13} className="shrink-0" />
                            <span className="truncate">Recipes</span>
                        </button>
                    )}

                    {/* Used Up / Eaten CTA */}
                    <button
                        onClick={() => removeItem(item.id)}
                        className="py-2 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0 ml-auto"
                        title="Mark item as consumed"
                    >
                        <Sparkles size={13} className="shrink-0" />
                        <span>Used</span>
                    </button>
                </div>
            </div>
        </>
    );
};
