import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
    Search,
    Clock,
    ChefHat,
    Utensils,
    Leaf,
    Dumbbell,
    Sparkles,
    ExternalLink,
    Package,
    ArrowRight,
    X,
    CheckCircle2,
    BookOpen,
    Flame
} from 'lucide-react';
import { findBestRecipes, type Recipe } from '../services/recipeService';

type FilterType = 'expiring' | 'quick' | 'vegetarian' | 'protein' | null;

// Get category emoji
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

interface RecipesProps {
    onNavigateHome?: () => void;
    initialIngredient?: string;
}

export const Recipes: React.FC<RecipesProps> = ({ onNavigateHome, initialIngredient }) => {
    const { items } = useInventory();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('expiring');
    const [selectedExpiringIngredient, setSelectedExpiringIngredient] = useState<string | null>(initialIngredient || null);
    const [expiringRecipes, setExpiringRecipes] = useState<Recipe[]>([]);
    const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeRecipeModal, setActiveRecipeModal] = useState<Recipe | null>(null);
    const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

    // Calculate days left helper
    const getDaysLeft = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Get expiring items (within 7 days) sorted by urgency
    const expiringItems = useMemo(() => {
        return items
            .filter(item => {
                const daysLeft = getDaysLeft(item.expiryDate);
                return daysLeft >= 0 && daysLeft <= 7;
            })
            .sort((a, b) => getDaysLeft(a.expiryDate) - getDaysLeft(b.expiryDate));
    }, [items]);

    // Active ingredient we are matching against
    const targetIngredient = useMemo(() => {
        if (selectedExpiringIngredient) return selectedExpiringIngredient;
        if (expiringItems.length > 0) return expiringItems[0].name;
        if (items.length > 0) return items[0].name;
        return 'chicken';
    }, [selectedExpiringIngredient, expiringItems, items]);

    // Fetch recipes for the targeted ingredient
    useEffect(() => {
        let isMounted = true;
        const fetchRecipes = async () => {
            setLoading(true);
            try {
                const allItemNames = items.map(i => i.name);
                const queryTerm = searchQuery.trim() || targetIngredient;

                const [mainResults, recResults] = await Promise.all([
                    findBestRecipes(queryTerm, allItemNames),
                    findBestRecipes('pasta', allItemNames)
                ]);

                if (isMounted) {
                    setExpiringRecipes(mainResults);
                    setRecommendedRecipes(recResults);
                }
            } catch (error) {
                console.error('Failed to fetch recipes:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchRecipes();
        return () => {
            isMounted = false;
        };
    }, [targetIngredient, searchQuery, items]);

    // Filter chips
    const filterChips = [
        { id: 'expiring' as FilterType, label: 'Uses Expiring Items', icon: <Package size={15} /> },
        { id: 'quick' as FilterType, label: 'Quick Meals (< 30m)', icon: <Clock size={15} /> },
        { id: 'vegetarian' as FilterType, label: 'Vegetarian', icon: <Leaf size={15} /> },
        { id: 'protein' as FilterType, label: 'High Protein', icon: <Dumbbell size={15} /> },
    ];

    // Apply filters to recipes
    const filteredRecipes = useMemo(() => {
        let recipes = [...expiringRecipes];

        switch (activeFilter) {
            case 'quick':
                recipes = recipes.filter(r => r.readyInMinutes && r.readyInMinutes <= 30);
                break;
            case 'vegetarian': {
                const meatWords = ['chicken', 'beef', 'pork', 'lamb', 'meat', 'fish', 'salmon', 'shrimp', 'bacon', 'ham', 'steak', 'turkey'];
                recipes = recipes.filter(r => {
                    const nameLower = r.name.toLowerCase();
                    return !meatWords.some(word => nameLower.includes(word));
                });
                break;
            }
            case 'protein': {
                const proteinWords = ['chicken', 'beef', 'pork', 'lamb', 'meat', 'fish', 'salmon', 'shrimp', 'egg', 'bean', 'lentil', 'tofu'];
                recipes = recipes.filter(r => {
                    const nameLower = r.name.toLowerCase();
                    return proteinWords.some(word => nameLower.includes(word));
                });
                break;
            }
            default:
                break;
        }

        return recipes;
    }, [expiringRecipes, activeFilter]);

    // Estimated money saved
    const estimatedSavings = (expiringItems.length * 4.5).toFixed(2);

    return (
        <div className="space-y-8 animate-slide-up">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl surface-card p-6 md:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
                            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Zero-Waste Recipe Engine</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Cook with what you have.
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-2 leading-relaxed">
                            Discover delicious chef-crafted meals that use your expiring ingredients first, cutting household food waste and saving your wallet.
                        </p>
                    </div>

                    {/* Impact Widget */}
                    {expiringItems.length > 0 && (
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 shadow-sm shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                                <Flame size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Potential Savings
                                </p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">
                                    ${estimatedSavings}
                                </p>
                                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                    {expiringItems.length} items to rescue this week
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Expiring Ingredients Quick Selector Ribbon */}
            {expiringItems.length > 0 && (
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                Match Expiring Items
                            </h2>
                        </div>
                        {selectedExpiringIngredient && (
                            <button
                                onClick={() => setSelectedExpiringIngredient(null)}
                                className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                            >
                                Reset selection
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {expiringItems.map(item => {
                            const daysLeft = getDaysLeft(item.expiryDate);
                            const isSelected = targetIngredient.toLowerCase() === item.name.toLowerCase();
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setSelectedExpiringIngredient(item.name);
                                        setSearchQuery('');
                                    }}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700'
                                    }`}
                                >
                                    <span>{getCategoryEmoji(item.category)}</span>
                                    <span>{item.name}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        isSelected
                                            ? 'bg-emerald-600 text-white'
                                            : daysLeft <= 1
                                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                    }`}>
                                        {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filter Bar & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search recipes or ingredient (currently '${targetIngredient}')...`}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {filterChips.map((chip) => {
                        const isActive = activeFilter === chip.id;
                        return (
                            <button
                                key={chip.id}
                                onClick={() => setActiveFilter(isActive ? null : chip.id)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                {chip.icon}
                                <span>{chip.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Layout: Main Grid & Pantry Sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Recipe Cards Grid */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ChefHat size={20} className="text-emerald-500" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Recommended Recipes
                            </h2>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {filteredRecipes.length} found
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="surface-card rounded-2xl p-4 animate-pulse space-y-3">
                                    <div className="h-44 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : filteredRecipes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredRecipes.map((recipe) => (
                                <div
                                    key={recipe.id}
                                    className="group surface-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col"
                                >
                                    {/* Image with overlay badge */}
                                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        {recipe.image ? (
                                            <img
                                                src={recipe.image}
                                                alt={recipe.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40">
                                                🥗
                                            </div>
                                        )}

                                        {/* Match Badge */}
                                        <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                                            <Sparkles size={13} className="text-emerald-500" />
                                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                                Uses {targetIngredient}
                                            </span>
                                        </div>

                                        {/* Prep Time Pill */}
                                        {recipe.readyInMinutes && (
                                            <div className="absolute top-3 right-3 bg-slate-900/80 text-white backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-semibold">
                                                <Clock size={12} />
                                                <span>{recipe.readyInMinutes}m</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                                            <span>{recipe.category || 'Main Dish'}</span>
                                            {recipe.area && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-slate-500 dark:text-slate-400">{recipe.area}</span>
                                                </>
                                            )}
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2">
                                            {recipe.name}
                                        </h3>

                                        {/* Pantry Match Indicator */}
                                        {recipe.matchedIngredients && recipe.matchedIngredients.length > 0 && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {recipe.matchedIngredients.length} ingredients
                                                </span>{' '}
                                                already in your pantry
                                            </p>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setActiveRecipeModal(recipe);
                                                    setCompletedSteps({});
                                                }}
                                                className="flex-1 btn-brand py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <BookOpen size={14} />
                                                <span>View Recipe</span>
                                            </button>

                                            {recipe.sourceUrl && (
                                                <a
                                                    href={recipe.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                                    title="Open original website"
                                                >
                                                    <ExternalLink size={15} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="surface-card rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                                <ChefHat size={32} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                                No recipes matching your filter
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                                Try searching for another ingredient, or reset the filter to explore all available meal ideas.
                            </p>
                            <button
                                onClick={() => {
                                    setActiveFilter(null);
                                    setSearchQuery('');
                                    setSelectedExpiringIngredient(null);
                                }}
                                className="btn-secondary py-2 px-4 text-xs font-semibold cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}

                    {/* Recommended Pantry Staples Section */}
                    {recommendedRecipes.length > 0 && (
                        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-amber-500" />
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Pantry Favorites & Ideas
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {recommendedRecipes.slice(0, 4).map((rec) => (
                                    <div
                                        key={rec.id}
                                        onClick={() => {
                                            setActiveRecipeModal(rec);
                                            setCompletedSteps({});
                                        }}
                                        className="surface-card rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 hover:shadow-md transition-all cursor-pointer group flex flex-col"
                                    >
                                        <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            {rec.image ? (
                                                <img
                                                    src={rec.image}
                                                    alt={rec.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                                    🍲
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                                {rec.name}
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                {rec.readyInMinutes || 25} mins
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Expiring Pantry */}
                <aside className="space-y-6">
                    <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-soft sticky top-24">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Clock size={15} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Expiring Pantry
                                </h3>
                            </div>
                            {onNavigateHome && (
                                <button
                                    onClick={onNavigateHome}
                                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Pantry</span>
                                    <ArrowRight size={12} />
                                </button>
                            )}
                        </div>

                        {expiringItems.length > 0 ? (
                            <div className="space-y-2.5">
                                {expiringItems.slice(0, 6).map((item) => {
                                    const daysLeft = getDaysLeft(item.expiryDate);
                                    const isTargeted = targetIngredient.toLowerCase() === item.name.toLowerCase();
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedExpiringIngredient(item.name);
                                                setSearchQuery('');
                                            }}
                                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                                isTargeted
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-400/40'
                                                    : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="text-lg shrink-0">
                                                    {getCategoryEmoji(item.category)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {item.name}
                                                    </p>
                                                    <p className={`text-[11px] font-semibold ${
                                                        daysLeft <= 1
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : daysLeft <= 3
                                                                ? 'text-amber-600 dark:text-amber-400'
                                                                : 'text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                        {daysLeft === 0 ? 'Expires today' : daysLeft === 1 ? 'Expires tomorrow' : `${daysLeft} days left`}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                {isTargeted ? 'Active' : 'Match →'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    No ingredients expiring soon. Great work!
                                </p>
                            </div>
                        )}

                        {/* Waste reduction tip */}
                        <div className="mt-5 p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 dark:border-emerald-800/30">
                            <div className="flex items-center gap-2 mb-1 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                                <Sparkles size={14} />
                                <span>Zero-Waste Tip</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Most produce can be chopped and stored in the freezer for up to 3 months before it spoils!
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            {/* In-App Recipe Cooking Modal */}
            {activeRecipeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setActiveRecipeModal(null)}
                    />

                    <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-10 animate-slide-up">
                        {/* Header Image */}
                        <div className="relative h-48 sm:h-64 w-full bg-slate-100 dark:bg-slate-800 shrink-0">
                            {activeRecipeModal.image ? (
                                <img
                                    src={activeRecipeModal.image}
                                    alt={activeRecipeModal.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl">
                                    🍲
                                </div>
                            )}

                            {/* Close button */}
                            <button
                                onClick={() => setActiveRecipeModal(null)}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 backdrop-blur-md transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            {/* Quick Badges */}
                            <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 flex flex-wrap gap-1.5 sm:gap-2">
                                <span className="px-2.5 sm:px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold">
                                    {activeRecipeModal.category || 'Main Dish'}
                                </span>
                                {activeRecipeModal.readyInMinutes && (
                                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1">
                                        <Clock size={12} />
                                        {activeRecipeModal.readyInMinutes} mins
                                    </span>
                                )}
                                {activeRecipeModal.servings && (
                                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1">
                                        <Utensils size={12} />
                                        {activeRecipeModal.servings} servings
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                                    {activeRecipeModal.name}
                                </h2>
                                {activeRecipeModal.area && (
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                        Cuisine: {activeRecipeModal.area}
                                    </p>
                                )}
                            </div>

                            {/* Ingredients Checklist */}
                            {activeRecipeModal.ingredients && activeRecipeModal.ingredients.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Leaf size={16} className="text-emerald-500" />
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                            Ingredients Checklist
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {activeRecipeModal.ingredients.map((ing, idx) => {
                                            const isMatched = activeRecipeModal.matchedIngredients?.some(
                                                m => ing.toLowerCase().includes(m.toLowerCase())
                                            );
                                            const isDone = !!completedSteps[idx];
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                                        isDone
                                                            ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 line-through'
                                                            : isMatched
                                                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white'
                                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                                                    }`}
                                                >
                                                    <CheckCircle2
                                                        size={16}
                                                        className={isDone ? 'text-slate-400' : isMatched ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}
                                                    />
                                                    <span className="text-xs font-medium truncate flex-1">
                                                        {ing}
                                                    </span>
                                                    {isMatched && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 shrink-0">
                                                            In Pantry
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            {activeRecipeModal.instructions && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ChefHat size={16} className="text-emerald-500" />
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                            Cooking Instructions
                                        </h3>
                                    </div>
                                    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                                        {activeRecipeModal.instructions}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                            <button
                                onClick={() => setActiveRecipeModal(null)}
                                className="btn-secondary py-2.5 px-4 text-xs font-semibold cursor-pointer"
                            >
                                Close
                            </button>

                            {activeRecipeModal.sourceUrl && (
                                <a
                                    href={activeRecipeModal.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-brand py-2.5 px-5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>Original Recipe Page</span>
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
