import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { InventoryCard } from '../components/InventoryCard';
import { AddItemForm } from '../components/AddItemForm';
import { ActionModal } from '../components/ActionModal';
import { Plus, Search, AlertTriangle, CheckCircle, Sparkles, TrendingUp, X, Filter, ChevronDown } from 'lucide-react';
import type { InventoryItem } from '../types';

type StatusFilter = 'all' | 'expired' | 'expiring' | 'fresh';
type CategoryFilter = 'all' | 'Dairy' | 'Grain' | 'Vegetable' | 'Meat' | 'Other';
type SortOption = 'expiry' | 'name' | 'added';

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
        return { expired, nearExpiry, fresh, total: items.length };
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
        <div className="p-4 md:p-6 max-w-6xl mx-auto pb-24">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <button
                    onClick={() => { setStatusFilter('expired'); setShowFilters(true); }}
                    className={`stat-card bg-gradient-to-br from-rose-500/10 to-rose-600/5 border transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'expired' ? 'border-rose-400 ring-2 ring-rose-200' : 'border-rose-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/20 rounded-xl">
                            <AlertTriangle size={20} className="text-rose-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-rose-600">{stats.expired}</p>
                            <p className="text-xs text-rose-500/80 font-medium">Expired</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => { setStatusFilter('expiring'); setShowFilters(true); }}
                    className={`stat-card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'expiring' ? 'border-amber-400 ring-2 ring-amber-200' : 'border-amber-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-xl">
                            <Sparkles size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{stats.nearExpiry}</p>
                            <p className="text-xs text-amber-500/80 font-medium">Expiring Soon</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => { setStatusFilter('fresh'); setShowFilters(true); }}
                    className={`stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'fresh' ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-emerald-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{stats.fresh}</p>
                            <p className="text-xs text-emerald-500/80 font-medium">Fresh Items</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}
                    className={`stat-card bg-gradient-to-br from-violet-500/10 to-violet-600/5 border transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'all' && categoryFilter === 'all' ? 'border-violet-400 ring-2 ring-violet-200' : 'border-violet-200'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-xl">
                            <TrendingUp size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-violet-600">{stats.total}</p>
                            <p className="text-xs text-violet-500/80 font-medium">Total Items</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all ${showFilters || activeFiltersCount > 0
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
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
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Add Item
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm animate-fade-in">
                        <div className="flex flex-wrap gap-4">
                            {/* Status Filter */}
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-xs font-medium text-gray-500 mb-2 block">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['all', 'expired', 'expiring', 'fresh'] as StatusFilter[]).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${statusFilter === status
                                                    ? status === 'expired' ? 'bg-rose-500 text-white'
                                                        : status === 'expiring' ? 'bg-amber-500 text-white'
                                                            : status === 'fresh' ? 'bg-emerald-500 text-white'
                                                                : 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {status === 'all' ? 'All' : status === 'expiring' ? 'Expiring Soon' : status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-xs font-medium text-gray-500 mb-2 block">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['all', 'Dairy', 'Grain', 'Vegetable', 'Meat', 'Other'] as CategoryFilter[]).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${categoryFilter === cat
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {cat === 'all' ? 'All' : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div className="min-w-[120px]">
                                <label className="text-xs font-medium text-gray-500 mb-2 block">Sort by</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                                className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                ✕ Clear all filters
                            </button>
                        )}
                    </div>
                )}

                {/* Active Filters Summary */}
                {!showFilters && activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">Active filters:</span>
                        {statusFilter !== 'all' && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusFilter === 'expired' ? 'bg-rose-100 text-rose-700'
                                    : statusFilter === 'expiring' ? 'bg-amber-100 text-amber-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                {statusFilter === 'expiring' ? 'Expiring Soon' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                <button onClick={() => setStatusFilter('all')} className="hover:bg-black/10 rounded-full p-0.5">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {categoryFilter !== 'all' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                                {categoryFilter}
                                <button onClick={() => setCategoryFilter('all')} className="hover:bg-black/10 rounded-full p-0.5">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Results Count */}
            {(searchQuery || activeFiltersCount > 0) && (
                <p className="text-sm text-gray-500 mb-4">
                    Showing {filteredItems.length} of {items.length} items
                </p>
            )}

            {/* Inventory Grid */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="text-6xl mb-4">{activeFiltersCount > 0 ? '🔍' : '🥗'}</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {activeFiltersCount > 0 ? 'No matching items' : 'No items yet!'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {activeFiltersCount > 0
                            ? 'Try adjusting your filters'
                            : 'Add your first item to start tracking'
                        }
                    </p>
                    {activeFiltersCount > 0 ? (
                        <button
                            onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setSearchQuery(''); }}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition-all"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map(item => (
                        <InventoryCard
                            key={item.id}
                            item={item}
                            onPreserve={() => setSelectedItem(item)}
                        />
                    ))}
                </div>
            )}

            {/* Floating Action Button (Mobile) */}
            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 right-6 md:hidden w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center active:scale-95 transition-transform z-50"
            >
                <Plus size={28} />
            </button>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Add New Item
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
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
