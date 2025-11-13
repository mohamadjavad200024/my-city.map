import { NextRequest, NextResponse } from 'next/server'
import { isStoreNameUnique } from '@/lib/database'

// GET - بررسی یکتایی نام فروشگاه
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeName = searchParams.get('storeName')
    const excludeUserId = searchParams.get('excludeUserId')
    
    if (!storeName || !storeName.trim()) {
      return NextResponse.json(
        { success: true, isUnique: true, message: 'نام خالی یکتا محسوب می‌شود' },
        { status: 200 }
      )
    }
    
    const userId = excludeUserId ? parseInt(excludeUserId) : undefined
    if (excludeUserId && isNaN(userId as number)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      )
    }
    
    const isUnique = await isStoreNameUnique(storeName.trim(), userId)
    
    return NextResponse.json({
      success: true,
      isUnique,
      message: isUnique 
        ? 'این نام فروشگاه در دسترس است' 
        : 'این نام فروشگاه قبلاً استفاده شده است'
    })
  } catch (error: any) {
    console.error('Error checking store name:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در بررسی نام فروشگاه' },
      { status: 500 }
    )
  }
}

