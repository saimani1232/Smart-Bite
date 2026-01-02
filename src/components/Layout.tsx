import React, { useState } from 'react';
import { Leaf, Bell, Settings, Home, BarChart2, Book } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';
import { NotificationsPanel, getNotificationCount } from './NotificationsPanel';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../context/ThemeContext';
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
    const { items } = useInventory();
    const { isDarkMode } = useTheme();

    const notificationCount = getNotificationCount(items);

    const handleOpenRecipes = (itemId: string) => {
        setShowNotifications(false);
        if (onOpenRecipes) {
            onOpenRecipes(itemId);
        }
    };

    const navItems = [
        { id: 'home' as PageType, label: 'Home', icon: Home },
        { id: 'recipes' as PageType, label: 'Recipes', icon: Book },
        { id: 'analytics' as PageType, label: 'Analytics', icon: BarChart2 },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950'
            : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'
            }`}>
            {/* Header */}
            <header className="sticky top-0 z-40 glass-panel border-b border-white/20 dark:border-gray-700/50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Logo */}
                    <button
                        onClick={() => onNavigate('home')}
                        className="flex items-center gap-3 group cursor-pointer"
                    >
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                            <Leaf size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                                Smart Bite
                            </h1>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">Food Inventory Manager</p>
                        </div>
                    </button>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-full p-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${isActive
                                            ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 font-medium shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* Notifications Button */}
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="relative p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
                        >
                            <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md">
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </span>
                            )}
                        </button>

                        {/* Settings Button */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
                        >
                            <Settings size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/20 dark:border-gray-700/50 pb-safe">
                <div className="flex justify-around py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${isActive
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main>{children}</main>

            {/* Settings Panel */}
            <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

            {/* Notifications Panel */}
            <NotificationsPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onOpenRecipes={handleOpenRecipes}
            />
        </div>
    );
};
