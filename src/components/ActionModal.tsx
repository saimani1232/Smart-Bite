import React from 'react';
import type { InventoryItem } from '../types';
import { X, Snowflake, Sun, Heart, ArrowRight } from 'lucide-react';

interface ActionModalProps {
    item: InventoryItem;
    onClose: () => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({ item, onClose }) => {
    const isBulk = item.quantity >= 2 || (item.unit === 'pkg' && item.quantity >= 3);

    const recipes = [
        { title: 'Pancakes', desc: 'Perfect for using up milk and flour', emoji: '🥞' },
        { title: 'Creamy Pasta', desc: 'Rich and satisfying dinner', emoji: '🍝' },
        { title: 'Quick Stir Fry', desc: 'Healthy and fast option', emoji: '🥗' }
    ];

    const preservationOptions = [
        { title: 'Freeze It', desc: 'Lasts up to 3 months', icon: <Snowflake size={20} />, color: 'from-blue-500 to-cyan-500' },
        { title: 'Sun Dry', desc: 'Traditional preservation', icon: <Sun size={20} />, color: 'from-amber-500 to-orange-500' },
        { title: 'Share with Others', desc: 'Help your community', icon: <Heart size={20} />, color: 'from-rose-500 to-pink-500' }
    ];

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`p-6 text-white ${isBulk ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-1">
                                {isBulk ? 'Bulk Item Detected' : 'Expiring Soon'}
                            </p>
                            <h2 className="text-2xl font-bold">{item.name}</h2>
                            <p className="text-white/80 mt-1">{item.quantity} {item.unit}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        {isBulk
                            ? "You have a lot! Here are ways to preserve it."
                            : "Let's use this before it expires. Here are some ideas."
                        }
                    </p>

                    <div className="space-y-3">
                        {isBulk ? (
                            preservationOptions.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all group"
                                >
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${opt.color} text-white shadow-lg`}>
                                        {opt.icon}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-gray-900">{opt.title}</h4>
                                        <p className="text-sm text-gray-500">{opt.desc}</p>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))
                        ) : (
                            recipes.map((recipe, idx) => (
                                <button
                                    key={idx}
                                    className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all group"
                                >
                                    <div className="w-12 h-12 flex items-center justify-center text-3xl bg-white rounded-xl shadow-sm">
                                        {recipe.emoji}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-gray-900">{recipe.title}</h4>
                                        <p className="text-sm text-gray-500">{recipe.desc}</p>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-6 py-3.5 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};
