import React, { useState, useEffect } from 'react';
import { Leaf, Bell, Settings, Home, BarChart3, ChefHat, LogOut, Cloud, Database, Sun, Moon } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';
import { NotificationsPanel, getNotificationCount } from './NotificationsPanel';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { localStore } from '../services/localStore';
import type { PageType } from '../App';

interface LayoutProps {
    children: React.ReactNode;
    currentPage: PageType;
    onNavigate: (page: PageType) => void;
    onOpenRecipes?: (itemId: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onOpenRecipes }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [syncMode, setSyncMode] = useState<'cloud' | 'local'>(localStore.getSyncMode());
    const { items } = useInventory();
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();

    useEffect(() => {
        const handleSyncChange = (e: Event) => {
            const customEvent = e as CustomEvent<'cloud' | 'local'>;
            setSyncMode(customEvent.detail || localStore.getSyncMode());
        };
        window.addEventListener('smartbite_sync_changed', handleSyncChange);
        return () => window.removeEventListener('smartbite_sync_changed', handleSyncChange);
    }, []);

    const notificationCount = getNotificationCount(items);

    const handleOpenRecipes = (itemId: string) => {
        setShowNotifications(false);
        if (onOpenRecipes) {
            onOpenRecipes(itemId);
        }
    };

    const navItems = [
        { id: 'home' as PageType, label: 'Pantry', icon: Home },
        { id: 'recipes' as PageType, label: 'Recipes', icon: ChefHat },
        { id: 'analytics' as PageType, label: 'Insights', icon: BarChart3 },
    ];

    return (
        <div className="min-h-screen flex flex-col transition-colors duration-200">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 glass-panel border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    {/* Brand Mark */}
                    <button
                        onClick={() => onNavigate('home')}
                        className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 group-hover:shadow-emerald-500/40 transition-all duration-200">
                            <Leaf size={22} className="text-white transform group-hover:rotate-6 transition-transform" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    Smart<span className="text-emerald-500">Bite</span>
                                </span>
                                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                    Pantry
                                </span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block -mt-0.5">
                                Intelligent Food & Expiry Manager
                            </p>
                        </div>
                    </button>

                    {/* Desktop Segmented Navigation */}
                    <nav className="hidden md:flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                        isActive
                                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                    }`}
                                >
                                    <Icon size={16} className={isActive ? 'text-emerald-500 dark:text-emerald-400' : ''} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right Utility Actions */}
                    <div className="flex items-center gap-2">
                        {/* Storage Sync Status Pill */}
                        <div
                            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                syncMode === 'cloud'
                                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                    : 'bg-sky-50/90 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
                            }`}
                            title={syncMode === 'cloud' ? 'Connected to Google Firebase Cloud Database' : 'Running in perpetual Local-First storage'}
                        >
                            {syncMode === 'cloud' ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <Cloud size={13} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Cloud Sync</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                                    <Database size={13} className="text-sky-600 dark:text-sky-400" />
                                    <span>Local Storage</span>
                                </>
                            )}
                        </div>

                        {/* Notifications Bell */}
                        <button
                            onClick={() => setShowNotifications(true)}
                            aria-label="View notifications"
                            className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        >
                            <Bell size={20} />
                            {notificationCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 shadow-md shadow-rose-500/30 animate-pulse">
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </span>
                            )}
                        </button>

                        {/* Direct Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
                        </button>

                        {/* Settings Button */}
                        <button
                            onClick={() => setShowSettings(true)}
                            aria-label="Open settings"
                            className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        >
                            <Settings size={20} />
                        </button>

                        {/* User Profile Chip & Logout */}
                        {user && (
                            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold uppercase">
                                        {user.username.charAt(0)}
                                    </div>
                                    <span className="hidden lg:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                                        {user.username}
                                    </span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                                    title="Sign out"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Application Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12 animate-slide-up">
                {children}
            </main>

            {/* Mobile Bottom Navigation Dock */}
            <nav className="md:hidden fixed bottom-3 left-4 right-4 z-40 glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl p-1.5">
                <div className="grid grid-cols-3 gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                }`}
                            >
                                <Icon size={19} />
                                <span className="text-[11px] font-bold mt-0.5">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Drawers */}
            <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <NotificationsPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onOpenRecipes={handleOpenRecipes}
            />
        </div>
    );
};
