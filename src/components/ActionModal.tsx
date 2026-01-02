import React, { useEffect, useState } from 'react';
import type { InventoryItem } from '../types';
import { X, Snowflake, Heart, ArrowRight, Loader, ExternalLink, Clock, ChefHat, RefreshCw, Check, Trash2, Package } from 'lucide-react';
import { findBestRecipes, type Recipe } from '../services/recipeService';
import { useInventory } from '../context/InventoryContext';

interface ActionModalProps {
    item: InventoryItem;
    onClose: () => void;
}

const getCategoryEmoji = (category: string) => {
    switch (category) {
        case 'Dairy': return '🥛';
        case 'Grain': return '🌾';
        case 'Vegetable': return '🥬';
        case 'Meat': return '🍖';
        default: return '📦';
    }
};

export const ActionModal: React.FC<ActionModalProps> = ({ item, onClose }) => {
    const { items, removeItem, toggleOpened } = useInventory();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOpened, setIsOpened] = useState(item.isOpened || false);

    const isBulk = item.quantity >= 2 || (item.unit === 'pkg' && item.quantity >= 3);

    // Calculate days left
    const getDaysLeft = () => {
        const expiry = new Date(item.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const daysLeft = getDaysLeft();

    const getStatusConfig = () => {
        if (daysLeft < 0) return { label: 'Expired', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', textColor: 'text-rose-600 dark:text-rose-400' };
        if (daysLeft <= 3) return { label: 'Expiring Soon', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', textColor: 'text-amber-600 dark:text-amber-400' };
        if (daysLeft <= 7) return { label: 'Use Soon', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', textColor: 'text-orange-600 dark:text-orange-400' };
        return { label: 'Fresh', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', textColor: 'text-emerald-600 dark:text-emerald-400' };
    };

    const statusConfig = getStatusConfig();

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Progress bar width
    const progressPercent = Math.max(0, Math.min(100, (daysLeft / 30) * 100));

    // Fetch recipes
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            setError(null);

            try {
                const allItemNames = items.map(i => i.name);
                const fetchedRecipes = await findBestRecipes(item.name, allItemNames);

                if (fetchedRecipes.length === 0) {
                    setError('No recipes found for this ingredient.');
                } else {
                    setRecipes(fetchedRecipes);
                }
            } catch (err) {
                console.error('Recipe fetch error:', err);
                setError('Failed to fetch recipes. Please check your internet connection.');
            } finally {
                setLoading(false);
            }
        };

        if (!isBulk) {
            fetchRecipes();
        } else {
            setLoading(false);
        }
    }, [item.name, items, isBulk]);

    const handleRefresh = async () => {
        setLoading(true);
        setError(null);

        try {
            const allItemNames = items.map(i => i.name);
            const fetchedRecipes = await findBestRecipes(item.name, allItemNames);

            if (fetchedRecipes.length === 0) {
                setError('No recipes found for this ingredient.');
            } else {
                setRecipes(fetchedRecipes);
            }
        } catch (err) {
            setError('Failed to fetch recipes.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOpened = () => {
        setIsOpened(!isOpened);
        toggleOpened(item.id);
    };

    const handleMarkConsumed = () => {
        removeItem(item.id);
        onClose();
    };

    const handleThrowAway = () => {
        removeItem(item.id);
        onClose();
    };

    const preservationOptions = [
        { title: 'Freeze for Later', desc: 'Extend shelf life by months', icon: <Snowflake size={20} />, color: 'from-blue-500 to-cyan-500' },
        { title: 'Share with Others', desc: 'Help your community', icon: <Heart size={20} />, color: 'from-rose-500 to-pink-500' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/30 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative p-6 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-start gap-5">
                        {/* Large Emoji Icon */}
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-amber-900/30 dark:to-orange-900/20 rounded-2xl flex items-center justify-center shadow-inner border border-amber-100 dark:border-amber-800/30 shrink-0">
                            <span className="text-5xl drop-shadow-sm">{getCategoryEmoji(item.category)}</span>
                        </div>

                        <div className="flex-1 pt-1">
                            {/* Status Badge */}
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                                    <Clock size={12} />
                                    {statusConfig.label}
                                </span>
                            </div>

                            {/* Item Name */}
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{item.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                Added on {formatDate(item.expiryDate)} • {item.quantity} {item.unit} available
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            <span>{isOpened ? 'Opened' : 'Packaged'}</span>
                            <span className={`font-bold ${statusConfig.textColor}`}>
                                {daysLeft < 0
                                    ? `${Math.abs(daysLeft)} days overdue`
                                    : daysLeft === 0
                                        ? 'Expires today!'
                                        : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                                }
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${daysLeft < 0 ? 'bg-rose-500' :
                                    daysLeft <= 3 ? 'bg-amber-500' :
                                        daysLeft <= 7 ? 'bg-orange-400' :
                                            'bg-emerald-500'
                                    }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Toggle Section */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-y border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Product Status</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Toggling updates expiration prediction</p>
                        </div>

                        {/* Custom Toggle */}
                        <button
                            onClick={handleToggleOpened}
                            className="relative w-36 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg p-1 flex"
                        >
                            <div
                                className={`absolute w-1/2 h-8 bg-white dark:bg-gray-800 rounded-md shadow-sm transition-all duration-300 ${isOpened ? 'left-[calc(50%-4px)]' : 'left-1'}`}
                            />
                            <div className={`z-10 w-1/2 flex items-center justify-center text-xs font-semibold transition-colors ${!isOpened ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                <Package size={12} className="mr-1" />
                                Sealed
                            </div>
                            <div className={`z-10 w-1/2 flex items-center justify-center text-xs font-semibold transition-colors ${isOpened ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                Opened
                            </div>
                        </button>
                    </div>
                </div>

                {/* Recipe Section */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ChefHat size={20} className="text-emerald-500" />
                                {isBulk ? 'Ways to preserve it' : 'Ideas to use it up'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {isBulk ? 'You have a lot! Here are options.' : 'Recommended based on quantity'}
                            </p>
                        </div>
                        {!isBulk && !loading && (
                            <button
                                onClick={handleRefresh}
                                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center"
                            >
                                <RefreshCw size={12} className="mr-1" />
                                Refresh
                            </button>
                        )}
                    </div>

                    {isBulk ? (
                        // Preservation options for bulk items
                        <div className="space-y-3">
                            {preservationOptions.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-2xl transition-all group"
                                >
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${opt.color} text-white shadow-lg`}>
                                        {opt.icon}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100">{opt.title}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{opt.desc}</p>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    ) : loading ? (
                        <div className="text-center py-12">
                            <Loader size={32} className="animate-spin text-emerald-500 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Finding delicious recipes...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <ChefHat size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="mt-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium text-sm"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        // Horizontal scrollable recipe carousel
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide">
                            {recipes.map((recipe) => (
                                <a
                                    key={recipe.id}
                                    href={recipe.sourceUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="snap-start min-w-[200px] bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex-shrink-0"
                                >
                                    {/* Recipe Image */}
                                    <div className="relative h-24 mb-3 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-600">
                                        {recipe.image ? (
                                            <img
                                                src={recipe.image}
                                                alt={recipe.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                                        )}
                                        {recipe.readyInMinutes && (
                                            <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white font-medium flex items-center gap-0.5">
                                                <Clock size={10} />
                                                {recipe.readyInMinutes}m
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 leading-snug mb-1 line-clamp-2">{recipe.name}</h4>

                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        <span>{recipe.servings || 2} servings</span>
                                    </div>
                                </a>
                            ))}

                            {/* Find More Card */}
                            <div className="snap-start min-w-[100px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 mb-2">
                                    <ExternalLink size={18} />
                                </div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Find More</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-2 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 mt-auto">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleMarkConsumed}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 flex items-center justify-center gap-2 transform transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Check size={20} />
                            Mark as Consumed
                        </button>
                        <button
                            onClick={handleThrowAway}
                            className="w-full group py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        >
                            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                            Throw away item
                        </button>
                    </div>
                </div>
            </div>

            {/* Hide scrollbar style */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
