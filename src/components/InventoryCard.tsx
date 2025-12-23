import React, { useState } from 'react';
import type { InventoryItem } from '../types';
import { useInventory } from '../context/InventoryContext';
import { Calendar, Milk, Wheat, Carrot, Drumstick, Box, Clock, Edit3, Check, X, Trash2, ChefHat, Package } from 'lucide-react';

interface InventoryCardProps {
    item: InventoryItem;
    onPreserve?: (item: InventoryItem) => void;
}

const getCategoryEmoji = (category: InventoryItem['category']) => {
    switch (category) {
        case 'Dairy': return '🥛';
        case 'Grain': return '🌾';
        case 'Vegetable': return '🥬';
        case 'Meat': return '🍖';
        default: return '📦';
    }
};

const getCategoryIcon = (category: InventoryItem['category']) => {
    switch (category) {
        case 'Dairy': return <Milk size={16} />;
        case 'Grain': return <Wheat size={16} />;
        case 'Vegetable': return <Carrot size={16} />;
        case 'Meat': return <Drumstick size={16} />;
        default: return <Box size={16} />;
    }
};

// Category-based opened expiry info for user feedback
const getOpenedExpiryInfo = (category: InventoryItem['category']): string => {
    switch (category) {
        case 'Dairy': return 'Expiry reduced to 4 days after opening';
        case 'Meat': return 'Expiry reduced to 3 days after opening';
        case 'Vegetable': return 'Expiry reduced to 5 days after opening';
        case 'Grain': return 'No change - grains stay fresh when opened';
        default: return 'Expiry adjusted based on item type';
    }
};

const CATEGORIES: InventoryItem['category'][] = ['Dairy', 'Grain', 'Vegetable', 'Meat', 'Other'];
const UNITS: InventoryItem['unit'][] = ['kg', 'l', 'pkg', 'pcs', 'g', 'ml'];

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, onPreserve }) => {
    const { removeItem, toggleOpened, updateItem } = useInventory();
    const [isEditing, setIsEditing] = useState(false);

    // Edit state for all fields
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

    const getStatusConfig = () => {
        if (left < 0) return {
            gradient: 'from-rose-500 to-red-600',
            bgGlow: 'shadow-rose-500/20',
            badge: 'bg-rose-500',
            text: 'Expired',
            ring: 'ring-rose-200'
        };
        if (left <= 7) return {
            gradient: 'from-amber-400 to-orange-500',
            bgGlow: 'shadow-amber-500/20',
            badge: 'bg-gradient-to-r from-amber-400 to-orange-500',
            text: 'Use Soon',
            ring: 'ring-amber-200'
        };
        return {
            gradient: 'from-emerald-400 to-teal-500',
            bgGlow: 'shadow-emerald-500/20',
            badge: 'bg-gradient-to-r from-emerald-400 to-teal-500',
            text: 'Fresh',
            ring: 'ring-emerald-200'
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

    const handleMarkOpened = () => {
        toggleOpened(item.id);
    };

    return (
        <div className={`relative bg-white rounded-3xl overflow-hidden shadow-lg ${config.bgGlow} hover:shadow-xl transition-all duration-300 group`}>
            {/* Colored Top Banner */}
            <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

            {/* Category Badge - Top Right */}
            <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur rounded-2xl shadow-lg flex items-center justify-center text-2xl border border-gray-100">
                {getCategoryEmoji(item.category)}
            </div>

            {/* Edit Button - Visible on hover */}
            {!isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                >
                    <Edit3 size={16} className="text-gray-600" />
                </button>
            )}

            <div className="p-5 pt-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 ${config.badge} text-white text-xs font-bold rounded-full shadow-sm`}>
                        {config.text}
                    </span>
                    {item.isOpened && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Opened
                        </span>
                    )}
                </div>

                {/* Content - Edit Mode or View Mode */}
                {isEditing ? (
                    <div className="space-y-3 mb-4">
                        {/* Name */}
                        <div>
                            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Name</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-3 py-2 text-base font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 mt-1"
                                placeholder="Item name"
                            />
                        </div>

                        {/* Quantity & Unit */}
                        <div className="flex gap-2">
                            <div className="w-24">
                                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Qty</label>
                                <input
                                    type="number"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 mt-1"
                                    placeholder="Qty"
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Unit</label>
                                <select
                                    value={editUnit}
                                    onChange={(e) => setEditUnit(e.target.value as InventoryItem['unit'])}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 mt-1"
                                >
                                    {UNITS.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Category</label>
                            <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as InventoryItem['category'])}
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 mt-1"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{getCategoryEmoji(cat)} {cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Expiry Date</label>
                            <input
                                type="date"
                                value={editExpiry}
                                onChange={(e) => setEditExpiry(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 mt-1"
                            />
                        </div>

                        {/* Save/Cancel Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                            >
                                <Check size={16} /> Save
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Item Name & Quantity */}
                        <h3 className="text-xl font-bold text-gray-900 mb-1 pr-14">{item.name}</h3>
                        <p className="text-gray-500 text-sm mb-4 flex items-center gap-1.5">
                            {getCategoryIcon(item.category)}
                            <span>{item.quantity} {item.unit} • {item.category}</span>
                        </p>

                        {/* Expiry Info Card */}
                        <div className={`p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 mb-4`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar size={14} />
                                    <span className="text-sm">{item.expiryDate}</span>
                                </div>
                                <div className={`flex items-center gap-1.5 font-bold text-sm ${left < 0 ? 'text-rose-600' : left <= 7 ? 'text-amber-600' : 'text-emerald-600'
                                    }`}>
                                    <Clock size={14} />
                                    {left < 0 ? `${Math.abs(left)}d overdue` : left === 0 ? 'Today!' : `${left}d left`}
                                </div>
                            </div>

                            {/* Progress Ring Visual */}
                            <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                                    style={{ width: `${Math.max(5, Math.min(100, (left / 30) * 100))}%` }}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Action Buttons - Only show when not editing */}
                {!isEditing && (
                    <div className="flex gap-2">
                        {/* Mark Opened - only for unopened items that aren't expired */}
                        {!item.isOpened && left >= 0 && (
                            <button
                                onClick={handleMarkOpened}
                                className="flex-1 py-2.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors group/btn relative"
                                title={getOpenedExpiryInfo(item.category)}
                            >
                                <Package size={14} className="inline mr-1" />
                                Mark Opened
                                {/* Tooltip */}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {getOpenedExpiryInfo(item.category)}
                                </span>
                            </button>
                        )}

                        {/* Get Recipes - only for items expiring soon (0-7 days), NOT expired */}
                        {left >= 0 && left <= 7 && onPreserve && (
                            <button
                                onClick={() => onPreserve(item)}
                                className={`flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r ${config.gradient} rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5`}
                            >
                                <ChefHat size={14} />
                                Get Recipes
                            </button>
                        )}

                        <button
                            onClick={() => removeItem(item.id)}
                            className="flex-1 py-2.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
                        >
                            ✓ Used Up
                        </button>

                        <button
                            onClick={() => removeItem(item.id)}
                            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                            title="Delete item"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
