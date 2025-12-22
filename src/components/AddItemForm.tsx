import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { CameraModal } from './CameraModal';
import { Calendar, Save, Upload, Camera, Loader, Sparkles, Barcode } from 'lucide-react';
import { isBulkItem } from '../utils/logic';
import type { InventoryItem } from '../types';
import { extractTextFromImage, extractExpiryDate, detectBarcode, lookupProduct } from '../services/visionService';

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

    const isBulk = isBulkItem(quantity, unit);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !expiryDate) return;
        addItem({ name, quantity, unit, expiryDate, category, image: '' });
        onClose();
    };

    const openCamera = (type: 'product' | 'expiry') => {
        setActiveCameraType(type);
        setShowCamera(true);
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

                // Show info to user
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

            console.log('Extracted Text:\n', extractedText);

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

            <form onSubmit={handleSubmit} className="space-y-6 relative">
                {/* AI Mode Banner */}
                <div className="absolute -top-10 left-0 right-0 text-center">
                    <span className="text-[10px] px-3 py-1 rounded-full font-medium inline-flex items-center gap-1 bg-violet-100 text-violet-700">
                        <Sparkles size={10} /> Cloud Vision AI + Smart Parsing
                    </span>
                </div>

                {/* Scanner Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product/Barcode Scanner */}
                    <div className={`p-4 rounded-2xl border transition-all ${name ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Barcode size={18} className={name ? "text-emerald-600" : "text-gray-500"} />
                            <span className="text-sm font-bold text-gray-700">Scan Barcode</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => openCamera('product')}
                                disabled={!!scanningType}
                                className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm text-center active:scale-95 disabled:opacity-50"
                            >
                                <Camera size={20} className="text-emerald-600 mb-1" />
                                <span className="text-[10px] font-semibold text-gray-600 uppercase">Camera</span>
                            </button>

                            <label className={`flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer shadow-sm text-center active:scale-95 ${scanningType ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                    ref={productFileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, 'product')}
                                />
                                <Upload size={20} className="text-gray-500 mb-1" />
                                <span className="text-[10px] font-semibold text-gray-600 uppercase">Upload</span>
                            </label>
                        </div>

                        {detectedBarcode && (
                            <div className="mt-2 text-center text-[10px] text-gray-500 font-mono bg-gray-100 rounded px-2 py-1">
                                Barcode: {detectedBarcode}
                            </div>
                        )}

                        {scanningType === 'product' && (
                            <div className="mt-3 text-center text-xs text-emerald-600 font-medium">
                                <Loader size={14} className="animate-spin inline mr-1" />
                                {scanStatus || 'Processing...'}
                            </div>
                        )}
                    </div>

                    {/* Expiry Scanner */}
                    <div className={`p-4 rounded-2xl border transition-all ${expiryDate ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar size={18} className={expiryDate ? "text-amber-600" : "text-gray-500"} />
                            <span className="text-sm font-bold text-gray-700">Expiry Date</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => openCamera('expiry')}
                                disabled={!!scanningType}
                                className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm text-center active:scale-95 disabled:opacity-50"
                            >
                                <Camera size={20} className="text-amber-600 mb-1" />
                                <span className="text-[10px] font-semibold text-gray-600 uppercase">Camera</span>
                            </button>

                            <label className={`flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer shadow-sm text-center active:scale-95 ${scanningType ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                    ref={expiryFileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, 'expiry')}
                                />
                                <Upload size={20} className="text-gray-500 mb-1" />
                                <span className="text-[10px] font-semibold text-gray-600 uppercase">Upload</span>
                            </label>
                        </div>

                        {scanningType === 'expiry' && (
                            <div className="mt-3 text-center text-xs text-amber-600 font-medium">
                                <Loader size={14} className="animate-spin inline mr-1" />
                                {scanStatus || 'Processing...'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Fields */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Product Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input-field"
                        placeholder="Scan barcode or enter manually"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="input-field"
                            min={0.1}
                            step={0.1}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Unit</label>
                        <select value={unit} onChange={e => setUnit(e.target.value as any)} className="input-field">
                            <option value="pkg">Packets</option>
                            <option value="kg">Kilograms</option>
                            <option value="l">Liters</option>
                        </select>
                    </div>
                </div>

                {isBulk && (
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 text-sm rounded-xl flex items-start gap-2">
                        <span>ℹ️</span>
                        <span><strong>Bulk Item:</strong> 14-day early reminder.</span>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Expiration</label>
                    <input
                        type="date"
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                        className="input-field"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value as any)} className="input-field">
                        <option value="Dairy">Dairy</option>
                        <option value="Grain">Grain</option>
                        <option value="Vegetable">Vegetable</option>
                        <option value="Meat">Meat</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <button type="submit" className="btn-primary mt-6">
                    <Save size={18} className="mr-2" />
                    Add to Inventory
                </button>
            </form>
        </>
    );
};
