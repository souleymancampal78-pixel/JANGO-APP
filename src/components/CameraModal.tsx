import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { ChatAttachment } from '../types';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (attachment: ChatAttachment) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhotoUrl(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        "Impossible d'accéder à la caméra. Vérifie les autorisations de ton navigateur ou utilise le bouton Trombone 📎 pour importer une image."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhotoUrl(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhotoUrl(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (!capturedPhotoUrl) return;

    const base64Data = capturedPhotoUrl.split(',')[1];
    const attachment: ChatAttachment = {
      name: `photo_exo_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      base64: base64Data,
      previewUrl: capturedPhotoUrl,
    };

    onPhotoCaptured(attachment);
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[var(--modal-bg)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-header)]">
          <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-sm">
            <Camera className="w-4 h-4 text-[#0A84FF] dark:text-[#00D4FF]" />
            <span>Prendre en photo un exercice</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-red-400 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p>{cameraError}</p>
            </div>
          ) : capturedPhotoUrl ? (
            <img
              src={capturedPhotoUrl}
              alt="Photo de l'exercice capturée"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Target framing guides */}
              <div className="absolute inset-8 border-2 border-dashed border-[#00D4FF]/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <span className="text-[11px] font-mono text-[#00D4FF] bg-black/70 px-2 py-0.5 rounded self-start">
                  Cadre l'énoncé de l'exercice ici
                </span>
                <span className="text-[10px] text-white/90 bg-black/70 px-2 py-0.5 rounded self-end">
                  Photo nette et bien éclairée
                </span>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-4 bg-[var(--bg-header)] border-t border-[var(--border-subtle)] flex items-center justify-between">
          {capturedPhotoUrl ? (
            <>
              <button
                onClick={handleRetake}
                className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] border border-[var(--border-card)] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reprendre</span>
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] text-white text-xs font-bold shadow-lg shadow-[#0A84FF]/30 hover:shadow-[#00D4FF]/50 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Utiliser cette photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleCameraFacing}
                className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)] text-xs transition-colors cursor-pointer"
                title="Changer de caméra (avant/arrière)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleSnap}
                disabled={!!cameraError}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] p-1 shadow-[0_0_25px_#0A84FF] hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Déclencher la photo"
              >
                <div className="w-full h-full rounded-full border-2 border-black flex items-center justify-center bg-white">
                  <Camera className="w-6 h-6 text-black" />
                </div>
              </button>

              <div className="w-10" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
