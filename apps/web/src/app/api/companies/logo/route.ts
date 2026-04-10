// apps/web/src/app/api/companies/logo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { put, del } from '@vercel/blob'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const companyId = formData.get('companyId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'No company ID provided' },
        { status: 400 }
      )
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Get file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
    
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: jpg, jpeg, png, gif, webp, svg' },
        { status: 400 }
      )
    }

    // Create unique filename
    const filename = `logos/${companyId}-${randomUUID()}.${ext}`

    // Delete old logo from Blob if exists
    if (company.logoUrl && company.logoUrl.includes('vercel-storage.com')) {
      try {
        await del(company.logoUrl)
      } catch (deleteError) {
        // Ignore delete errors - old file might not exist
        console.log('Could not delete old logo:', deleteError)
      }
    }

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false, // We already added UUID
    })

    const logoUrl = blob.url

    // Update company in database
    await prisma.company.update({
      where: { id: companyId },
      data: { logoUrl }
    })

    return NextResponse.json({ logoUrl, url: logoUrl })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo. Please try again.' },
      { status: 500 }
    )
  }
}

// Optional: DELETE endpoint to remove logo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'No company ID provided' },
        { status: 400 }
      )
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Delete from Blob if exists
    if (company.logoUrl && company.logoUrl.includes('vercel-storage.com')) {
      try {
        await del(company.logoUrl)
      } catch (deleteError) {
        console.log('Could not delete logo from blob:', deleteError)
      }
    }

    // Update company in database
    await prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting logo:', error)
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    )
  }
}