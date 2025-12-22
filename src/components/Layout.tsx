import React from 'react';
import { Leaf, Bell, Settings, Home, BarChart2, Book } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            {/* Header */}
            <header className="sticky top-0 z-40 glass-panel border-b border-white/20">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                            <Leaf size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Smart Bite
                            </h1>
                            <p className="text-[10px] text-gray-500 -mt-0.5">Food Inventory Manager</p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 rounded-full p-1">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-emerald-600 font-medium text-sm shadow-sm">
                            <Home size={16} />
                            Home
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 rounded-full text-sm transition-colors">
                            <Book size={16} />
                            Recipes
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 rounded-full text-sm transition-colors">
                            <BarChart2 size={16} />
                            Analytics
                        </button>
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <button className="relative p-2 hover:bg-white/50 rounded-full transition-colors">
                            <Bell size={20} className="text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                        </button>
                        <button className="p-2 hover:bg-white/50 rounded-full transition-colors">
                            <Settings size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
};
