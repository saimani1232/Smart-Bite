import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Search, Clock, ChefHat, Utensils, Leaf, Dumbbell, Sparkles, ChevronLeft, ChevronRight, ExternalLink, Package } from 'lucide-react';
import { findBestRecipes, type Recipe } from '../services/recipeService';

type FilterType = 'expiring' | 'quick' | 'vegetarian' | 'protein' | null;

// Get category emoji
const getCategoryEmoji = (category: string) => {
    switch (category) {
        case 'Dairy': return '🥛';
        case 'Grain': return '🌾';
        case 'Vegetable': return '🥬';
        case 'Meat': return '🍖';
        default: return '📦';
    }
};

export const Recipes: React.FC = () => {
    const { items } = useInventory();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('expiring');
    const [expiringRecipes, setExpiringRecipes] = useState<Recipe[]>([]);
    const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);

    // Calculate days left helper
    const getDaysLeft = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Get expiring items (within 7 days)
    const expiringItems = useMemo(() => {
        return items
            .filter(item => {
                const daysLeft = getDaysLeft(item.expiryDate);
                return daysLeft >= 0 && daysLeft <= 7;
            })
            .sort((a, b) => getDaysLeft(a.expiryDate) - getDaysLeft(b.expiryDate));
    }, [items]);

    // Fetch recipes for expiring items
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            try {
                const allItemNames = items.map(i => i.name);

                // Get recipes for first expiring item
                if (expiringItems.length > 0) {
                    const recipes = await findBestRecipes(expiringItems[0].name, allItemNames);
                    setExpiringRecipes(recipes);
                }

                // Get some recommended recipes from a common ingredient
                const commonIngredients = ['chicken', 'pasta', 'tomato', 'egg'];
                const randomIngredient = commonIngredients[Math.floor(Math.random() * commonIngredients.length)];
                const recommended = await findBestRecipes(randomIngredient, allItemNames);
                setRecommendedRecipes(recommended);
            } catch (error) {
                console.error('Failed to fetch recipes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, [items, expiringItems]);

    // Filter chips
    const filterChips = [
        { id: 'expiring' as FilterType, label: 'Uses Expiring Items', icon: <Package size={16} />, active: true },
        { id: 'quick' as FilterType, label: 'Quick Meals (< 30m)', icon: <Clock size={16} /> },
        { id: 'vegetarian' as FilterType, label: 'Vegetarian', icon: <Leaf size={16} /> },
        { id: 'protein' as FilterType, label: 'High Protein', icon: <Dumbbell size={16} /> },
    ];

    // Apply filters to recipes
    const filteredRecipes = useMemo(() => {
        let recipes = [...expiringRecipes];

        switch (activeFilter) {
            case 'quick':
                // Filter to recipes that take 30 minutes or less
                recipes = recipes.filter(r => r.readyInMinutes && r.readyInMinutes <= 30);
                break;
            case 'vegetarian':
                // Filter by name heuristics (since TheMealDB doesn't flag vegetarian)
                const meatWords = ['chicken', 'beef', 'pork', 'lamb', 'meat', 'fish', 'salmon', 'shrimp', 'bacon', 'ham'];
                recipes = recipes.filter(r => {
                    const nameLower = r.name.toLowerCase();
                    return !meatWords.some(word => nameLower.includes(word));
                });
                break;
            case 'protein':
                // Filter to recipes likely high in protein (meat-based)
                const proteinWords = ['chicken', 'beef', 'pork', 'lamb', 'meat', 'fish', 'salmon', 'shrimp', 'egg', 'bean'];
                recipes = recipes.filter(r => {
                    const nameLower = r.name.toLowerCase();
                    return proteinWords.some(word => nameLower.includes(word));
                });
                break;
            default:
                // 'expiring' - show all expiring item recipes
                break;
        }

        return recipes;
    }, [expiringRecipes, activeFilter]);

    // Get section title based on filter
    const getSectionTitle = () => {
        switch (activeFilter) {
            case 'quick': return 'Quick Meals (Under 30 Minutes)';
            case 'vegetarian': return 'Vegetarian Options';
            case 'protein': return 'High Protein Recipes';
            default: return 'Use It Up - Expiring Soon';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Page Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-10 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Page Heading */}
                        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                                    What's cooking today?
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Discover recipes that help you reduce waste and save money.
                                </p>
                            </div>

                            {/* Search Bar */}
                            <div className="w-full md:w-auto md:min-w-[400px]">
                                <div className="flex w-full items-stretch rounded-xl h-12 shadow-sm overflow-hidden">
                                    <div className="text-gray-400 flex bg-white dark:bg-gray-800 items-center justify-center pl-4 border-l border-t border-b border-gray-200 dark:border-gray-700 rounded-l-xl">
                                        <Search size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex w-full flex-1 rounded-r-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border border-l-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 text-sm"
                                        placeholder="Search ingredients (e.g., Avocado, Chicken)..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                            {filterChips.map((chip) => (
                                <button
                                    key={chip.id}
                                    onClick={() => setActiveFilter(chip.id)}
                                    className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-5 transition-all ${activeFilter === chip.id
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {chip.icon}
                                    <span className="text-sm font-medium whitespace-nowrap">{chip.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Use It Up Section */}
                        <section className="mb-12">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    {getSectionTitle()}
                                </h2>
                                <button
                                    onClick={() => setActiveFilter('expiring')}
                                    className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline"
                                >
                                    {activeFilter !== 'expiring' ? 'Clear Filter' : 'View All'}
                                </button>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
                                            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredRecipes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredRecipes.slice(0, 6).map((recipe) => (
                                        <a
                                            key={recipe.id}
                                            href={recipe.sourceUrl || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                        >
                                            <div className="relative h-48 w-full overflow-hidden">
                                                {expiringItems.length > 0 && activeFilter === 'expiring' && (
                                                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 z-10 shadow-sm">
                                                        <Sparkles size={12} className="text-emerald-500" />
                                                        <span className="text-xs font-bold text-gray-800 dark:text-white">
                                                            Uses {expiringItems[0]?.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {activeFilter === 'quick' && recipe.readyInMinutes && (
                                                    <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full flex items-center gap-1 z-10 shadow-sm">
                                                        <Clock size={12} />
                                                        <span className="text-xs font-bold">{recipe.readyInMinutes} min</span>
                                                    </div>
                                                )}
                                                {activeFilter === 'vegetarian' && (
                                                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 z-10 shadow-sm">
                                                        <Leaf size={12} />
                                                        <span className="text-xs font-bold">Vegetarian</span>
                                                    </div>
                                                )}
                                                {activeFilter === 'protein' && (
                                                    <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1 z-10 shadow-sm">
                                                        <Dumbbell size={12} />
                                                        <span className="text-xs font-bold">High Protein</span>
                                                    </div>
                                                )}
                                                {recipe.image ? (
                                                    <img
                                                        src={recipe.image}
                                                        alt={recipe.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center text-5xl">
                                                        🍽️
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                                                        {recipe.name}
                                                    </h3>
                                                    {recipe.readyInMinutes && (
                                                        <div className="flex items-center gap-1 text-gray-400 ml-2 shrink-0">
                                                            <Clock size={14} />
                                                            <span className="text-xs font-medium">{recipe.readyInMinutes}m</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-full">
                                                            <ChefHat size={16} className="text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {recipe.servings || 2} servings
                                                        </span>
                                                    </div>
                                                    <div className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors">
                                                        <ExternalLink size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <ChefHat size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 mb-3">
                                        {activeFilter === 'expiring'
                                            ? 'No recipes found. Add items to your inventory!'
                                            : `No ${activeFilter === 'quick' ? 'quick' : activeFilter === 'vegetarian' ? 'vegetarian' : 'high protein'} recipes match your expiring items.`
                                        }
                                    </p>
                                    {activeFilter !== 'expiring' && (
                                        <button
                                            onClick={() => setActiveFilter('expiring')}
                                            className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline"
                                        >
                                            Show all recipes
                                        </button>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Recommended Section */}
                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    Recommended For You
                                </h2>
                                <div className="flex gap-2">
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {recommendedRecipes.slice(0, 4).map((recipe) => (
                                    <a
                                        key={recipe.id}
                                        href={recipe.sourceUrl || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="h-32 w-full overflow-hidden">
                                            {recipe.image ? (
                                                <img
                                                    src={recipe.image}
                                                    alt={recipe.name}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center text-4xl">
                                                    🍲
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 flex flex-col gap-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{recipe.name}</h3>
                                            <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
                                                {recipe.readyInMinutes && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {recipe.readyInMinutes}m
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Utensils size={12} />
                                                    {recipe.servings || 2} servings
                                                </span>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar - Expiring Pantry */}
                    <aside className="hidden xl:block w-80 shrink-0">
                        <div className="sticky top-24">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Expiring Pantry</h3>
                                <button className="text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:underline">Manage</button>
                            </div>

                            {expiringItems.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {expiringItems.slice(0, 5).map((item) => {
                                        const daysLeft = getDaysLeft(item.expiryDate);
                                        const colorClass = daysLeft <= 1
                                            ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                            : daysLeft <= 3
                                                ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                                : 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
                                            >
                                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg ${colorClass}`}>
                                                    {getCategoryEmoji(item.category)}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                        {item.name}
                                                    </span>
                                                    <span className={`text-xs font-medium ${daysLeft <= 1 ? 'text-red-500' : daysLeft <= 3 ? 'text-orange-500' : 'text-amber-500'}`}>
                                                        {daysLeft === 0 ? 'Expires today' : daysLeft === 1 ? 'Expires in 1 day' : `Expires in ${daysLeft} days`}
                                                    </span>
                                                </div>
                                                <button className="text-gray-400 hover:text-emerald-500 transition-colors">
                                                    <Search size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <Package size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No items expiring soon!</p>
                                </div>
                            )}

                            {/* Tip Card */}
                            {expiringItems.length > 0 && (
                                <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">Did you know?</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Cooking with these {expiringItems.length} items today could save you approximately ${(expiringItems.length * 4.50).toFixed(2)} in waste.
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* Scrollbar hide style */}
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
