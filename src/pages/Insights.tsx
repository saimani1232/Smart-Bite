import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Trophy, TrendingUp, Sparkles, AlertTriangle, CheckCircle2, DollarSign, ChefHat, ArrowRight } from 'lucide-react';

export const Insights: React.FC<{ onNavigateToRecipes: () => void; onNavigateToPantry: () => void }> = ({
    onNavigateToRecipes,
    onNavigateToPantry,
}) => {
    const { items } = useInventory();

    const getDaysLeft = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    let expired = 0;
    let nearExpiry = 0;
    let fresh = 0;

    const categoryCounts: Record<string, number> = {
        Dairy: 0,
        Grain: 0,
        Vegetable: 0,
        Meat: 0,
        Snacks: 0,
        Other: 0,
    };

    items.forEach((item) => {
        const days = getDaysLeft(item.expiryDate);
        if (days < 0) expired++;
        else if (days <= 7) nearExpiry++;
        else fresh++;

        if (categoryCounts[item.category] !== undefined) {
            categoryCounts[item.category]++;
        } else {
            categoryCounts.Other++;
        }
    });

    const total = items.length;
    const wasteScore = total > 0
        ? Math.max(0, Math.round(100 - (expired * 20) - (nearExpiry * 5)))
        : 100;

    const estimatedSavings = (fresh * 3.8 + nearExpiry * 4.2).toFixed(2);

    const getScoreTier = (score: number) => {
        if (score >= 90) return { label: 'Pantry Champion 🌟', color: 'text-emerald-500', desc: 'Outstanding job preventing food waste!' };
        if (score >= 75) return { label: 'Freshness Guardian 🌿', color: 'text-teal-500', desc: 'Good pantry management with minimal waste.' };
        if (score >= 50) return { label: 'Smart Cook 🍳', color: 'text-amber-500', desc: 'A few ingredients need attention soon.' };
        return { label: 'Action Needed ⚠️', color: 'text-rose-500', desc: 'Several expired or expiring items require review.' };
    };

    const tier = getScoreTier(wasteScore);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Pantry Insights & Sustainability
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Real-time metrics on food freshness, waste reduction, and estimated grocery savings.
                </p>
            </div>

            {/* Hero Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Waste Score Card */}
                <div className="surface-card p-6 md:col-span-2 relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-950/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mb-2">
                                <Trophy size={14} />
                                Zero-Waste Score
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {wasteScore}
                                </span>
                                <span className="text-lg font-bold text-slate-400">/ 100</span>
                            </div>
                            <h3 className={`text-base font-bold mt-2 ${tier.color}`}>{tier.label}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                                {tier.desc}
                            </p>
                        </div>

                        {/* Visual Circular Representation */}
                        <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-100 dark:text-slate-700"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-emerald-500 transition-all duration-1000 ease-out"
                                    strokeDasharray={`${wasteScore}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Sparkles size={20} className="text-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Callout Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                            Tracking <strong>{total}</strong> active ingredients in your household
                        </span>
                        <button
                            onClick={onNavigateToPantry}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                            Manage Pantry <ArrowRight size={13} />
                        </button>
                    </div>
                </div>

                {/* Estimated Value & Savings Card */}
                <div className="surface-card p-6 flex flex-col justify-between bg-gradient-to-br from-white to-teal-50/30 dark:from-slate-800 dark:to-teal-950/20">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 mb-3">
                            <DollarSign size={14} />
                            Estimated Savings
                        </span>
                        <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                            ${estimatedSavings}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Approximate value preserved by tracking freshness before expiration.
                        </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                        <button
                            onClick={onNavigateToRecipes}
                            className="w-full btn-brand py-2.5 text-xs font-bold"
                        >
                            <ChefHat size={15} />
                            Cook With Near-Expiry Items
                        </button>
                    </div>
                </div>
            </div>

            {/* Breakdown Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Freshness Health Breakdown */}
                <div className="surface-card p-6">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <TrendingUp size={18} className="text-emerald-500" />
                        Freshness Distribution
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 size={13} /> Fresh & Good
                                </span>
                                <span>{fresh} items ({total > 0 ? Math.round((fresh / total) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${total > 0 ? (fresh / total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <Sparkles size={13} /> Expiring Within 7 Days
                                </span>
                                <span>{nearExpiry} items ({total > 0 ? Math.round((nearExpiry / total) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${total > 0 ? (nearExpiry / total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                    <AlertTriangle size={13} /> Expired Items
                                </span>
                                <span>{expired} items ({total > 0 ? Math.round((expired / total) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${total > 0 ? (expired / total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="surface-card p-6">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                        Pantry Categories
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(categoryCounts).map(([cat, count]) => {
                            const iconMap: Record<string, string> = {
                                Dairy: '🥛',
                                Grain: '🌾',
                                Vegetable: '🥬',
                                Meat: '🥩',
                                Snacks: '🍿',
                                Other: '🥫',
                            };
                            return (
                                <div
                                    key={cat}
                                    className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center gap-3"
                                >
                                    <span className="text-2xl">{iconMap[cat] || '📦'}</span>
                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{cat}</div>
                                        <div className="text-base font-black text-slate-900 dark:text-white">{count} items</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
