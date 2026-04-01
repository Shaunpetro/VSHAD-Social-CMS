const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false)
    setUploading(true)
    setUploadError(null)
  
    // 🔍 DEBUG LOGS
    console.log('=== UPLOAD DEBUG ===')
    console.log('companyId:', companyId)
    console.log('croppedBlob:', croppedBlob)
    console.log('blob type:', croppedBlob.type)
    console.log('blob size:', croppedBlob.size)
  
    try {
      const formData = new FormData()
      formData.append('file', croppedBlob, 'logo.png')
      formData.append('companyId', companyId)
  
      // 🔍 DEBUG: Log FormData contents
      console.log('FormData entries:')
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value)
      }
  
      const res = await fetch('/api/companies/logo', {
        method: 'POST',
        body: formData,
      })
  
      console.log('Response status:', res.status)
      const responseData = await res.json()
      console.log('Response data:', responseData)
  
      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to upload logo')
      }
  
      updateData({ logoUrl: responseData.logoUrl })
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload logo.')
    } finally {
      setUploading(false)
      setSelectedFile(null)
    }
  }