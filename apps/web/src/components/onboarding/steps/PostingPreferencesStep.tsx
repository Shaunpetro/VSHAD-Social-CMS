// apps/web/src/components/onboarding/steps/LogoBasicsStep.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, X, Building2, Globe, FileText, Loader2 } from 'lucide-react'
import LogoCropper from '@/components/ui/LogoCropper'

interface LogoBasicsStepProps {
  data: {
    logoUrl: string
    description: string
  }
  updateData: (updates: { logoUrl?: string; description?: string }) => void
  companyName: string
  companyWebsite: string | null
}

export default function LogoBasicsStep({ 
  data, 
  updateData, 
  companyName,
  companyWebsite 
}: LogoBasicsStepProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be less than 10MB')
      return
    }

    setUploadError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFile(reader.result as string)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false)
    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', croppedBlob, 'logo.png')

      const res = await fetch('/api/companies/logo', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to upload logo')
      }

      const { url } = await res.json()
      updateData({ logoUrl: url })
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload logo. Please try again.')
    } finally {
      setUploading(false)
      setSelectedFile(null)
    }
  }

  const handleRemoveLogo = () => {
    updateData({ logoUrl: '' })
  }

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Let's set up {companyName}
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">
          Add your logo and company description to personalize your brand
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Logo Upload */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Company Logo <span className="text-[var(--text-tertiary)]">(optional)</span>
          </label>
          
          <div className="flex flex-col items-center">
            {/* Logo Preview */}
            <div className="relative group">
              {data.logoUrl ? (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-[var(--border-default)] shadow-lg">
                  <Image
                    src={data.logoUrl}
                    alt={companyName}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-3xl">
                    {getInitials(companyName)}
                  </span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <label className="mt-4 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <div className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${uploading 
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-default)]'
                }
              `}>
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    {data.logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </>
                )}
              </div>
            </label>

            {uploadError && (
              <p className="text-sm text-red-500 mt-2">{uploadError}</p>
            )}

            <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
              PNG, JPG or GIF • Max 10MB
            </p>
          </div>
        </div>

        {/* Right: Company Info */}
        <div className="space-y-4">
          {/* Company Name (Read Only) */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Company Name
            </label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <Building2 size={18} className="text-[var(--text-tertiary)]" />
              <span className="text-[var(--text-primary)] font-medium">{companyName}</span>
            </div>
          </div>

          {/* Website (Read Only) */}
          {companyWebsite && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Website
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <Globe size={18} className="text-[var(--text-tertiary)]" />
                <a 
                  href={companyWebsite} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-600 dark:text-brand-400 hover:underline truncate"
                >
                  {companyWebsite.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Company Description <span className="text-[var(--text-tertiary)]">(optional)</span>
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-4 top-3.5 text-[var(--text-tertiary)]" />
              <textarea
                value={data.description}
                onChange={(e) => updateData({ description: e.target.value })}
                placeholder="Tell us about your company in a few sentences..."
                rows={4}
                maxLength={500}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
              />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5 text-right">
              {data.description.length}/500
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
        <div className="flex gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Why add a logo?
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Your logo helps personalize the experience and will be used in previews 
              of your generated content. You can always add or change it later.
            </p>
          </div>
        </div>
      </div>

      {/* Logo Cropper Modal */}
      {showCropper && selectedFile && (
        <LogoCropper
          imageSrc={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setSelectedFile(null)
          }}
          aspectRatio={1}
        />
      )}
    </div>
  )
}