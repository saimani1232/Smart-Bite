import React, { useEffect, useState } from 'react';
import type { InventoryItem } from '../types';
import {
    X,
    Snowflake,
    Heart,
    ExternalLink,
    Clock,
    ChefHat,
    RefreshCw,
    Sparkles,
    Package,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import { findBestRecipes, type Recipe } from '../services/recipeService';
import { useInventory } from '../context/InventoryContext';

interface ActionModalProps {
    item: InventoryItem;
    onClose: () => void;
    onExploreAllRecipes?: (itemName: string) => void;
}

const getCategoryEmoji = (category: string) => {
    switch (category) {
        case 'Dairy': return '🥛';
        case 'Grain': return '🌾';
        case 'Vegetable': return '🥬';
        case 'Meat': return '🥩';
        case 'Snacks': return '🍿';
        default: return '🥫';
    }
};

export const ActionModal: React.FC<ActionModalProps> = ({ item, onClose, onExploreAllRecipes }) => {
    const { items, removeItem, toggleOpened } = useInventory();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOpened, setIsOpened] = useState(item.isOpened || false);
    const [activeTab, setActiveTab] = useState<'recipes' | 'tips'>('recipes');

    // Calculate days left
    const getDaysLeft = () => {
        const expiry = new Date(item.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const daysLeft = getDaysLeft();

    const getStatusTheme = () => {
        if (daysLeft < 0) return { label: 'Expired', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300', icon: <AlertTriangle size={13} /> };
        if (daysLeft <= 3) return { label: 'Expiring Soon', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', icon: <Clock size={13} /> };
        if (daysLeft <= 7) return { label: 'Use Soon', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', icon: <Clock size={13} /> };
        return { label: 'Fresh', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', icon: <CheckCircle2 size={13} /> };
    };

    const statusTheme = getStatusTheme();

    // Fetch recipes for this ingredient
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            setError(null);

            try {
                const allItemNames = items.map(i => i.name);
                const fetched = await findBestRecipes(item.name, allItemNames);

                if (fetched.length === 0) {
                    setError('No specific recipes found for this ingredient. Check preservation tips!');
                } else {
                    setRecipes(fetched);
                }
            } catch (err) {
                console.error('Recipe fetch error:', err);
                setError('Failed to fetch recipes. Please check your internet connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, [item.name, items]);

    const handleRefresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const allItemNames = items.map(i => i.name);
            const fetched = await findBestRecipes(item.name, allItemNames);
            if (fetched.length === 0) {
                setError('No recipes found for this ingredient.');
            } else {
                setRecipes(fetched);
            }
        } catch {
            setError('Failed to refresh recipes.');
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

    // Category preservation tips
    const getPreservationTips = () => {
        const tips: { title: string; desc: string; icon: React.ReactNode }[] = [];
        const itemLower = item.name.toLowerCase();

        switch (item.category) {
            case 'Dairy':
                if (itemLower.includes('milk')) {
                    tips.push({ title: 'Freeze in Ice Trays', desc: 'Pre-portion into cubes for smoothies and baking.', icon: <Snowflake size={16} /> });
                    tips.push({ title: 'Simmer into Homemade Ricotta', desc: 'Curdle with lemon juice or vinegar for fresh cheese.', icon: <ChefHat size={16} /> });
                } else if (itemLower.includes('cheese')) {
                    tips.push({ title: 'Grate & Freeze in Bags', desc: 'Sprinkle directly onto warm pasta, pizza, or casseroles.', icon: <Snowflake size={16} /> });
                    tips.push({ title: 'Melt into Rich Cheese Dip', desc: 'Whisk with a bit of milk or cream for nachos and veggies.', icon: <ChefHat size={16} /> });
                } else {
                    tips.push({ title: 'Freeze Before Expiry Date', desc: 'Dairy maintains culinary quality for 2-3 months when frozen.', icon: <Snowflake size={16} /> });
                }
                break;
            case 'Meat':
                tips.push({ title: 'Portion & Freeze in Foil/Bags', desc: `Divide your ${item.quantity} ${item.unit} into individual meal portions.`, icon: <Snowflake size={16} /> });
                tips.push({ title: 'Pre-Marinate and Chill', desc: 'Acidic marinades (yogurt, citrus, vinegar) extend tenderness.', icon: <ChefHat size={16} /> });
                break;
            case 'Vegetable':
                tips.push({ title: 'Blanch & Freeze', desc: 'Boil for 2 minutes, shock in ice water, dry thoroughly, and freeze.', icon: <Snowflake size={16} /> });
                if (itemLower.includes('tomato')) {
                    tips.push({ title: 'Cook Down into Pasta Sauce', desc: 'Roast with olive oil and garlic; freezes for up to 6 months.', icon: <ChefHat size={16} /> });
                } else if (itemLower.includes('spinach') || itemLower.includes('kale')) {
                    tips.push({ title: 'Blend into Green Cubes', desc: 'Puree with water and freeze for morning smoothies.', icon: <ChefHat size={16} /> });
                } else {
                    tips.push({ title: 'Quick Pickle with Vinegar & Herbs', desc: 'Submerge sliced vegetables in salted brine for crunchy snacks.', icon: <ChefHat size={16} /> });
                }
                break;
            case 'Grain':
                if (itemLower.includes('bread')) {
                    tips.push({ title: 'Slice & Freeze', desc: 'Pop frozen slices directly into the toaster.', icon: <Snowflake size={16} /> });
                    tips.push({ title: 'Toast into Golden Croutons', desc: 'Toss with olive oil and herbs, bake at 375°F until crisp.', icon: <ChefHat size={16} /> });
                } else {
                    tips.push({ title: 'Store in Airtight Glass Jars', desc: 'Shields grains from moisture and maintains pantry freshness.', icon: <Package size={16} /> });
                }
                break;
            default:
                tips.push({ title: 'Inspect & Freeze if Suitable', desc: 'Most pantry ingredients preserve flavor well in the freezer.', icon: <Snowflake size={16} /> });
                tips.push({ title: 'Share with Friends or Neighbors', desc: 'Give surplus food to friends before it expires.', icon: <Heart size={16} /> });
        }
        return tips;
    };

    const preservationTips = getPreservationTips();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="surface-card relative w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/70 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                            {getCategoryEmoji(item.category)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${statusTheme.badge}`}>
                                    {statusTheme.icon}
                                    {statusTheme.label}
                                </span>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                                </span>
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                                {item.name}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {item.quantity} {item.unit} • {item.category}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-100 dark:border-slate-700/70 bg-slate-50 dark:bg-slate-900/40 p-1">
                    <button
                        onClick={() => setActiveTab('recipes')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'recipes'
                                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <ChefHat size={14} />
                        <span>Recipes ({recipes.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('tips')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'tips'
                                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Snowflake size={14} />
                        <span>Preservation Tips ({preservationTips.length})</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                    {activeTab === 'recipes' ? (
                        <>
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span>Curated recipes using <strong>{item.name}</strong></span>
                                <button
                                    onClick={handleRefresh}
                                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                                >
                                    <RefreshCw size={12} /> Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-10">
                                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Discovering recipes...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <ChefHat size={32} className="mx-auto text-slate-400 mb-2" />
                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{error}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recipes.map((r) => (
                                        <div
                                            key={r.id}
                                            className="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3 hover:border-emerald-500/60 transition-colors"
                                        >
                                            {r.image ? (
                                                <img
                                                    src={r.image}
                                                    alt={r.name}
                                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-xl flex-shrink-0">
                                                    🍲
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                    {r.name}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {r.category} • {r.area}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock size={10} /> 30 min
                                                    </span>
                                                    <span>•</span>
                                                    <span>Uses {item.name}</span>
                                                </div>
                                            </div>

                                            <a
                                                href={r.sourceUrl || `https://www.themealdb.com/meal/${r.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-ghost p-2 text-emerald-600 dark:text-emerald-400"
                                                title="View recipe on TheMealDB"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {onExploreAllRecipes && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onExploreAllRecipes(item.name);
                                    }}
                                    className="w-full btn-brand py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer mt-3"
                                >
                                    <ChefHat size={14} />
                                    <span>Explore More in Zero-Waste Kitchen →</span>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Reduce food waste with these culinary preservation techniques:
                            </p>
                            {preservationTips.map((tip, i) => (
                                <div
                                    key={i}
                                    className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3"
                                >
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                        {tip.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                            {tip.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                            {tip.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-3">
                    <button
                        onClick={handleToggleOpened}
                        className="btn-secondary py-2 px-3 text-xs font-bold"
                    >
                        <Package size={14} />
                        <span>{isOpened ? 'Opened ✓' : 'Mark as Opened'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleMarkConsumed}
                            className="btn-brand py-2 px-4 text-xs font-bold"
                        >
                            <Sparkles size={14} />
                            <span>Mark Consumed</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
