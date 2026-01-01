import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle, AlertCircle, Loader2, Leaf, Bell, Moon, Sun, Shield, Heart } from 'lucide-react';
import { isEmailConfigured, sendTestEmail } from '../services/emailService';
import { useTheme } from '../context/ThemeContext';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
    const [testEmail, setTestEmail] = useState('');
    const [sendStatus, setSendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [notifications, setNotifications] = useState(true);

    const { isDarkMode, toggleDarkMode } = useTheme();
    const emailConfigured = isEmailConfigured();

    const handleSendTestEmail = async () => {
        if (!testEmail) {
            setSendStatus('error');
            setStatusMessage('Please enter an email address');
            return;
        }

        setSendStatus('loading');
        setStatusMessage('Sending test email...');

        const result = await sendTestEmail(testEmail);

        if (result.success) {
            setSendStatus('success');
            setStatusMessage(result.message);
            setTestEmail('');
            setTimeout(() => {
                setSendStatus('idle');
                setStatusMessage('');
            }, 4000);
        } else {
            setSendStatus('error');
            setStatusMessage(result.message);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto animate-slide-in">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                                <Leaf size={22} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Settings</h2>
                                <p className="text-xs text-white/80">Smart Bite v1.0</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Preferences Section */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Preferences</h3>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            <div className="flex items-center gap-3">
                                {isDarkMode ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-amber-500" />}
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">Dark Mode</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {isDarkMode ? 'Currently enabled' : 'Currently disabled'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Notifications Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className={notifications ? 'text-emerald-500' : 'text-gray-400'} />
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">Push Notifications</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Expiry reminders</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-7 rounded-full transition-colors relative ${notifications ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </section>

                    {/* Test Email Section */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email Test</h3>

                        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Mail size={18} className="text-emerald-600 dark:text-emerald-400" />
                                <p className="font-medium text-gray-800 dark:text-gray-200">Send Test Reminder</p>
                                {emailConfigured && (
                                    <span className="ml-auto px-2 py-0.5 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-full">
                                        Ready
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Receive a sample expiry alert with recipe suggestions
                            </p>

                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    className="flex-1 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                    disabled={sendStatus === 'loading'}
                                />
                                <button
                                    onClick={handleSendTestEmail}
                                    disabled={sendStatus === 'loading' || !emailConfigured}
                                    className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${sendStatus === 'loading' || !emailConfigured
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                        : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
                                        }`}
                                >
                                    {sendStatus === 'loading' ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                </button>
                            </div>

                            {/* Status Message */}
                            {statusMessage && (
                                <div className={`flex items-center gap-2 mt-3 p-2 rounded-lg text-xs ${sendStatus === 'success'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                                    : sendStatus === 'error'
                                        ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                    }`}>
                                    {sendStatus === 'success' && <CheckCircle size={14} />}
                                    {sendStatus === 'error' && <AlertCircle size={14} />}
                                    {sendStatus === 'loading' && <Loader2 size={14} className="animate-spin" />}
                                    <span>{statusMessage}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* About Section */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">About</h3>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                                    <Leaf size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">Smart Bite</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Reduce food waste, save money</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-xl">
                                    <Shield size={14} className="text-emerald-500" />
                                    <span className="text-xs text-gray-600 dark:text-gray-300">Privacy First</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-xl">
                                    <Heart size={14} className="text-rose-500" />
                                    <span className="text-xs text-gray-600 dark:text-gray-300">Made with ❤️</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.25s ease-out;
                }
            `}</style>
        </>
    );
};
