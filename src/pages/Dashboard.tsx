import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { InventoryCard } from '../components/InventoryCard';
import { AddItemForm } from '../components/AddItemForm';
import { ActionModal } from '../components/ActionModal';
import { Plus, Search, AlertTriangle, CheckCircle, Sparkles, TrendingUp, X } from 'lucide-react';
import type { InventoryItem } from '../types';

export const Dashboard: React.FC = () => {
    const { items } = useInventory();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Filter items by search query
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate stats
    const today = new Date();
    const nearExpiry = items.filter(item => {
        const expiry = new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft > 0;
    }).length;

    const expired = items.filter(item => new Date(item.expiryDate) < today).length;
    const fresh = items.filter(item => {
        const expiry = new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft > 7;
    }).length;

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto pb-24">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="stat-card bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/20 rounded-xl">
                            <AlertTriangle size={20} className="text-rose-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-rose-600">{expired}</p>
                            <p className="text-xs text-rose-500/80 font-medium">Expired</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-xl">
                            <Sparkles size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{nearExpiry}</p>
                            <p className="text-xs text-amber-500/80 font-medium">Expiring Soon</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{fresh}</p>
                            <p className="text-xs text-emerald-500/80 font-medium">Fresh Items</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-xl">
                            <TrendingUp size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-violet-600">{items.length}</p>
                            <p className="text-xs text-violet-500/80 font-medium">Total Items</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Add */}
            <div className="flex gap-3 mb-6">
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
                    onClick={() => setShowAddModal(true)}
                    className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Add Item
                </button>
            </div>

            {/* Inventory Grid */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="text-6xl mb-4">🥗</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No items yet!</h3>
                    <p className="text-gray-500 mb-6">Add your first item to start tracking</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
                    >
                        <Plus size={18} className="inline mr-2" />
                        Add Your First Item
                    </button>
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
        </div>
    );
};
