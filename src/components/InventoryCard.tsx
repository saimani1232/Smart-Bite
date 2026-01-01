import React, { useState } from 'react';
import type { InventoryItem } from '../types';
import { useInventory } from '../context/InventoryContext';
import { Calendar, Clock, Edit3, Check, X, Trash2, ChefHat, Package, Sparkles, AlertTriangle, CheckCircle2, Timer } from 'lucide-react';

interface InventoryCardProps {
    item: InventoryItem;
    onPreserve?: (item: InventoryItem) => void;
}

const getCategoryConfig = (category: InventoryItem['category']) => {
    switch (category) {
        case 'Dairy':
            return { emoji: '🥛', bg: 'from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30', border: 'border-blue-100 dark:border-blue-800/50', accent: 'text-blue-600 dark:text-blue-400' };
        case 'Grain':
            return { emoji: '🌾', bg: 'from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30', border: 'border-amber-100 dark:border-amber-800/50', accent: 'text-amber-600 dark:text-amber-400' };
        case 'Vegetable':
            return { emoji: '🥬', bg: 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30', border: 'border-green-100 dark:border-green-800/50', accent: 'text-green-600 dark:text-green-400' };
        case 'Meat':
            return { emoji: '🍖', bg: 'from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30', border: 'border-red-100 dark:border-red-800/50', accent: 'text-red-600 dark:text-red-400' };
        default:
            return { emoji: '📦', bg: 'from-gray-50 to-slate-50 dark:from-gray-700/50 dark:to-slate-700/50', border: 'border-gray-100 dark:border-gray-700', accent: 'text-gray-600 dark:text-gray-400' };
    }
};

const getOpenedExpiryInfo = (category: InventoryItem['category']): string => {
    switch (category) {
        case 'Dairy': return 'Reduces to 4 days';
        case 'Meat': return 'Reduces to 3 days';
        case 'Vegetable': return 'Reduces to 5 days';
        case 'Grain': return 'No change needed';
        default: return 'Adjusted expiry';
    }
};

const CATEGORIES: InventoryItem['category'][] = ['Dairy', 'Grain', 'Vegetable', 'Meat', 'Other'];
const UNITS: InventoryItem['unit'][] = ['kg', 'l', 'pkg', 'pcs', 'g', 'ml'];

// Edit Modal Component
const EditModal: React.FC<{
    item: InventoryItem;
    onSave: (updates: Partial<InventoryItem>) => void;
    onClose: () => void;
}> = ({ item, onSave, onClose }) => {
    const [editName, setEditName] = useState(item.name);
    const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
    const [editUnit, setEditUnit] = useState(item.unit);
    const [editCategory, setEditCategory] = useState(item.category);
    const [editExpiry, setEditExpiry] = useState(item.expiryDate);

    const handleSave = () => {
        onSave({
            name: editName.trim() || item.name,
            quantity: parseFloat(editQuantity) || item.quantity,
            unit: editUnit,
            category: editCategory,
            expiryDate: editExpiry || item.expiryDate
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-white/80 text-sm font-medium">Edit Item</p>
                            <h2 className="text-xl font-bold">{item.name}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Product Name
                        </label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 dark:focus:border-emerald-500"
                            placeholder="Enter name"
                        />
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 dark:focus:border-emerald-500"
                                min="0"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Unit
                            </label>
                            <select
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value as InventoryItem['unit'])}
                                className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            >
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Category
                        </label>
                        <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as InventoryItem['category'])}
                            className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>
                                    {getCategoryConfig(cat).emoji} {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Expiry Date
                        </label>
                        <input
                            type="date"
                            value={editExpiry}
                            onChange={(e) => setEditExpiry(e.target.value)}
                            className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 dark:focus:border-emerald-500"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Save Changes
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, onPreserve }) => {
    const { removeItem, toggleOpened, updateItem } = useInventory();
    const [showEditModal, setShowEditModal] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const daysLeft = () => {
        const expiry = new Date(item.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const left = daysLeft();
    const categoryConfig = getCategoryConfig(item.category);

    const getStatusConfig = () => {
        if (left < 0) return {
            gradient: 'from-rose-500 via-red-500 to-rose-600',
            bg: 'bg-rose-500',
            bgLight: 'bg-rose-50 dark:bg-rose-900/30',
            text: 'text-rose-600 dark:text-rose-400',
            label: 'Expired',
            icon: <AlertTriangle size={14} />,
            glow: 'shadow-rose-200 dark:shadow-rose-900/30'
        };
        if (left <= 3) return {
            gradient: 'from-orange-400 via-amber-500 to-orange-500',
            bg: 'bg-orange-500',
            bgLight: 'bg-orange-50 dark:bg-orange-900/30',
            text: 'text-orange-600 dark:text-orange-400',
            label: 'Expiring',
            icon: <Timer size={14} />,
            glow: 'shadow-orange-200 dark:shadow-orange-900/30'
        };
        if (left <= 7) return {
            gradient: 'from-amber-400 via-yellow-500 to-amber-500',
            bg: 'bg-amber-500',
            bgLight: 'bg-amber-50 dark:bg-amber-900/30',
            text: 'text-amber-600 dark:text-amber-400',
            label: 'Use Soon',
            icon: <Clock size={14} />,
            glow: 'shadow-amber-200 dark:shadow-amber-900/30'
        };
        return {
            gradient: 'from-emerald-400 via-green-500 to-teal-500',
            bg: 'bg-emerald-500',
            bgLight: 'bg-emerald-50 dark:bg-emerald-900/30',
            text: 'text-emerald-600 dark:text-emerald-400',
            label: 'Fresh',
            icon: <CheckCircle2 size={14} />,
            glow: 'shadow-emerald-200 dark:shadow-emerald-900/30'
        };
    };

    const config = getStatusConfig();

    const handleSaveEdit = (updates: Partial<InventoryItem>) => {
        updateItem(item.id, updates);
    };

    // Format expiry date nicely
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate progress percentage (30 days = full)
    const progressPercent = Math.max(0, Math.min(100, (left / 30) * 100));

    return (
        <>
            {/* Edit Modal */}
            {showEditModal && (
                <EditModal
                    item={item}
                    onSave={handleSaveEdit}
                    onClose={() => setShowEditModal(false)}
                />
            )}

            <div
                className={`relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300 
                    ${isHovered ? 'shadow-xl scale-[1.02]' : 'shadow-lg'} 
                    ${config.glow}
                    border border-gray-100/50 dark:border-gray-700`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Premium Status Indicator Bar */}
                <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

                {/* Top Corner Buttons - Edit (Left) & Delete (Right) - Only visible on hover */}
                <div className={`absolute top-3 left-3 right-3 flex justify-between z-10 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Edit Button - Top Left */}
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="p-2 bg-white/90 dark:bg-gray-700/90 backdrop-blur shadow-md rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all hover:scale-105"
                        title="Edit item"
                    >
                        <Edit3 size={16} className="text-gray-600 dark:text-gray-300" />
                    </button>

                    {/* Delete Button - Top Right */}
                    <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 bg-white/90 dark:bg-gray-700/90 backdrop-blur shadow-md rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/50 transition-all hover:scale-105"
                        title="Delete item"
                    >
                        <Trash2 size={16} className="text-rose-500" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-4">
                    {/* Header Row */}
                    <div className="flex items-start gap-3 mb-3">
                        {/* Category Badge */}
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${categoryConfig.bg} ${categoryConfig.border} border flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                            {categoryConfig.emoji}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
                                {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-wrap">
                                <span className="font-medium">{item.quantity}</span>
                                <span>{item.unit}</span>
                                {item.isOpened && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-semibold rounded-md">
                                        OPENED
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgLight} ${config.text} text-xs font-bold flex-shrink-0`}>
                            {config.icon}
                            <span>{config.label}</span>
                        </div>
                    </div>

                    {/* Expiry Progress Section */}
                    <div className="mb-4">
                        {/* Date and Countdown Row */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                                <Calendar size={14} />
                                <span>{formatDate(item.expiryDate)}</span>
                            </div>
                            <div className={`font-bold text-sm ${config.text}`}>
                                {left < 0
                                    ? `${Math.abs(left)} days overdue`
                                    : left === 0
                                        ? 'Expires today!'
                                        : `${left} day${left !== 1 ? 's' : ''} left`
                                }
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-700 ease-out`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Action Buttons - Only core actions */}
                    <div className="flex gap-2">
                        {/* Mark Opened */}
                        {!item.isOpened && left >= 0 && (
                            <button
                                onClick={() => toggleOpened(item.id)}
                                className="flex-1 py-2.5 px-3 text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all flex items-center justify-center gap-1.5"
                                title={getOpenedExpiryInfo(item.category)}
                            >
                                <Package size={14} />
                                <span>Opened</span>
                            </button>
                        )}

                        {/* Get Recipes - for items expiring in 7 days or less */}
                        {left >= 0 && left <= 7 && onPreserve && (
                            <button
                                onClick={() => onPreserve(item)}
                                className={`flex-1 py-2.5 px-3 text-xs font-bold text-white bg-gradient-to-r ${config.gradient} rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5`}
                            >
                                <ChefHat size={14} />
                                <span>Recipes</span>
                            </button>
                        )}

                        {/* Used Up */}
                        <button
                            onClick={() => removeItem(item.id)}
                            className="flex-1 py-2.5 px-3 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            <Sparkles size={14} />
                            <span>Used</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
