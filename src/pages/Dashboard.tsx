import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { InventoryCard } from '../components/InventoryCard';
import { AddItemForm } from '../components/AddItemForm';
import { ActionModal } from '../components/ActionModal';
import {
    Plus,
    Search,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    Package,
    X,
    Filter,
    ArrowUpDown,
    Trophy,
    QrCode,
    Clock
} from 'lucide-react';
import type { InventoryItem } from '../types';

type StatusFilter = 'all' | 'expired' | 'expiring' | 'fresh';
type CategoryFilter = 'all' | 'Dairy' | 'Grain' | 'Vegetable' | 'Meat' | 'Snacks' | 'Other';
type SortOption = 'expiry' | 'name' | 'quantity' | 'added';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'All Pantry', icon: '🥗' },
    { id: 'Dairy', label: 'Dairy', icon: '🥛' },
    { id: 'Vegetable', label: 'Produce', icon: '🥬' },
    { id: 'Meat', label: 'Meat & Protein', icon: '🥩' },
    { id: 'Grain', label: 'Grains & Bread', icon: '🌾' },
    { id: 'Snacks', label: 'Snacks', icon: '🍿' },
    { id: 'Other', label: 'Pantry & Other', icon: '🥫' },
];

interface DashboardProps {
    onOpenRecipes?: (itemOrName: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenRecipes }) => {
    const { items, isLoading } = useInventory();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('expiry');

    // Helper to calculate days left
    const getDaysLeft = (expiryDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Calculate stats
    const stats = useMemo(() => {
        let expired = 0, nearExpiry = 0, fresh = 0;
        items.forEach(item => {
            const daysLeft = getDaysLeft(item.expiryDate);
            if (daysLeft < 0) expired++;
            else if (daysLeft <= 7) nearExpiry++;
            else fresh++;
        });
        const wasteScore = items.length > 0
            ? Math.max(0, Math.round(100 - (expired * 20) - (nearExpiry * 5)))
            : 100;
        return { expired, nearExpiry, fresh, total: items.length, wasteScore };
    }, [items]);

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let result = items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(item => {
                const daysLeft = getDaysLeft(item.expiryDate);
                if (statusFilter === 'expired') return daysLeft < 0;
                if (statusFilter === 'expiring') return daysLeft >= 0 && daysLeft <= 7;
                if (statusFilter === 'fresh') return daysLeft > 7;
                return true;
            });
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(item => item.category === categoryFilter);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'expiry') {
                return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
            }
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            if (sortBy === 'quantity') {
                return b.quantity - a.quantity;
            }
            return 0; // 'added'
        });

        return result;
    }, [items, searchQuery, statusFilter, categoryFilter, sortBy]);

    const activeFiltersCount = [statusFilter !== 'all', categoryFilter !== 'all'].filter(Boolean).length;

    const clearAllFilters = () => {
        setStatusFilter('all');
        setCategoryFilter('all');
        setSearchQuery('');
    };

    return (
        <div className="space-y-6">
            {/* Hero Welcome Banner */}
            <div className="surface-card p-6 sm:p-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white relative overflow-hidden shadow-elevated">
                {/* Subtle culinary graphic circles in background */}
                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold tracking-wide uppercase mb-3">
                            <Sparkles size={13} className="text-amber-300" />
                            <span>Zero-Waste Kitchen Intelligence</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            {getGreeting()}! 🌱
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-emerald-50/90 leading-relaxed">
                            {stats.total > 0 ? (
                                <>
                                    You have <strong>{stats.total} ingredients</strong> tracked.
                                    {stats.nearExpiry > 0 && (
                                        <span className="text-amber-200 font-semibold ml-1">
                                            {stats.nearExpiry} ingredient{stats.nearExpiry > 1 ? 's need' : ' needs'} cooking soon!
                                        </span>
                                    )}
                                </>
                            ) : (
                                'Your pantry is currently empty. Add your first grocery items to begin tracking freshness.'
                            )}
                        </p>
                    </div>

                    {/* Waste Score & Fast Add CTA */}
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto justify-between md:justify-start">
                        {stats.total > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                                <Trophy size={18} className="text-amber-300" />
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-bold text-white/75">Pantry Health</div>
                                    <div className="text-sm font-black text-white">{stats.wasteScore} / 100</div>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 active:scale-95 shadow-lg shadow-black/10 transition-all cursor-pointer"
                        >
                            <Plus size={18} />
                            <span>Add Food Item</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Metrics Bar (Click to Filter) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Expired Metric */}
                <button
                    onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
                    className={`stat-card text-left cursor-pointer relative overflow-hidden transition-all duration-200 ${
                        statusFilter === 'expired'
                            ? 'ring-2 ring-rose-500 bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                            : 'hover:border-rose-300 dark:hover:border-rose-900/60'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Expired
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertTriangle size={17} />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
                        {stats.expired}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {stats.expired > 0 ? 'Needs immediate attention' : 'Zero expired items 🎉'}
                    </p>
                </button>

                {/* Expiring Soon Metric */}
                <button
                    onClick={() => setStatusFilter(statusFilter === 'expiring' ? 'all' : 'expiring')}
                    className={`stat-card text-left cursor-pointer relative overflow-hidden transition-all duration-200 ${
                        statusFilter === 'expiring'
                            ? 'ring-2 ring-amber-500 bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                            : 'hover:border-amber-300 dark:hover:border-amber-900/60'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Expiring Soon
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock size={17} />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
                        {stats.nearExpiry}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Cook within 7 days
                    </p>
                </button>

                {/* Fresh & Good Metric */}
                <button
                    onClick={() => setStatusFilter(statusFilter === 'fresh' ? 'all' : 'fresh')}
                    className={`stat-card text-left cursor-pointer relative overflow-hidden transition-all duration-200 ${
                        statusFilter === 'fresh'
                            ? 'ring-2 ring-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                            : 'hover:border-emerald-300 dark:hover:border-emerald-900/60'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Fresh
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={17} />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                        {stats.fresh}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Peak freshness
                    </p>
                </button>

                {/* Total Inventory Metric */}
                <button
                    onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}
                    className={`stat-card text-left cursor-pointer relative overflow-hidden transition-all duration-200 ${
                        statusFilter === 'all' && categoryFilter === 'all'
                            ? 'ring-2 ring-slate-800 dark:ring-slate-400 border-slate-300 dark:border-slate-600'
                            : 'hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Total Items
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                            <Package size={17} />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                        {stats.total}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Across {Object.keys(CATEGORIES).length - 1} categories
                    </p>
                </button>
            </div>

            {/* Search, Filter Bar & Category Chips */}
            <div className="space-y-3">
                {/* Search & Action Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        />
                        <input
                            type="text"
                            placeholder="Search food by name (e.g. Milk, Apples, Bread)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-10 pr-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-secondary ${showFilters || activeFiltersCount > 0 ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}`}
                    >
                        <Filter size={16} />
                        <span>Filter & Sort</span>
                        {activeFiltersCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Scan Action */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-secondary hidden sm:inline-flex"
                        title="Scan product barcode or capture expiry"
                    >
                        <QrCode size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Scan</span>
                    </button>
                </div>

                {/* Category Horizontal Scroll Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1">
                    {CATEGORIES.map((cat) => {
                        const isSelected = categoryFilter === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setCategoryFilter(cat.id)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                    isSelected
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Collapsible Filter & Sort Drawer */}
                {showFilters && (
                    <div className="surface-card p-4 sm:p-5 animate-scale-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Freshness Status Filter */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                                    Freshness Status
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {(['all', 'expired', 'expiring', 'fresh'] as StatusFilter[]).map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                statusFilter === status
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {status === 'all'
                                                ? 'All Statuses'
                                                : status === 'expiring'
                                                ? 'Expiring (<7d)'
                                                : status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort Ordering */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                                    <ArrowUpDown size={12} /> Sort Inventory
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="input-field text-xs font-semibold py-2"
                                >
                                    <option value="expiry">Expiry Date (Urgent First)</option>
                                    <option value="name">Name (A-Z)</option>
                                    <option value="quantity">Highest Quantity</option>
                                    <option value="added">Recently Added</option>
                                </select>
                            </div>

                            {/* Clear All Action */}
                            <div className="flex items-end">
                                <button
                                    onClick={clearAllFilters}
                                    className="w-full py-2 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-colors cursor-pointer"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Filter Indicators */}
                {activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                        <span className="text-slate-400 font-medium">Filtering by:</span>
                        {statusFilter !== 'all' && (
                            <span className="badge badge-warning">
                                {statusFilter.toUpperCase()}
                                <button onClick={() => setStatusFilter('all')} className="hover:opacity-75">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {categoryFilter !== 'all' && (
                            <span className="badge badge-neutral">
                                {categoryFilter}
                                <button onClick={() => setCategoryFilter('all')} className="hover:opacity-75">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={clearAllFilters}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-1"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Inventory Results Header */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                <span>
                    Showing {filteredItems.length} of {items.length} pantry items
                </span>
                {sortBy === 'expiry' && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Sorted by Expiry
                    </span>
                )}
            </div>

            {/* Inventory Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <div key={idx} className="surface-card p-5 animate-pulse space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                                </div>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="surface-card p-12 text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-4">
                        {activeFiltersCount > 0 ? '🔍' : '🌱'}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {activeFiltersCount > 0 ? 'No matching items' : 'Your pantry is looking clean!'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        {activeFiltersCount > 0
                            ? 'No ingredients match your current filters. Try changing search terms or resetting filters.'
                            : 'Start tracking your groceries to reduce food waste and receive smart recipe ideas.'}
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {activeFiltersCount > 0 ? (
                            <button
                                onClick={clearAllFilters}
                                className="btn-secondary text-xs font-bold"
                            >
                                Clear All Filters
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-brand text-xs font-bold"
                            >
                                <Plus size={16} />
                                Add Your First Ingredient
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredItems.map((item) => (
                        <InventoryCard
                            key={item.id}
                            item={item}
                            onPreserve={() => setSelectedItem(item)}
                        />
                    ))}

                    {/* Quick Add Card Slot */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="surface-card border-2 border-dashed border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500/80 p-6 flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-200 min-h-[190px]"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/60 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center mb-3 transition-colors">
                            <Plus size={24} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            Add Another Item
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[180px]">
                            Scan or type to keep freshness up to date.
                        </p>
                    </button>
                </div>
            )}

            {/* Mobile Floating Action Button (FAB) */}
            <button
                onClick={() => setShowAddModal(true)}
                aria-label="Add new item"
                className="fab"
            >
                <Plus size={26} />
            </button>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-scale-in">
                    <div className="surface-card p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Plus size={18} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Add New Food Item
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <AddItemForm onClose={() => setShowAddModal(false)} />
                    </div>
                </div>
            )}

            {/* Action / Preservation Recipes Modal */}
            {selectedItem && (
                <ActionModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onExploreAllRecipes={onOpenRecipes}
                />
            )}
        </div>
    );
};
