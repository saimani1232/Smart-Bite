import React, { useState, useEffect } from 'react';
import {
    X,
    Mail,
    Send,
    CheckCircle,
    AlertCircle,
    Loader2,
    Leaf,
    Bell,
    Moon,
    Sun,
    Shield,
    Heart,
    Database,
    RotateCcw,
    Cloud,
    Sparkles
} from 'lucide-react';
import { isEmailConfigured, sendTestEmail } from '../services/emailService';
import { useTheme } from '../context/ThemeContext';
import { isPushSupported, isPushEnabled, setPushEnabled, requestPushPermission, getPushPermission } from '../services/pushService';
import { localStore } from '../services/localStore';
import { useInventory } from '../context/InventoryContext';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
    const [testEmail, setTestEmail] = useState('');
    const [sendStatus, setSendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [pushEnabled, setLocalPushEnabled] = useState(isPushEnabled());
    const [pushPermission, setPushPermission] = useState(getPushPermission());
    const [syncMode, setSyncMode] = useState<'cloud' | 'local'>(localStore.getSyncMode());
    const [resetting, setResetting] = useState(false);

    const { isDarkMode, toggleDarkMode } = useTheme();
    const { refetchItems } = useInventory();
    const emailConfigured = isEmailConfigured();
    const pushSupported = isPushSupported();

    useEffect(() => {
        const handleSyncChange = (e: Event) => {
            const customEvent = e as CustomEvent<'cloud' | 'local'>;
            setSyncMode(customEvent.detail || localStore.getSyncMode());
        };
        window.addEventListener('smartbite_sync_changed', handleSyncChange);
        return () => window.removeEventListener('smartbite_sync_changed', handleSyncChange);
    }, []);

    const handleResetDemo = async () => {
        if (confirm('Reset your inventory back to the default sample pantry items?')) {
            setResetting(true);
            localStore.resetToDemoData();
            await refetchItems();
            setResetting(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!testEmail) {
            setSendStatus('error');
            setStatusMessage('Please enter an email address');
            return;
        }

        setSendStatus('loading');
        setStatusMessage('Sending test email alert...');

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
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Slide-Over Drawer */}
            <div className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-slide-in">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                <Leaf size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Settings & Preferences
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    SmartBite v1.0
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Appearance Section */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Appearance
                        </h3>

                        <button
                            onClick={toggleDarkMode}
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-500' : 'bg-amber-100 text-amber-500'}`}>
                                    {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Dark Theme</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {isDarkMode ? 'Dark mode enabled' : 'Light mode enabled'}
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${
                                    isDarkMode ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                            >
                                <span
                                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                                        isDarkMode ? 'left-6' : 'left-1'
                                    }`}
                                />
                            </div>
                        </button>
                    </section>

                    {/* Notifications Section */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Notifications
                        </h3>

                        {/* Push Notification Toggle */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Bell size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Push Alerts</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {!pushSupported ? 'Not supported in browser' :
                                            pushPermission === 'denied' ? 'Permission denied' :
                                                pushPermission === 'granted' && pushEnabled ? 'Enabled' : 'Click to enable'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!pushSupported) return;
                                    if (pushPermission !== 'granted') {
                                        const granted = await requestPushPermission();
                                        setPushPermission(getPushPermission());
                                        if (granted) {
                                            setPushEnabled(true);
                                            setLocalPushEnabled(true);
                                        }
                                    } else {
                                        const newValue = !pushEnabled;
                                        setPushEnabled(newValue);
                                        setLocalPushEnabled(newValue);
                                    }
                                }}
                                disabled={!pushSupported || pushPermission === 'denied'}
                                aria-label="Toggle push notifications"
                                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                                    !pushSupported || pushPermission === 'denied'
                                        ? 'bg-slate-200 dark:bg-slate-800 opacity-50 cursor-not-allowed'
                                        : pushEnabled && pushPermission === 'granted'
                                            ? 'bg-emerald-500'
                                            : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 w-5.5 h-5.5 bg-white rounded-full shadow-sm transition-transform ${
                                        pushEnabled && pushPermission === 'granted' ? 'left-6' : 'left-0.5'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Email Reminder Test Box */}
                        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        Email Notification Test
                                    </span>
                                </div>
                                {emailConfigured && (
                                    <span className="px-2 py-0.5 bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                                        Active
                                    </span>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Test email delivery for upcoming food expiry alerts and recipe suggestions.
                            </p>

                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    disabled={sendStatus === 'loading'}
                                />
                                <button
                                    onClick={handleSendTestEmail}
                                    disabled={sendStatus === 'loading' || !emailConfigured}
                                    className="btn-brand py-2 px-3 text-xs flex items-center justify-center cursor-pointer disabled:opacity-50"
                                >
                                    {sendStatus === 'loading' ? (
                                        <Loader2 size={15} className="animate-spin" />
                                    ) : (
                                        <Send size={15} />
                                    )}
                                </button>
                            </div>

                            {statusMessage && (
                                <div className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium ${
                                    sendStatus === 'success'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                                        : sendStatus === 'error'
                                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                                            : 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300'
                                }`}>
                                    {sendStatus === 'success' && <CheckCircle size={14} />}
                                    {sendStatus === 'error' && <AlertCircle size={14} />}
                                    <span>{statusMessage}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Database & Cloud Persistence */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Database & Persistence
                        </h3>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                        syncMode === 'cloud'
                                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400'
                                    }`}>
                                        {syncMode === 'cloud' ? <Cloud size={18} /> : <Database size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {syncMode === 'cloud' ? 'Google Firebase Cloud' : 'Local Storage'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {syncMode === 'cloud' ? 'Persistent across all devices' : 'Stored safely in browser'}
                                        </p>
                                    </div>
                                </div>

                                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                    Active
                                </span>
                            </div>

                            {/* Reset to sample pantry */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={handleResetDemo}
                                    disabled={resetting}
                                    className="w-full btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
                                    <span>Reset to Default Demo Pantry</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* About Section */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            About
                        </h3>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                <Sparkles size={16} className="text-emerald-500" />
                                <span>SmartBite Mission</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                                SmartBite is built to eradicate household food waste by combining predictive expiry dates, barcode recognition, and instant recipe pairing.
                            </p>
                            <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-1">
                                    <Shield size={13} className="text-emerald-500" />
                                    <span>Zero Tracking</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Heart size={13} className="text-rose-500" />
                                    <span>Food Tech</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};
