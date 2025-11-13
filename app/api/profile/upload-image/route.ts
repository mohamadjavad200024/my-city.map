import { NextRequest, NextResponse } from 'next/server'
import { updateAd, getAdById } from '@/lib/database'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// POST - آپلود تصویر پروفایل
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = parseInt(formData.get('userId') as string)
    const imageFile = formData.get('image') as File
    const imageType = (formData.get('type') as string) || 'profile' // 'profile' or 'poster'
    
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر معتبر نیست' },
        { status: 400 }
      )
    }
    
    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'فایل تصویر ارسال نشده است' },
        { status: 400 }
      )
    }
    
    // بررسی وجود کاربر
    const existingUser = await getAdById(userId)
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }
    
    // بررسی نوع فایل
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { success: false, error: 'نوع فایل معتبر نیست. فقط JPEG, PNG و WebP مجاز است' },
        { status: 400 }
      )
    }
    
    // بررسی اندازه فایل (حداکثر 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'حجم فایل باید کمتر از 5 مگابایت باشد' },
        { status: 400 }
      )
    }
    
    // تعیین مسیر و نام فایل بر اساس نوع تصویر
    const uploadsDir = join(process.cwd(), 'public', 'uploads', imageType === 'poster' ? 'posters' : 'profiles')
    const imageField = imageType === 'poster' ? 'store_poster_image' : 'profile_image'
    const oldImagePath = existingUser[imageField as keyof typeof existingUser] as string | undefined
    
    // حذف تصویر قبلی اگر وجود داشته باشد
    if (oldImagePath) {
      try {
        const oldImageFullPath = join(process.cwd(), 'public', oldImagePath)
        if (existsSync(oldImageFullPath)) {
          await unlink(oldImageFullPath)
        }
      } catch (error) {
        console.error(`Error deleting old ${imageType} image:`, error)
        // ادامه می‌دهیم حتی اگر حذف تصویر قبلی با خطا مواجه شود
      }
    }
    
    // ایجاد پوشه uploads اگر وجود نداشته باشد
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // نام فایل منحصر به فرد
    const timestamp = Date.now()
    const fileExtension = imageFile.name.split('.').pop() || 'jpg'
    const filename = `${imageType}_${userId}_${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)
    
    await writeFile(filepath, buffer)
    const imagePath = `/uploads/${imageType === 'poster' ? 'posters' : 'profiles'}/${filename}`
    
    // به‌روزرسانی مسیر تصویر در دیتابیس
    const updateData: any = {}
    updateData[imageField] = imagePath
    const result = await updateAd(userId, updateData)
    
    if (!result.success) {
      // اگر به‌روزرسانی دیتابیس ناموفق بود، فایل را حذف کن
      try {
        await unlink(filepath)
      } catch (error) {
        console.error('Error deleting uploaded file:', error)
      }
      
      return NextResponse.json(
        { success: false, error: 'خطا در ذخیره اطلاعات تصویر' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `تصویر ${imageType === 'poster' ? 'پوستر' : 'پروفایل'} با موفقیت آپلود شد`,
      data: { [imageField]: imagePath }
    })
  } catch (error: any) {
    console.error('Error uploading profile image:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در آپلود تصویر' },
      { status: 500 }
    )
  }
}

