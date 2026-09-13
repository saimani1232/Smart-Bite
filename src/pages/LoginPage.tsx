import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    UserPlus,
    Loader,
    Leaf,
    Sparkles,
    ShieldCheck,
    Cloud,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

// Google Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                    }) => void;
                    renderButton: (element: HTMLElement, config: {
                        theme?: string;
                        size?: string;
                        width?: number;
                        text?: string;
                    }) => void;
                };
            };
        };
    }
}

export const LoginPage: React.FC = () => {
    const { login, register, loginWithGoogle } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const googleButtonRef = useRef<HTMLDivElement>(null);

    // Load Google Identity Services script
    useEffect(() => {
        const loadGoogleScript = () => {
            if (document.getElementById('google-gsi-script')) return;

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.id = 'google-gsi-script';
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogle;
            document.body.appendChild(script);
        };

        const initializeGoogle = () => {
            if (window.google && googleButtonRef.current) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse
                });

                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: 320,
                    text: 'continue_with'
                });
            }
        };

        if (window.google) {
            initializeGoogle();
        } else {
            loadGoogleScript();
        }
    }, []);

    const handleGoogleResponse = async (response: { credential: string }) => {
        setError('');
        setGoogleLoading(true);

        try {
            await loginWithGoogle(response.credential);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google sign-in failed');
        } finally {
            setGoogleLoading(false);
        }
    };

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
            setError(err instanceof Error ? err.message : 'An error occurred during authentication');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/15 dark:bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
                {/* Left Brand Showcase (Desktop) */}
                <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <Leaf size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Intelligent Pantry & Zero Waste</span>
                    </div>

                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                            Smart<span className="text-emerald-500">Bite</span>
                        </h1>
                        <p className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400 mt-2">
                            Never let good food go to waste again.
                        </p>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
                        Track freshness with smart countdowns, receive automated reminders, and generate delicious meals from expiring ingredients.
                    </p>

                    {/* Value Proposition Highlights */}
                    <div className="space-y-3 pt-2 max-w-md mx-auto lg:mx-0 text-left">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Predictive Expiry Tracking
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Barcode scan & OCR date extraction in seconds
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm">
                            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                                <Cloud size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Cloud Sync Across All Devices
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Your pantry data is perpetually backed up
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <ShieldCheck size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    100% Free & Open Ecosystem
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    No paywalls, no recurring fees
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Auth Card */}
                <div className="lg:col-span-6">
                    <div className="surface-card rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-elevated">
                        {/* Tab Switcher */}
                        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(true);
                                    setError('');
                                }}
                                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    isLogin
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(false);
                                    setError('');
                                }}
                                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    !isLogin
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                Create Account
                            </button>
                        </div>

                        {/* Google Sign In Container */}
                        <div className="mb-6 flex flex-col items-center">
                            <div
                                ref={googleButtonRef}
                                className="w-full flex justify-center min-h-[44px]"
                            />
                            {googleLoading && (
                                <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    <Loader size={16} className="animate-spin" />
                                    <span>Verifying Google account...</span>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-medium">
                                    or continue with username
                                </span>
                            </div>
                        </div>

                        {/* Error Notice */}
                        {error && (
                            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                    Username
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                        placeholder="e.g. chef_alex"
                                        required
                                        minLength={3}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                        placeholder="••••••••"
                                        required
                                        minLength={4}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                    >
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-brand py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader size={18} className="animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : isLogin ? (
                                    <>
                                        <LogIn size={18} />
                                        <span>Sign In to SmartBite</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={18} />
                                        <span>Create Free Account</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Reassurance Footer */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span>Cloud persistent storage enabled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
