// apps/web/src/components/ui/LogoCropper.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface LogoCropperProps {
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  aspectRatio?: number
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export default function LogoCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1
}: LogoCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(aspectRatio)
  const imgRef = useRef<HTMLImageElement>(null)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    if (selectedAspect) {
      setCrop(centerAspectCrop(width, height, selectedAspect))
    } else {
      setCrop({
        unit: '%',
        x: 10,
        y: 10,
        width: 80,
        height: 80,
      })
    }
  }, [selectedAspect])

  const handleAspectChange = (newAspect: number | undefined) => {
    setSelectedAspect(newAspect)
    if (imgRef.current && newAspect) {
      const { width, height } = imgRef.current
      setCrop(centerAspectCrop(width, height, newAspect))
    }
  }

  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current) return null

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const pixelRatio = window.devicePixelRatio || 1

    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio)
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio)

    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = 'high'

    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    )

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/png',
        1
      )
    })
  }, [completedCrop])

  const handleSave = async () => {
    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImage()
      if (croppedBlob) {
        onCropComplete(croppedBlob)
      }
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const aspectOptions = [
    { value: 1, label: 'Square', short: '1:1' },
    { value: 16 / 9, label: 'Wide', short: '16:9' },
    { value: 4 / 3, label: 'Standard', short: '4:3' },
    { value: undefined, label: 'Free', short: 'Free' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border-default)] flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Crop Your Logo</h2>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                Drag to reposition, use corners to resize
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Aspect Ratio Options */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[var(--text-secondary)] mr-1">Shape:</span>
            {aspectOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => handleAspectChange(option.value)}
                className={`
                  px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200
                  ${selectedAspect === option.value || (option.value === undefined && selectedAspect === undefined)
                    ? 'bg-[var(--brand-primary)] text-white shadow-md shadow-brand-500/25'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }
                `}
              >
                {option.short}
              </button>
            ))}
          </div>
        </div>

        {/* Crop Area - Scrollable */}
        <div className="flex-1 overflow-auto p-6 bg-[var(--bg-primary)] min-h-0">
          <div className="flex items-center justify-center min-h-[250px]">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={selectedAspect}
              className="max-w-full rounded-lg shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-w-full max-h-[40vh] object-contain"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>
        </div>

        {/* Preview Bar */}
        {completedCrop && completedCrop.width > 0 && (
          <div className="flex-shrink-0 px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--text-secondary)]">Preview:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-10 h-10 border-2 border-dashed border-[var(--border-default)] rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden"
                >
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {Math.round(completedCrop.width)}×{Math.round(completedCrop.height)}
                  </span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">
                  Output: {imgRef.current ? Math.round(completedCrop.width * imgRef.current.naturalWidth / imgRef.current.width) : 0}px
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer with Buttons - ALWAYS VISIBLE */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing || !completedCrop || completedCrop.width === 0}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-[var(--brand-primary)] text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-brand-500/25 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Save Logo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}