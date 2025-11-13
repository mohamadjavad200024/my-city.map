import { NextRequest, NextResponse } from 'next/server'
import { getProductsByUserId } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const userId = parseInt(resolvedParams.userId)

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      )
    }

    const products = await getProductsByUserId(userId)

    // تبدیل JSON string به array برای images
    const formattedProducts = products.map((product: any) => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }))

    return NextResponse.json({
      success: true,
      data: formattedProducts
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت محصولات' },
      { status: 500 }
    )
  }
}

