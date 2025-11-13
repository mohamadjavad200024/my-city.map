import { NextRequest, NextResponse } from 'next/server'
import { getProductById, updateProduct } from '@/lib/database'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET - دریافت محصول بر اساس ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const id = parseInt(resolvedParams.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID نامعتبر است' },
        { status: 400 }
      )
    }
    
    const product = await getProductById(id)
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      )
    }
    
    // تبدیل JSON string به array برای images
    let imagesArray: string[] = []
    if (product.images) {
      try {
        if (typeof product.images === 'string') {
          imagesArray = JSON.parse(product.images)
        } else if (Array.isArray(product.images)) {
          imagesArray = product.images
        }
      } catch (error) {
        console.error('Error parsing images:', error)
        imagesArray = []
      }
    }
    
    const formattedProduct = {
      ...product,
      images: imagesArray
    }
    
    return NextResponse.json({ success: true, data: formattedProduct })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت محصول' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی محصول
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const id = parseInt(resolvedParams.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID نامعتبر است' },
        { status: 400 }
      )
    }
    
    // بررسی وجود محصول
    const existingProduct = await getProductById(id)
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      )
    }
    
    const formData = await request.formData()
    const updateData: {
      title?: string
      price?: number
      description?: string
      status?: string
      images?: string
    } = {}
    
    // پردازش فیلدهای متنی
    if (formData.has('title')) {
      const title = formData.get('title') as string
      if (title && title.trim()) {
        updateData.title = title.trim()
      }
    }
    
    if (formData.has('price')) {
      const price = parseFloat(formData.get('price') as string)
      if (!isNaN(price) && price > 0) {
        updateData.price = price
      }
    }
    
    if (formData.has('description')) {
      const description = formData.get('description') as string
      if (description && description.trim()) {
        updateData.description = description.trim()
      }
    }
    
    if (formData.has('status')) {
      const status = formData.get('status') as string
      if (status) {
        updateData.status = status
      }
    }
    
    // پردازش تصاویر
    let existingImages: string[] = []
    if (existingProduct.images) {
      try {
        if (typeof existingProduct.images === 'string') {
          existingImages = JSON.parse(existingProduct.images)
        } else if (Array.isArray(existingProduct.images)) {
          existingImages = existingProduct.images
        }
      } catch (error) {
        console.error('Error parsing existing images:', error)
        existingImages = []
      }
    }

    if (formData.has('images')) {
      const imagesJson = formData.get('images') as string
      if (imagesJson) {
        // اگر تصاویر به صورت JSON string ارسال شده باشند
        updateData.images = imagesJson
      }
    } else {
      // اگر تصاویر جدید به صورت فایل ارسال شده باشند
      const imagePaths: string[] = []
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products')
      
      // ایجاد پوشه uploads اگر وجود نداشته باشد
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }
      
      // پردازش تصاویر جدید
      let imageIndex = 0
      while (formData.has(`image_${imageIndex}`)) {
        const imageFile = formData.get(`image_${imageIndex}`) as File
        
        if (imageFile) {
          const bytes = await imageFile.arrayBuffer()
          const buffer = Buffer.from(bytes)
          
          // نام فایل منحصر به فرد
          const timestamp = Date.now()
          const filename = `${existingProduct.user_id}_${timestamp}_${imageIndex}.${imageFile.name.split('.').pop()}`
          const filepath = join(uploadsDir, filename)
          
          await writeFile(filepath, buffer)
          imagePaths.push(`/uploads/products/${filename}`)
        }
        
        imageIndex++
      }
      
      // ترکیب تصاویر موجود و جدید (مانند فرم ایجاد آگهی)
      if (imagePaths.length > 0) {
        let finalImages = [...existingImages] // کپی از آرایه
        
        // اگر تصاویری برای حذف وجود دارد، ابتدا آنها را حذف کن
        if (formData.has('deleteImages')) {
          const deleteImagesJson = formData.get('deleteImages') as string
          if (deleteImagesJson) {
            try {
              const imagesToDelete = JSON.parse(deleteImagesJson) as string[]
              
              // منطق ساده: حذف تصاویر قدیمی و اضافه تصاویر جدید
              // 1. حذف تصاویر قدیمی
              finalImages = finalImages.filter((img: string) => !imagesToDelete.includes(img))
              
              // 2. اگر تعداد حذف شده = تعداد جدید، جایگزین در همان موقعیت
              if (imagesToDelete.length === imagePaths.length && imagesToDelete.length > 0) {
                // پیدا کردن index هر تصویر حذف شده در originalImages
                const deletedIndices: number[] = []
                imagesToDelete.forEach(imgToDelete => {
                  const originalIndex = existingImages.findIndex(img => img === imgToDelete)
                  if (originalIndex >= 0) {
                    deletedIndices.push(originalIndex)
                  }
                })
                
                // مرتب‌سازی بر اساس index
                deletedIndices.sort((a, b) => a - b)
                
                // جایگزینی در همان موقعیت (از انتها به ابتدا تا index ها تغییر نکنند)
                for (let i = deletedIndices.length - 1; i >= 0; i--) {
                  const originalIndex = deletedIndices[i]
                  const newImageIndex = i
                  if (newImageIndex < imagePaths.length) {
                    // محاسبه index فعلی بعد از حذف
                    let currentIndex = originalIndex
                    // شمارش تصاویری که قبل از originalIndex حذف شده‌اند
                    for (let j = 0; j < i; j++) {
                      if (deletedIndices[j] < originalIndex) {
                        currentIndex--
                      }
                    }
                    // درج تصویر جدید در همان موقعیت
                    if (currentIndex >= 0 && currentIndex <= finalImages.length) {
                      finalImages.splice(currentIndex, 0, imagePaths[newImageIndex])
                    } else {
                      finalImages.push(imagePaths[newImageIndex])
                    }
                  }
                }
              } else {
                // اضافه تصاویر جدید به انتها
                finalImages.push(...imagePaths)
              }
            } catch (err) {
              console.error('Error parsing deleteImages:', err)
              // در صورت خطا، فقط اضافه کن
              finalImages.push(...imagePaths)
            }
          } else {
            // اگر deleteImages خالی است، فقط اضافه کن
            finalImages.push(...imagePaths)
          }
        } else {
          // اگر تصویری برای حذف نیست، فقط اضافه کن
          finalImages.push(...imagePaths)
        }
        
        // محدودیت 4 تصویر
        const limitedImages = finalImages.slice(0, 4)
        updateData.images = JSON.stringify(limitedImages)
      }
    }
    
    // اگر تصاویری برای حذف مشخص شده باشند (و تصویر جدیدی اضافه نشده باشد)
    if (formData.has('deleteImages') && !updateData.images) {
      const deleteImagesJson = formData.get('deleteImages') as string
      if (deleteImagesJson) {
        try {
          const imagesToDelete = JSON.parse(deleteImagesJson) as string[]
          const remainingImages = existingImages.filter((img: string) => !imagesToDelete.includes(img))
          
          // حذف فایل‌های تصویر از سرور
          for (const imgPath of imagesToDelete) {
            const filePath = join(process.cwd(), 'public', imgPath)
            if (existsSync(filePath)) {
              try {
                await unlink(filePath)
              } catch (err) {
                console.error('Error deleting image file:', err)
              }
            }
          }
          
          updateData.images = JSON.stringify(remainingImages)
        } catch (err) {
          console.error('Error parsing deleteImages:', err)
        }
      }
    } else if (formData.has('deleteImages') && updateData.images) {
      // اگر هم حذف و هم اضافه وجود دارد، فایل‌های حذف شده را از سرور حذف کن
      const deleteImagesJson = formData.get('deleteImages') as string
      if (deleteImagesJson) {
        try {
          const imagesToDelete = JSON.parse(deleteImagesJson) as string[]
          // حذف فایل‌های تصویر از سرور
          for (const imgPath of imagesToDelete) {
            const filePath = join(process.cwd(), 'public', imgPath)
            if (existsSync(filePath)) {
              try {
                await unlink(filePath)
              } catch (err) {
                console.error('Error deleting image file:', err)
              }
            }
          }
        } catch (err) {
          console.error('Error parsing deleteImages:', err)
        }
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'هیچ فیلدی برای به‌روزرسانی مشخص نشده است' },
        { status: 400 }
      )
    }
    
    // به‌روزرسانی محصول
    const result = await updateProduct(id, updateData)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'خطا در به‌روزرسانی محصول' },
        { status: 500 }
      )
    }
    
    // دریافت محصول به‌روزرسانی شده
    const updatedProduct = await getProductById(id)
    let imagesArray: string[] = []
    if (updatedProduct.images) {
      try {
        if (typeof updatedProduct.images === 'string') {
          imagesArray = JSON.parse(updatedProduct.images)
        } else if (Array.isArray(updatedProduct.images)) {
          imagesArray = updatedProduct.images
        }
      } catch (error) {
        console.error('Error parsing images:', error)
        imagesArray = []
      }
    }
    
    const formattedProduct = {
      ...updatedProduct,
      images: imagesArray
    }
    
    return NextResponse.json({
      success: true,
      message: 'محصول با موفقیت به‌روزرسانی شد',
      data: formattedProduct
    })
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در به‌روزرسانی محصول' },
      { status: 500 }
    )
  }
}

