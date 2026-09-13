import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { CameraModal } from './CameraModal';
import {
    Calendar,
    Save,
    Upload,
    Camera,
    Loader,
    Sparkles,
    Barcode,
    Bell,
    Mail,
    Plus,
    Minus,
} from 'lucide-react';
import { isBulkItem } from '../utils/logic';
import type { InventoryItem } from '../types';
import {
    extractTextFromImage,
    extractExpiryDate,
    detectBarcode,
    lookupProduct,
} from '../services/visionService';

const COMMON_SUGGESTIONS = [
    { name: 'Fresh Milk', category: 'Dairy' as const, days: 7, unit: 'l' as const, emoji: '🥛' },
    { name: 'Eggs (Dozen)', category: 'Dairy' as const, days: 14, unit: 'pkg' as const, emoji: '🥚' },
    { name: 'Whole Wheat Bread', category: 'Grain' as const, days: 5, unit: 'pkg' as const, emoji: '🍞' },
    { name: 'Fresh Tomatoes', category: 'Vegetable' as const, days: 7, unit: 'kg' as const, emoji: '🍅' },
    { name: 'Chicken Breast', category: 'Meat' as const, days: 3, unit: 'g' as const, emoji: '🍗' },
    { name: 'Crisp Apples', category: 'Vegetable' as const, days: 12, unit: 'kg' as const, emoji: '🍎' },
];

export const AddItemForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addItem } = useInventory();

    const productFileRef = useRef<HTMLInputElement>(null);
    const expiryFileRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [unit, setUnit] = useState<InventoryItem['unit']>('pkg');
    const [expiryDate, setExpiryDate] = useState('');
    const [category, setCategory] = useState<InventoryItem['category']>('Other');

    const [scanningType, setScanningType] = useState<'product' | 'expiry' | null>(null);
    const [scanStatus, setScanStatus] = useState<string>('');
    const [showCamera, setShowCamera] = useState(false);
    const [activeCameraType, setActiveCameraType] = useState<'product' | 'expiry'>('product');
    const [detectedBarcode, setDetectedBarcode] = useState<string>('');

    // Reminder settings
    const [reminderDays, setReminderDays] = useState<number>(3);
    const [reminderEmail, setReminderEmail] = useState<string>('');

    const isBulk = isBulkItem(quantity, unit);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !expiryDate) return;
        addItem({
            name,
            quantity,
            unit,
            expiryDate,
            category,
            image: '',
            reminderDays,
            reminderEmail: reminderEmail || undefined
        });
        onClose();
    };

    const openCamera = (type: 'product' | 'expiry') => {
        setActiveCameraType(type);
        setShowCamera(true);
    };

    // Apply quick expiry preset helper
    const applyExpiryPreset = (daysFromNow: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysFromNow);
        setExpiryDate(d.toISOString().split('T')[0]);
    };

    // Process barcode image - detect barcode and lookup product
    const processBarcodeImage = async (imageSrc: string) => {
        setScanningType('product');
        setScanStatus('Detecting barcode...');

        try {
            const base64Data = imageSrc.split(',')[1];

            // Detect barcode from image
            const barcode = await detectBarcode(base64Data);

            if (!barcode) {
                alert("No barcode found in image. Please try a clearer image of the barcode.");
                return;
            }

            setDetectedBarcode(barcode);
            setScanStatus(`Barcode: ${barcode}. Looking up product...`);

            // Lookup product info
            const productInfo = await lookupProduct(barcode);

            if (productInfo) {
                setName(productInfo.name);
                setCategory(productInfo.category);

                // Set estimated expiry date
                const estimatedExpiry = new Date();
                estimatedExpiry.setDate(estimatedExpiry.getDate() + productInfo.estimatedExpiryDays);
                setExpiryDate(estimatedExpiry.toISOString().split('T')[0]);

                setScanStatus(`Found: ${productInfo.name} (${productInfo.category})`);

                if (productInfo.name === 'Unknown Product') {
                    alert(`Barcode ${barcode} detected but not found in database.\nCategory: ${productInfo.category}\nEstimated expiry: ${productInfo.estimatedExpiryDays} days\n\nPlease enter the product name manually.`);
                }
            }
        } catch (err) {
            console.error('Barcode scan error:', err);
            alert("Failed to process barcode. Please try again.");
        } finally {
            setScanningType(null);
            setScanStatus('');
        }
    };

    // Process expiry date image with OCR
    const processExpiryImage = async (imageSrc: string) => {
        setScanningType('expiry');
        setScanStatus('Connecting to Vision AI...');

        try {
            const base64Data = imageSrc.split(',')[1];

            setScanStatus('Extracting text...');
            const extractedText = await extractTextFromImage(base64Data);

            if (!extractedText || extractedText.trim().length < 3) {
                alert("No text found in image. Please try a clearer image.");
                return;
            }

            setScanStatus('Finding expiry date...');
            const parsedDate = extractExpiryDate(extractedText);

            if (parsedDate) {
                setExpiryDate(parsedDate);
                setScanStatus('Date found!');
            } else {
                alert("Could not find a valid expiry date. Please enter manually.");
            }
        } catch (err) {
            console.error('Vision API Error:', err);
            alert("Failed to process image. Please try again.");
        } finally {
            setScanningType(null);
            setScanStatus('');
        }
    };

    const handleCameraCapture = (imageSrc: string) => {
        if (activeCameraType === 'product') {
            processBarcodeImage(imageSrc);
        } else {
            processExpiryImage(imageSrc);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'expiry') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                if (type === 'product') {
                    processBarcodeImage(event.target.result as string);
                } else {
                    processExpiryImage(event.target.result as string);
                }
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    return (
        <>
            {showCamera && (
                <CameraModal
                    type={activeCameraType}
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Vision AI Quick Tools */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Smart Scanning (Optional)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles size={10} /> Cloud Vision OCR
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Barcode Scanner Tool */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <Barcode size={16} className="text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Barcode</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => openCamera('product')}
                                    disabled={!!scanningType}
                                    className="py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Camera size={13} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Camera</span>
                                </button>
                                <label className="py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1 cursor-pointer">
                                    <input
                                        ref={productFileRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'product')}
                                    />
                                    <Upload size={13} className="text-slate-500" />
                                    <span>Upload</span>
                                </label>
                            </div>
                            {detectedBarcode && (
                                <div className="mt-2 text-[10px] text-slate-500 font-mono bg-white dark:bg-slate-800 rounded px-1.5 py-0.5 truncate">
                                    {detectedBarcode}
                                </div>
                            )}
                        </div>

                        {/* Expiry OCR Tool */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={16} className="text-amber-500" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Expiry Date</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => openCamera('expiry')}
                                    disabled={!!scanningType}
                                    className="py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Camera size={13} className="text-amber-500" />
                                    <span>Camera</span>
                                </button>
                                <label className="py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1 cursor-pointer">
                                    <input
                                        ref={expiryFileRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'expiry')}
                                    />
                                    <Upload size={13} className="text-slate-500" />
                                    <span>Upload</span>
                                </label>
                            </div>
                            {expiryDate && (
                                <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-800 rounded px-1.5 py-0.5 truncate">
                                    Parsed: {expiryDate}
                                </div>
                            )}
                        </div>
                    </div>

                    {scanningType && (
                        <div className="mt-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                            <Loader size={14} className="animate-spin inline mr-1" />
                            {scanStatus || 'Processing...'}
                        </div>
                    )}
                </div>

                {/* Quick Food Suggestions */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Quick Add Common Food
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {COMMON_SUGGESTIONS.map((item) => (
                            <button
                                key={item.name}
                                type="button"
                                onClick={() => {
                                    setName(item.name);
                                    setCategory(item.category);
                                    setUnit(item.unit);
                                    applyExpiryPreset(item.days);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap cursor-pointer transition-colors"
                            >
                                <span>{item.emoji}</span>
                                <span>{item.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Food Name Field */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Ingredient Name *
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field font-semibold text-base"
                        placeholder="e.g. Sourdough Bread, Almond Milk..."
                        required
                    />
                </div>

                {/* Quantity & Unit Stepper */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Quantity
                        </label>
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/80 p-1">
                            <button
                                type="button"
                                onClick={() => setQuantity(prev => Math.max(0.1, Number((prev - 1).toFixed(1))))}
                                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                            >
                                <Minus size={14} />
                            </button>
                            <input
                                type="number"
                                step="any"
                                value={quantity}
                                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                className="w-full text-center bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none"
                                min={0.1}
                            />
                            <button
                                type="button"
                                onClick={() => setQuantity(prev => Number((prev + 1).toFixed(1)))}
                                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Unit
                        </label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value as InventoryItem['unit'])}
                            className="input-field font-semibold"
                        >
                            <option value="pkg">Packets (pkg)</option>
                            <option value="kg">Kilograms (kg)</option>
                            <option value="g">Grams (g)</option>
                            <option value="l">Liters (l)</option>
                            <option value="ml">Milliliters (ml)</option>
                            <option value="pcs">Pieces (pcs)</option>
                        </select>
                    </div>
                </div>

                {isBulk && (
                    <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 p-2.5 rounded-xl text-xs text-sky-800 dark:text-sky-300 font-medium">
                        💡 <strong>Bulk Food Item:</strong> Expiry reminder window automatically extended for large volumes.
                    </div>
                )}

                {/* Expiry Date with Presets */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Expiry Date *
                        </label>
                        <div className="flex gap-1 text-[11px] font-bold">
                            <button
                                type="button"
                                onClick={() => applyExpiryPreset(3)}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                                +3d
                            </button>
                            <button
                                type="button"
                                onClick={() => applyExpiryPreset(7)}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                                +1w
                            </button>
                            <button
                                type="button"
                                onClick={() => applyExpiryPreset(14)}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                                +2w
                            </button>
                            <button
                                type="button"
                                onClick={() => applyExpiryPreset(30)}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                                +1m
                            </button>
                        </div>
                    </div>
                    <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="input-field font-semibold"
                        required
                    />
                </div>

                {/* Category Grid */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Food Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: 'Dairy', label: 'Dairy', emoji: '🥛' },
                            { value: 'Vegetable', label: 'Produce', emoji: '🥬' },
                            { value: 'Meat', label: 'Meat', emoji: '🥩' },
                            { value: 'Grain', label: 'Grains', emoji: '🌾' },
                            { value: 'Snacks', label: 'Snacks', emoji: '🍿' },
                            { value: 'Other', label: 'Other', emoji: '🥫' },
                        ].map((cat) => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setCategory(cat.value as InventoryItem['category'])}
                                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                    category === cat.value
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.02]'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="text-base">{cat.emoji}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reminder Settings Box */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-2">
                        <Bell size={15} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            Freshness Alerts
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                Remind me before
                            </label>
                            <select
                                value={reminderDays}
                                onChange={(e) => setReminderDays(Number(e.target.value))}
                                className="input-field text-xs font-semibold py-2"
                            >
                                <option value="0">No Reminder</option>
                                <option value="1">1 day before</option>
                                <option value="3">3 days before</option>
                                <option value="5">5 days before</option>
                                <option value="7">7 days before</option>
                                <option value="14">14 days before</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                <Mail size={12} className="inline mr-1" />
                                Alert Email
                            </label>
                            <input
                                type="email"
                                value={reminderEmail}
                                onChange={(e) => setReminderEmail(e.target.value)}
                                className="input-field text-xs py-2"
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Primary Submit Button */}
                <button
                    type="submit"
                    className="w-full btn-brand py-3.5 text-sm font-bold shadow-lg shadow-emerald-600/20"
                >
                    <Save size={18} />
                    <span>Save to Inventory</span>
                </button>
            </form>
        </>
    );
};
