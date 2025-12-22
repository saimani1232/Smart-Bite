import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, RefreshCw, AlertCircle, ChevronDown, Video } from 'lucide-react';

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
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [showCameraSelect, setShowCameraSelect] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

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
            setError('Failed to start camera.');
        }
    }, [killAllStreams]);

    // Enumerate cameras - exposed for retry button
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
                setError('No cameras found.');
            }
        } catch (err) {
            console.error('[Camera] Permission error:', err);
            setError('Camera access denied. Please allow permissions in browser, then click Retry.');
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

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
                <span className="text-white font-semibold text-lg">
                    {type === 'product' ? 'Scan Product' : 'Scan Expiry Date'}
                </span>
                <button onClick={handleClose} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30">
                    <X size={24} />
                </button>
            </div>

            {/* Camera Selection */}
            {showCameraSelect ? (
                <div className="w-full max-w-md p-6">
                    <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                                <Video size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">Select Camera</h2>
                                <p className="text-gray-400 text-sm">Choose which camera to use</p>
                            </div>
                        </div>

                        {error ? (
                            <div className="text-center py-4">
                                <AlertCircle className="mx-auto text-rose-500 mb-3" size={32} />
                                <p className="text-white text-sm mb-4">{error}</p>
                                <button
                                    onClick={getCameras}
                                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="text-center py-6">
                                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-gray-400 text-sm">Detecting cameras...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cameras.map((camera, idx) => (
                                    <button
                                        key={camera.deviceId}
                                        onClick={() => handleSelectCamera(camera.deviceId)}
                                        className="w-full flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 bg-gray-700 group-hover:bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                            <Video size={18} className="text-gray-400 group-hover:text-emerald-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{camera.label}</p>
                                            <p className="text-gray-500 text-xs">Camera {idx + 1}</p>
                                        </div>
                                        <ChevronDown size={18} className="text-gray-500 -rotate-90" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <button onClick={handleClose} className="w-full mt-6 py-3 text-gray-500 hover:text-gray-400 font-medium text-sm">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Video */}
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                        {error ? (
                            <div className="text-center p-6 bg-gray-900 rounded-2xl border border-gray-800">
                                <AlertCircle className="mx-auto text-rose-500 mb-2" size={32} />
                                <p className="text-white">{error}</p>
                                <button onClick={handleSwitchCamera} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm">
                                    Try Another Camera
                                </button>
                            </div>
                        ) : (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        )}

                        {isReady && (
                            <>
                                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                                    Ready
                                </div>
                                <div className="absolute top-20 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                                    {cameras.find(c => c.deviceId === selectedCameraId)?.label.slice(0, 25) || 'Camera'}
                                </div>
                            </>
                        )}

                        {!error && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-[70%] aspect-square border-2 border-white/50 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl -mt-1 -ml-1"></div>
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl -mt-1 -mr-1"></div>
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl -mb-1 -ml-1"></div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-xl -mb-1 -mr-1"></div>
                                </div>
                                <p className="absolute bottom-32 text-white/90 text-sm font-medium bg-black/60 px-4 py-2 rounded-full">
                                    {type === 'product' ? 'Align item in frame' : 'Align date in frame'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    {!error && (
                        <div className="absolute bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-black/80 to-transparent flex justify-around items-center">
                            <button onClick={handleSwitchCamera} className="p-3 bg-white/10 rounded-full text-white" title="Switch Camera">
                                <RefreshCw size={24} />
                            </button>
                            <button
                                onClick={handleCapture}
                                disabled={!isReady}
                                className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-2xl flex items-center justify-center active:scale-95 disabled:opacity-50"
                            >
                                <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10"></div>
                            </button>
                            <div className="w-12"></div>
                        </div>
                    )}
                </>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
