import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, RefreshCw, AlertCircle, ChevronDown, Video, Zap, Scan, Sparkles } from 'lucide-react';

interface CameraModalProps {
    onCapture: (imageSrc: string) => void;
    onClose: () => void;
    type: 'product' | 'expiry';
}

interface CameraDevice {
    deviceId: string;
    label: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose, type }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeStreamRef = useRef<MediaStream | null>(null);

    const [error, setError] = useState<string>('');
    const [isReady, setIsReady] = useState(false);
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [_selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [showCameraSelect, setShowCameraSelect] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [flashOn, setFlashOn] = useState(false);

    const killAllStreams = useCallback(() => {
        if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach(track => track.stop());
            activeStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.pause();
            const stream = videoRef.current.srcObject as MediaStream;
            if (stream) stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
            videoRef.current.load();
        }
        setIsReady(false);
    }, []);

    const startCamera = useCallback(async (deviceId: string) => {
        killAllStreams();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceId ? { deviceId: { exact: deviceId } } : true
            });
            activeStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => { });
                setIsReady(true);
            }
            setError('');
        } catch (err) {
            console.error('[Camera] Error:', err);
            setError('Could not start the selected camera.');
        }
    }, [killAllStreams]);

    // Enumerate cameras
    const getCameras = useCallback(async () => {
        setError('');
        setIsLoading(true);
        try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(t => t.stop());

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices
                .filter(d => d.kind === 'videoinput')
                .map(d => ({
                    deviceId: d.deviceId,
                    label: d.label || `Camera ${d.deviceId.slice(0, 8)}`
                }));

            setCameras(videoDevices);

            if (videoDevices.length === 1) {
                setSelectedCameraId(videoDevices[0].deviceId);
                setShowCameraSelect(false);
                startCamera(videoDevices[0].deviceId);
            } else if (videoDevices.length === 0) {
                setError('No camera devices detected on this system.');
            }
        } catch (err) {
            console.error('[Camera] Permission error:', err);
            setError('Camera access denied. Please enable camera permission in your browser and retry.');
        } finally {
            setIsLoading(false);
        }
    }, [startCamera]);

    useEffect(() => {
        getCameras();
        return () => killAllStreams();
    }, [getCameras, killAllStreams]);

    const handleSelectCamera = (deviceId: string) => {
        setSelectedCameraId(deviceId);
        setShowCameraSelect(false);
        startCamera(deviceId);
    };

    const handleClose = useCallback(() => {
        killAllStreams();
        onClose();
    }, [killAllStreams, onClose]);

    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        if (!context) return;

        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageSrc = canvasRef.current.toDataURL('image/jpeg');

        killAllStreams();
        onCapture(imageSrc);
        onClose();
    }, [killAllStreams, onCapture, onClose]);

    const handleSwitchCamera = () => {
        killAllStreams();
        setShowCameraSelect(true);
        setIsReady(false);
    };

    const statusTitle = type === 'product' ? 'Scanning Product Barcode' : 'Scanning Expiry Date Label';

    return (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
            {/* Header Overlay */}
            <header className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6 flex justify-between items-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-xl rounded-2xl px-4 py-2 border border-slate-700/60 shadow-xl">
                    <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
                        <Scan size={16} />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-xs text-white leading-tight">SmartBite Vision</h1>
                        <p className="text-[10px] text-slate-400">{statusTitle}</p>
                    </div>
                </div>

                <button
                    onClick={handleClose}
                    className="pointer-events-auto w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-xl flex items-center justify-center text-white hover:bg-slate-800 transition-colors border border-slate-700/60 cursor-pointer"
                >
                    <X size={18} />
                </button>
            </header>

            {/* Camera Selection Modal */}
            {showCameraSelect ? (
                <div className="w-full max-w-md p-6">
                    <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 border border-slate-800 shadow-2xl">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                <Video size={22} />
                            </div>
                            <div>
                                <h2 className="text-white font-extrabold text-base">Select Camera</h2>
                                <p className="text-slate-400 text-xs">Choose camera for scanning</p>
                            </div>
                        </div>

                        {error ? (
                            <div className="text-center py-4">
                                <AlertCircle className="mx-auto text-rose-500 mb-2" size={32} />
                                <p className="text-white text-xs mb-4 max-w-xs mx-auto">{error}</p>
                                <button
                                    onClick={getCameras}
                                    className="btn-brand py-2.5 px-6 text-xs font-bold"
                                >
                                    Retry Access
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-slate-400 text-xs font-medium">Detecting optical sensors...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cameras.map((camera, idx) => (
                                    <button
                                        key={camera.deviceId}
                                        onClick={() => handleSelectCamera(camera.deviceId)}
                                        className="w-full flex items-center gap-3 p-3.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-all text-left group cursor-pointer border border-slate-700/50"
                                    >
                                        <div className="w-9 h-9 bg-slate-700 group-hover:bg-emerald-500/20 rounded-lg flex items-center justify-center transition-colors">
                                            <Video size={16} className="text-slate-400 group-hover:text-emerald-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-semibold text-xs truncate">{camera.label}</p>
                                            <p className="text-slate-400 text-[10px]">Sensor {idx + 1}</p>
                                        </div>
                                        <ChevronDown size={16} className="text-slate-400 -rotate-90" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleClose}
                            className="w-full mt-4 py-2.5 text-slate-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Live Stream Viewport */}
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                        {error ? (
                            <div className="text-center p-6 bg-slate-900/90 rounded-2xl border border-slate-800">
                                <AlertCircle className="mx-auto text-rose-500 mb-2" size={32} />
                                <p className="text-white text-sm">{error}</p>
                                <button onClick={handleSwitchCamera} className="mt-4 btn-brand py-2 px-4 text-xs font-bold">
                                    Try Another Camera
                                </button>
                            </div>
                        ) : (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        )}

                        {/* Scanner Viewfinder Reticle */}
                        {!error && (
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                                <div className="relative w-full max-w-sm aspect-[4/3] border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                                    {/* Corner Guides */}
                                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />

                                    {/* Animated Scan Line */}
                                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                                        <div className="scan-line animate-scan" />
                                    </div>

                                    {/* Center Guidance Text */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white/70 text-xs font-extrabold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                                            {type === 'product' ? 'Align Barcode Inside Box' : 'Align Expiry Date Inside Box'}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Pill */}
                                {isReady && (
                                    <div className="mt-5 bg-slate-900/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-slate-700/80 flex items-center gap-2 shadow-lg">
                                        <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                                        <span className="text-xs font-bold text-white">Sensor Active & Focused</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Control Actions */}
                    {!error && (
                        <div className="absolute bottom-6 left-0 right-0 px-8 flex justify-between items-center z-20 pointer-events-none max-w-sm mx-auto">
                            {/* Flash Button */}
                            <button
                                onClick={() => setFlashOn(!flashOn)}
                                className={`pointer-events-auto w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors cursor-pointer ${
                                    flashOn ? 'bg-white text-slate-900 border-white' : 'bg-slate-900/70 border-slate-700 text-white hover:bg-slate-800'
                                }`}
                            >
                                <Zap size={18} className={flashOn ? 'fill-current' : ''} />
                            </button>

                            {/* Shutter Capture Button */}
                            <button
                                onClick={handleCapture}
                                disabled={!isReady}
                                className="pointer-events-auto relative w-20 h-20 rounded-full border-4 border-white/40 flex items-center justify-center group hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
                            >
                                <div className={`w-16 h-16 bg-white rounded-full group-hover:bg-emerald-500 transition-colors duration-200 ${!isReady ? 'opacity-40' : ''}`} />
                            </button>

                            {/* Switch Camera */}
                            <button
                                onClick={handleSwitchCamera}
                                className="pointer-events-auto w-12 h-12 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700 flex items-center justify-center text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <style>{`
                .scan-line {
                    background: linear-gradient(to bottom, rgba(16, 185, 129, 0), rgba(16, 185, 129, 0.9), rgba(16, 185, 129, 0));
                    height: 3px;
                    width: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);
                }
                @keyframes scan {
                    0%, 100% { transform: translateY(0); opacity: 0.3; }
                    50% { transform: translateY(calc(100% - 3px)); opacity: 1; }
                }
                .animate-scan {
                    animation: scan 2.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
