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
            return { emoji: '🥛', bg: 'from-blue-50 to-sky-50', border: 'border-blue-100', accent: 'text-blue-600' };
        case 'Grain':
            return { emoji: '🌾', bg: 'from-amber-50 to-yellow-50', border: 'border-amber-100', accent: 'text-amber-600' };
        case 'Vegetable':
            return { emoji: '🥬', bg: 'from-green-50 to-emerald-50', border: 'border-green-100', accent: 'text-green-600' };
        case 'Meat':
            return { emoji: '🍖', bg: 'from-red-50 to-rose-50', border: 'border-red-100', accent: 'text-red-600' };
        default:
            return { emoji: '📦', bg: 'from-gray-50 to-slate-50', border: 'border-gray-100', accent: 'text-gray-600' };
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

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, onPreserve }) => {
    const { removeItem, toggleOpened, updateItem } = useInventory();
    const [isEditing, setIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const [editName, setEditName] = useState(item.name);
    const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
    const [editUnit, setEditUnit] = useState(item.unit);
    const [editCategory, setEditCategory] = useState(item.category);
    const [editExpiry, setEditExpiry] = useState(item.expiryDate);

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
            bgLight: 'bg-rose-50',
            text: 'text-rose-600',
            label: 'Expired',
            icon: <AlertTriangle size={14} />,
            glow: 'shadow-rose-200'
        };
        if (left <= 3) return {
            gradient: 'from-orange-400 via-amber-500 to-orange-500',
            bg: 'bg-orange-500',
            bgLight: 'bg-orange-50',
            text: 'text-orange-600',
            label: 'Expiring',
            icon: <Timer size={14} />,
            glow: 'shadow-orange-200'
        };
        if (left <= 7) return {
            gradient: 'from-amber-400 via-yellow-500 to-amber-500',
            bg: 'bg-amber-500',
            bgLight: 'bg-amber-50',
            text: 'text-amber-600',
            label: 'Use Soon',
            icon: <Clock size={14} />,
            glow: 'shadow-amber-200'
        };
        return {
            gradient: 'from-emerald-400 via-green-500 to-teal-500',
            bg: 'bg-emerald-500',
            bgLight: 'bg-emerald-50',
            text: 'text-emerald-600',
            label: 'Fresh',
            icon: <CheckCircle2 size={14} />,
            glow: 'shadow-emerald-200'
        };
    };

    const config = getStatusConfig();

    const handleSave = () => {
        updateItem(item.id, {
            name: editName.trim() || item.name,
            quantity: parseFloat(editQuantity) || item.quantity,
            unit: editUnit,
            category: editCategory,
            expiryDate: editExpiry || item.expiryDate
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditName(item.name);
        setEditQuantity(item.quantity.toString());
        setEditUnit(item.unit);
        setEditCategory(item.category);
        setEditExpiry(item.expiryDate);
        setIsEditing(false);
    };

    // Format expiry date nicely
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate progress percentage (30 days = full)
    const progressPercent = Math.max(0, Math.min(100, (left / 30) * 100));

    return (
        <div
            className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 
                ${isHovered ? 'shadow-xl scale-[1.02]' : 'shadow-lg'} 
                ${config.glow}
                border border-gray-100/50`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Premium Status Indicator Bar */}
            <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

            {/* Main Content */}
            <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                    {/* Left: Category Icon + Name */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Category Badge */}
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${categoryConfig.bg} ${categoryConfig.border} border flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                            {categoryConfig.emoji}
                        </div>

                        <div className="min-w-0 flex-1">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-2 py-1 text-lg font-semibold bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    placeholder="Item name"
                                    autoFocus
                                />
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-gray-900 truncate leading-tight">
                                        {item.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <span className="font-medium">{item.quantity}</span>
                                        <span>{item.unit}</span>
                                        {item.isOpened && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-semibold rounded-md">
                                                OPENED
                                            </span>
                                        )}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Status Badge or Edit Controls */}
                    {isEditing ? (
                        <div className="flex gap-1.5">
                            <button
                                onClick={handleSave}
                                className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgLight} ${config.text} text-xs font-bold`}>
                            {config.icon}
                            <span>{config.label}</span>
                        </div>
                    )}
                </div>

                {/* Edit Form Fields */}
                {isEditing && (
                    <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-xl">
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">Qty</label>
                                <input
                                    type="number"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">Unit</label>
                                <select
                                    value={editUnit}
                                    onChange={(e) => setEditUnit(e.target.value as InventoryItem['unit'])}
                                    className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none"
                                >
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">Category</label>
                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value as InventoryItem['category'])}
                                    className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none"
                                >
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase">Expiry Date</label>
                            <input
                                type="date"
                                value={editExpiry}
                                onChange={(e) => setEditExpiry(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                        </div>
                    </div>
                )}

                {/* Expiry Progress Section */}
                {!isEditing && (
                    <div className="mb-4">
                        {/* Date and Countdown Row */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
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
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-700 ease-out`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {!isEditing && (
                    <div className="flex gap-2">
                        {/* Mark Opened */}
                        {!item.isOpened && left >= 0 && (
                            <button
                                onClick={() => toggleOpened(item.id)}
                                className="flex-1 py-2 px-3 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all flex items-center justify-center gap-1.5 group"
                                title={getOpenedExpiryInfo(item.category)}
                            >
                                <Package size={14} className="group-hover:scale-110 transition-transform" />
                                <span>Opened</span>
                            </button>
                        )}

                        {/* Get Recipes - for items expiring in 7 days or less */}
                        {left >= 0 && left <= 7 && onPreserve && (
                            <button
                                onClick={() => onPreserve(item)}
                                className={`flex-1 py-2 px-3 text-xs font-bold text-white bg-gradient-to-r ${config.gradient} rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 hover:scale-[1.02]`}
                            >
                                <ChefHat size={14} />
                                <span>Recipes</span>
                            </button>
                        )}

                        {/* Used Up */}
                        <button
                            onClick={() => removeItem(item.id)}
                            className="flex-1 py-2 px-3 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all flex items-center justify-center gap-1.5 group"
                        >
                            <Sparkles size={14} className="group-hover:scale-110 transition-transform" />
                            <span>Used</span>
                        </button>

                        {/* Delete */}
                        <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all hover:scale-105"
                            title="Delete item"
                        >
                            <Trash2 size={14} />
                        </button>

                        {/* Edit - always visible */}
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all hover:scale-105"
                            title="Edit item"
                        >
                            <Edit3 size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
