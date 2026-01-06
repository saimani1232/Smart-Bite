import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, LogIn, UserPlus, Loader, ChefHat, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                await login(username, password);
            } else {
                await register(username, password);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 dark:bg-teal-900/20 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl shadow-lg shadow-emerald-500/25 mb-4">
                        <ChefHat size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                        Smart<span className="text-emerald-500">Bite</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {isLogin ? 'Welcome back!' : 'Create your account'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-none p-8">
                    {/* Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-2xl p-1 mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${isLogin
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${!isLogin
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                                    placeholder="Enter your username"
                                    required
                                    minLength={3}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                                    placeholder="Enter your password"
                                    required
                                    minLength={4}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader size={20} className="animate-spin" />
                            ) : isLogin ? (
                                <>
                                    <LogIn size={20} />
                                    Sign In
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Features hint for signup */}
                    {!isLogin && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                <Sparkles size={16} className="text-amber-500" />
                                <span>Your inventory syncs across all devices</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
