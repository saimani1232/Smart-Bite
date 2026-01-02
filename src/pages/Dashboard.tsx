import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { InventoryCard } from '../components/InventoryCard';
import { AddItemForm } from '../components/AddItemForm';
import { ActionModal } from '../components/ActionModal';
import { Plus, Search, AlertTriangle, CheckCircle, Sparkles, TrendingUp, X, Filter, ChevronDown, Trophy, QrCode } from 'lucide-react';
import type { InventoryItem } from '../types';

type StatusFilter = 'all' | 'expired' | 'expiring' | 'fresh';
type CategoryFilter = 'all' | 'Dairy' | 'Grain' | 'Vegetable' | 'Meat' | 'Other';
type SortOption = 'expiry' | 'name' | 'added';

// Get greeting based on time of day
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};

export const Dashboard: React.FC = () => {
    const { items } = useInventory();
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
        // Calculate waste score (higher is better - penalize expired items)
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
            return 0; // 'added' - keep original order
        });

        return result;
    }, [items, searchQuery, statusFilter, categoryFilter, sortBy]);

    const activeFiltersCount = [statusFilter !== 'all', categoryFilter !== 'all'].filter(Boolean).length;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24">
            {/* Greeting Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                        {getGreeting()}! 👋
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {stats.total > 0
                            ? `You're tracking ${stats.total} item${stats.total !== 1 ? 's' : ''} in your inventory.`
                            : 'Start by adding items to your inventory.'
                        }
                    </p>
                </div>
                {stats.total > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <Trophy size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                            Waste Score: {stats.wasteScore}/100
                        </span>
                    </div>
                )}
            </header>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <button
                    onClick={() => { setStatusFilter('expired'); setShowFilters(true); }}
                    className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group
                        bg-red-50 dark:bg-red-900/10 
                        ${statusFilter === 'expired' ? 'border-red-400 ring-2 ring-red-200 dark:ring-red-800' : 'border-red-100 dark:border-red-800/30'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{stats.expired}</h3>
                            <p className="text-sm text-red-400 dark:text-red-300 font-medium">Expired</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => { setStatusFilter('expiring'); setShowFilters(true); }}
                    className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group
                        bg-amber-50 dark:bg-amber-900/10 
                        ${statusFilter === 'expiring' ? 'border-amber-400 ring-2 ring-amber-200 dark:ring-amber-800' : 'border-amber-100 dark:border-amber-800/30'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Sparkles size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.nearExpiry}</h3>
                            <p className="text-sm text-amber-500 dark:text-amber-300 font-medium">Expiring Soon</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => { setStatusFilter('fresh'); setShowFilters(true); }}
                    className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group
                        bg-emerald-50 dark:bg-emerald-900/10 
                        ${statusFilter === 'fresh' ? 'border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-800' : 'border-emerald-100 dark:border-emerald-800/30'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.fresh}</h3>
                            <p className="text-sm text-emerald-500 dark:text-emerald-300 font-medium">Fresh Items</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}
                    className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group
                        bg-violet-50 dark:bg-violet-900/10 
                        ${statusFilter === 'all' && categoryFilter === 'all' ? 'border-violet-400 ring-2 ring-violet-200 dark:ring-violet-800' : 'border-violet-100 dark:border-violet-800/30'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl md:text-3xl font-bold text-violet-600 dark:text-violet-400">{stats.total}</h3>
                            <p className="text-sm text-violet-500 dark:text-violet-300 font-medium">Total Items</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-sm transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${showFilters || activeFiltersCount > 0
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-600'
                            }`}
                    >
                        <Filter size={18} />
                        <span className="hidden sm:inline">Filters</span>
                        {activeFiltersCount > 0 && (
                            <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                        <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/30 font-semibold items-center gap-2 transition-all active:scale-95"
                        >
                            <Plus size={20} />
                            Add Item
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            aria-label="Scan Barcode"
                            className="hidden md:flex bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all items-center justify-center"
                        >
                            <QrCode size={20} />
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm animate-fade-in">
                        <div className="flex flex-wrap gap-4">
                            {/* Status Filter */}
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['all', 'expired', 'expiring', 'fresh'] as StatusFilter[]).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${statusFilter === status
                                                ? status === 'expired' ? 'bg-rose-500 text-white'
                                                    : status === 'expiring' ? 'bg-amber-500 text-white'
                                                        : status === 'fresh' ? 'bg-emerald-500 text-white'
                                                            : 'bg-gray-800 dark:bg-white text-white dark:text-gray-800'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {status === 'all' ? 'All' : status === 'expiring' ? 'Expiring Soon' : status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['all', 'Dairy', 'Grain', 'Vegetable', 'Meat', 'Other'] as CategoryFilter[]).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${categoryFilter === cat
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {cat === 'all' ? 'All' : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div className="min-w-[120px]">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Sort by</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    <option value="expiry">Expiry Date</option>
                                    <option value="name">Name</option>
                                    <option value="added">Recently Added</option>
                                </select>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}
                                className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                            >
                                ✕ Clear all filters
                            </button>
                        )}
                    </div>
                )}

                {/* Active Filters Summary */}
                {!showFilters && activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
                        {statusFilter !== 'all' && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusFilter === 'expired' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                                : statusFilter === 'expiring' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                }`}>
                                {statusFilter === 'expiring' ? 'Expiring Soon' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                <button onClick={() => setStatusFilter('all')} className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {categoryFilter !== 'all' && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium flex items-center gap-1">
                                {categoryFilter}
                                <button onClick={() => setCategoryFilter('all')} className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Results Count */}
            {(searchQuery || activeFiltersCount > 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Showing {filteredItems.length} of {items.length} items
                </p>
            )}

            {/* Inventory Grid */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="text-6xl mb-4">{activeFiltersCount > 0 ? '🔍' : '🥗'}</div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {activeFiltersCount > 0 ? 'No matching items' : 'No items yet!'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {activeFiltersCount > 0
                            ? 'Try adjusting your filters'
                            : 'Add your first item to start tracking'
                        }
                    </p>
                    {activeFiltersCount > 0 ? (
                        <button
                            onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setSearchQuery(''); }}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                        >
                            Clear Filters
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
                        >
                            <Plus size={18} className="inline mr-2" />
                            Add Your First Item
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <InventoryCard
                            key={item.id}
                            item={item}
                            onPreserve={() => setSelectedItem(item)}
                        />
                    ))}

                    {/* Scan New Item Card */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 group transition-all min-h-[200px]"
                    >
                        <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors">
                            <Plus size={24} className="text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Scan New Item</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[150px]">Add more groceries to track their freshness.</p>
                    </button>
                </div>
            )}

            {/* Floating Action Button (Mobile) */}
            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-24 right-6 md:hidden w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center active:scale-95 transition-transform z-50"
            >
                <Plus size={28} />
            </button>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                                Add New Item
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <AddItemForm onClose={() => setShowAddModal(false)} />
                    </div>
                </div>
            )}

            {/* Action Modal */}
            {selectedItem && (
                <ActionModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}

            {/* Animation Style */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};
