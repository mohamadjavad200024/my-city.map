import { NextRequest, NextResponse } from 'next/server'
import { addOrUpdateRating, getUserAverageRating, getUserRating } from '@/lib/database'

// POST: ثبت یا به‌روزرسانی امتیاز
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ratedUserId, raterUserId, rating } = body

    if (!ratedUserId || !raterUserId || !rating) {
      return NextResponse.json({
        success: false,
        error: 'ratedUserId, raterUserId و rating الزامی هستند'
      }, { status: 400 })
    }

    if (ratedUserId === raterUserId) {
      return NextResponse.json({
        success: false,
        error: 'شما نمی‌توانید به خودتان امتیاز دهید'
      }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        error: 'امتیاز باید بین 1 تا 5 باشد'
      }, { status: 400 })
    }

    const result = await addOrUpdateRating(
      parseInt(ratedUserId),
      parseInt(raterUserId),
      parseInt(rating)
    )

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'خطا در ثبت امتیاز'
      }, { status: 500 })
    }

    // دریافت میانگین امتیاز به‌روز شده
    const avgRating = await getUserAverageRating(parseInt(ratedUserId))

    return NextResponse.json({
      success: true,
      data: {
        averageRating: avgRating.average,
        ratingCount: avgRating.count
      }
    })
  } catch (error: any) {
    console.error('Error adding rating:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'خطا در ثبت امتیاز'
    }, { status: 500 })
  }
}

// GET: دریافت امتیاز یک کاربر یا میانگین امتیاز
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ratedUserId = searchParams.get('ratedUserId')
    const raterUserId = searchParams.get('raterUserId')

    if (!ratedUserId) {
      return NextResponse.json({
        success: false,
        error: 'ratedUserId الزامی است'
      }, { status: 400 })
    }

    // اگر raterUserId هم داده شده باشد، امتیاز خاص آن کاربر را برمی‌گرداند
    if (raterUserId) {
      const rating = await getUserRating(
        parseInt(ratedUserId),
        parseInt(raterUserId)
      )
      return NextResponse.json({
        success: true,
        data: { rating }
      })
    }

    // در غیر این صورت، میانگین امتیاز را برمی‌گرداند
    const avgRating = await getUserAverageRating(parseInt(ratedUserId))
    return NextResponse.json({
      success: true,
      data: avgRating
    })
  } catch (error: any) {
    console.error('Error getting rating:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'خطا در دریافت امتیاز'
    }, { status: 500 })
  }
}

