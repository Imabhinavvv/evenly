import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  Upload,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/Button';
import { scanImageDataForQR } from '../utils/logShare';

export default function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}) {
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Align QR code within frame');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasFoundRef = useRef(false);

  // Stop camera stream safely
  const stopStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Frame scanning loop
  const startScanLoop = useCallback(() => {
    let lastScanTime = 0;
    const scanInterval = 100; // scan every 100ms (~10 fps) to conserve battery

    const tick = (now) => {
      if (hasFoundRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
        if (now - lastScanTime >= scanInterval) {
          lastScanTime = now;

          const width = video.videoWidth;
          const height = video.videoHeight;

          if (width > 0 && height > 0) {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0, width, height);

            try {
              const imageData = ctx.getImageData(0, 0, width, height);
              const decodedLog = scanImageDataForQR(imageData);

              if (decodedLog && !hasFoundRef.current) {
                hasFoundRef.current = true;
                try {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(50);
                  }
                } catch {
                  // ignore
                }
                stopStream();
                onScanSuccess(decodedLog);
                return;
              }
            } catch {
              // Ignore frame read errors
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [stopStream, onScanSuccess]);

  // Request camera and start stream
  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);
    hasFoundRef.current = false;
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsInitializing(false);
        startScanLoop();
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setIsInitializing(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. You can still scan by uploading an image.'
          : 'Could not access device camera.'
      );
    }
  }, [stopStream, startScanLoop]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Handle uploaded image file fallback
  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setStatusMessage('Reading image...');

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = scanImageDataForQR(imageData);

          setIsProcessingFile(false);
          if (decoded) {
            stopStream();
            onScanSuccess(decoded);
          } else {
            setStatusMessage('No valid Evenly QR code found in this image.');
          }
        } catch {
          setIsProcessingFile(false);
          setStatusMessage('Could not read QR code from image.');
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setIsProcessingFile(false);
        setStatusMessage('Failed to load image file.');
      };

      img.src = objectUrl;
    } catch {
      setIsProcessingFile(false);
      setStatusMessage('Error processing image.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-text/50 backdrop-blur-sm transition-opacity"
        onClick={() => {
          stopStream();
          onClose();
        }}
      />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for gallery fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileSelect}
      />

      {/* Dialog */}
      <div className="bg-evenly-surface rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full my-auto relative z-10 flex flex-col border border-brand-border modal-animate-in overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between bg-evenly-bg/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-evenly-coral/20 flex items-center justify-center text-evenly-coral-deep shadow-xs flex-shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-brand-text">
                Scan Evenly QR
              </h2>
              <p className="text-[11px] text-brand-text-secondary">
                Point at another device to receive log
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-evenly-sage transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="p-4 flex flex-col items-center space-y-3">
          <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-brand-border">
            {cameraError ? (
              <div className="p-4 text-center space-y-2 text-brand-text-secondary">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs leading-relaxed text-zinc-300">
                  {cameraError}
                </p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Reticle Guide Corners */}
                <div className="absolute inset-8 pointer-events-none flex items-center justify-center">
                  <div className="relative w-full h-full">
                    {/* Top-left */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-sm" />
                    {/* Top-right */}
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-sm" />
                    {/* Bottom-left */}
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-sm" />
                    {/* Bottom-right */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-sm" />
                  </div>
                </div>

                {isInitializing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-white">
                    <Loader2 className="w-6 h-6 animate-spin text-evenly-coral" />
                    <span className="text-xs font-semibold">Starting camera...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status Label */}
          <p className="text-xs text-brand-text-secondary text-center px-2">
            {statusMessage}
          </p>

          {/* Fallback Action: Select image from device */}
          <div className="w-full pt-1">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="w-full text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isProcessingFile ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-brand-primary" />
              )}
              <span>Upload QR Screenshot</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
