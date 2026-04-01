// apps/web/src/components/ui/LogoUpload.tsx
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import LogoCropper from './LogoCropper'

interface LogoUploadProps {
  companyId: string
  companyName: string
  currentLogoUrl?: string | null
  size?: 'md' | 'lg' | 'xl'
  onLogoUpdated?: (newUrl: string) => void
}

const sizeClasses = {
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}

const imageSizes = {
  md: 48,
  lg: 64,
  xl: 96,
}

export default function LogoUpload({
  companyId,
  companyName,
  currentLogoUrl,
  size = 'lg',
  onLogoUpdated
}: LogoUploadProps) {
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cropperImage, setCropperImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB for original - will be cropped smaller)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setError(null)

    // Convert file to data URL for cropper
    const reader = new FileReader()
    reader.onload = () => {
      setCropperImage(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperImage(null)
    setIsUploading(true)
    setError(null)

    try {
      // Create FormData with cropped image
      const formData = new FormData()
      formData.append('file', croppedBlob, 'logo.png')
      formData.append('companyId', companyId)

      // Upload to our API
      const response = await fetch('/api/companies/logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload logo')
      }

      const { logoUrl: newLogoUrl } = await response.json()
      setLogoUrl(newLogoUrl)
      onLogoUpdated?.(newLogoUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCropCancel = () => {
    setCropperImage(null)
  }

  const initials = companyName
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()

  return (
    <>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={isUploading}
          className={`
            ${sizeClasses[size]} 
            rounded-xl
            overflow-hidden 
            relative 
            group
            transition-all
            duration-200
            ${isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-4 hover:ring-blue-100'}
            focus:outline-none focus:ring-4 focus:ring-blue-200
          `}
          title={logoUrl ? 'Click to change logo' : 'Click to upload logo'}
        >
          {logoUrl ? (
            // Show current logo
            <Image
              src={logoUrl}
              alt={companyName}
              width={imageSizes[size]}
              height={imageSizes[size]}
              className="w-full h-full object-cover"
            />
          ) : (
            // Show placeholder with initials
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-500 font-bold" style={{ fontSize: size === 'xl' ? '2rem' : size === 'lg' ? '1.5rem' : '1rem' }}>
                {initials}
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className={`
            absolute inset-0 
            bg-black/50 
            flex flex-col items-center justify-center
            transition-opacity duration-200
            ${isHovered && !isUploading ? 'opacity-100' : 'opacity-0'}
          `}>
            <svg className="w-5 h-5 text-white mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-white text-xs font-medium">
              {logoUrl ? 'Change' : 'Upload'}
            </span>
          </div>

          {/* Loading spinner */}
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="absolute top-full left-0 mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded whitespace-nowrap z-10">
            {error}
          </div>
        )}

        {/* Upload hint - only show when no logo */}
        {!logoUrl && !isHovered && !isUploading && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
        )}
      </div>

      {/* Cropper Modal */}
      {cropperImage && (
        <LogoCropper
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1} // Default to square, user can change in modal
        />
      )}
    </>
  )
}