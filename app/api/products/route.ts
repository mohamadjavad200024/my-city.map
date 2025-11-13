import { NextRequest, NextResponse } from 'next/server'
import { insertProduct, getAllProducts } from '@/lib/database'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET - دریافت تمام محصولات
export async function GET() {
  try {
    const products = await getAllProducts()
    // تبدیل images از JSON string به array
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }))
    return NextResponse.json({ success: true, data: formattedProducts })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت محصولات' },
      { status: 500 }
    )
  }
}

// POST - ایجاد محصول جدید
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = parseInt(formData.get('userId') as string)
    const title = formData.get('title') as string
    const price = parseFloat(formData.get('price') as string)
    const description = formData.get('description') as string
    const status = formData.get('status') as string
    const latStr = formData.get('lat') as string | null
    const lngStr = formData.get('lng') as string | null
    const lat = latStr ? parseFloat(latStr) : undefined
    const lng = lngStr ? parseFloat(lngStr) : undefined
    
    // اعتبارسنجی داده‌ها
    if (!userId || !title || !price || !description || !status) {
      return NextResponse.json(
        { success: false, error: 'تمام فیلدها الزامی هستند' },
        { status: 400 }
      )
    }
    
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'قیمت باید یک عدد معتبر باشد' },
        { status: 400 }
      )
    }
    
    // ذخیره تصاویر
    const imagePaths: string[] = []
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products')
    
    // ایجاد پوشه uploads اگر وجود نداشته باشد
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    // پردازش تصاویر
    let imageIndex = 0
    while (formData.has(`image_${imageIndex}`)) {
      const imageFile = formData.get(`image_${imageIndex}`) as File
      
      if (imageFile) {
        const bytes = await imageFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // نام فایل منحصر به فرد
        const timestamp = Date.now()
        const filename = `${userId}_${timestamp}_${imageIndex}.${imageFile.name.split('.').pop()}`
        const filepath = join(uploadsDir, filename)
        
        await writeFile(filepath, buffer)
        imagePaths.push(`/uploads/products/${filename}`)
      }
      
      imageIndex++
    }
    
    if (imagePaths.length === 0) {
      return NextResponse.json(
        { success: false, error: 'حداقل یک تصویر الزامی است' },
        { status: 400 }
      )
    }
    
    // ذخیره در دیتابیس (اگر lat/lng داده نشده باشد، insertProduct از لوکیشن کاربر در جدول ads استفاده می‌کند)
    const result = await insertProduct({
      userId,
      title: title.trim(),
      price,
      description: description.trim(),
      status,
      images: JSON.stringify(imagePaths),
      lat,
      lng
    })
    
    return NextResponse.json({
      success: true,
      message: 'آگهی با موفقیت ثبت شد',
      data: { id: result.id }
    })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در ثبت آگهی' },
      { status: 500 }
    )
  }
}

