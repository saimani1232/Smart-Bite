import React, { useEffect, useState } from 'react';
import type { InventoryItem } from '../types';
import { X, Snowflake, Sun, Heart, ArrowRight, Loader, ExternalLink, Clock, Users, ChefHat, RefreshCw } from 'lucide-react';
import { findBestRecipes, type Recipe } from '../services/recipeService';
import { useInventory } from '../context/InventoryContext';

interface ActionModalProps {
    item: InventoryItem;
    onClose: () => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({ item, onClose }) => {
    const { items } = useInventory();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isBulk = item.quantity >= 2 || (item.unit === 'pkg' && item.quantity >= 3);

    // Fetch recipes from Spoonacular API
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            setError(null);

            try {
                // Get all inventory item names for better recipe matching
                const allItemNames = items.map(i => i.name);

                console.log('🍳 Fetching recipes for:', item.name);
                console.log('📋 Other inventory items:', allItemNames);

                const fetchedRecipes = await findBestRecipes(item.name, allItemNames);

                console.log('✅ Recipes found:', fetchedRecipes.length);

                if (fetchedRecipes.length === 0) {
                    setError('No recipes found for this ingredient. Try a different item.');
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

    const preservationOptions = [
        { title: 'Freeze It', desc: 'Lasts up to 3 months', icon: <Snowflake size={20} />, color: 'from-blue-500 to-cyan-500' },
        { title: 'Sun Dry', desc: 'Traditional preservation', icon: <Sun size={20} />, color: 'from-amber-500 to-orange-500' },
        { title: 'Share with Others', desc: 'Help your community', icon: <Heart size={20} />, color: 'from-rose-500 to-pink-500' }
    ];

    return (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className={`p-6 text-white ${isBulk ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-1">
                                {isBulk ? 'Bulk Item Detected' : '🍳 Recipe Suggestions'}
                            </p>
                            <h2 className="text-2xl font-bold">{item.name}</h2>
                            <p className="text-white/80 mt-1">{item.quantity} {item.unit}</p>
                        </div>
                        <div className="flex gap-2">
                            {!isBulk && !loading && (
                                <button
                                    onClick={handleRefresh}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                    title="Refresh recipes"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isBulk
                            ? "You have a lot! Here are ways to preserve it."
                            : "Don't let it go to waste! Here are some delicious recipes you can make."
                        }
                    </p>

                    <div className="space-y-3">
                        {isBulk ? (
                            // Preservation options for bulk items
                            preservationOptions.map((opt, idx) => (
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
                            ))
                        ) : loading ? (
                            // Loading state
                            <div className="text-center py-12">
                                <Loader size={32} className="animate-spin text-amber-500 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">Finding delicious recipes...</p>
                            </div>
                        ) : error ? (
                            // Error state
                            <div className="text-center py-12">
                                <ChefHat size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">{error}</p>
                                <button
                                    onClick={handleRefresh}
                                    className="mt-4 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium text-sm"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            // Recipe cards from API
                            recipes.map((recipe) => (
                                <a
                                    key={recipe.id}
                                    href={recipe.sourceUrl || `https://spoonacular.com/recipes/${recipe.name.toLowerCase().replace(/\s+/g, '-')}-${recipe.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-2xl transition-all group"
                                >
                                    {/* Recipe Image */}
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                                        {recipe.image ? (
                                            <img
                                                src={recipe.image}
                                                alt={recipe.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">
                                                🍽️
                                            </div>
                                        )}
                                    </div>

                                    {/* Recipe Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">{recipe.name}</h4>

                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {recipe.readyInMinutes && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {recipe.readyInMinutes} min
                                                </span>
                                            )}
                                            {recipe.servings && (
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} />
                                                    {recipe.servings} servings
                                                </span>
                                            )}
                                        </div>

                                        {recipe.matchedIngredients.length > 0 && (
                                            <p className="text-xs text-emerald-600 mt-1 truncate">
                                                ✓ Uses: {recipe.matchedIngredients.slice(0, 3).join(', ')}
                                                {recipe.matchedIngredients.length > 3 && ` +${recipe.matchedIngredients.length - 3} more`}
                                            </p>
                                        )}
                                    </div>

                                    <ExternalLink size={16} className="text-gray-300 group-hover:text-amber-500 flex-shrink-0 mt-1" />
                                </a>
                            ))
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-6 py-3.5 text-gray-500 dark:text-gray-400 font-medium text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
