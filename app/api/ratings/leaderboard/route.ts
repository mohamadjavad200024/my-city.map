import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/database'

// GET: دریافت لیست رتبه‌بندی کاربران
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const leaderboard = await getLeaderboard(limit)

    return NextResponse.json({
      success: true,
      data: leaderboard
    })
  } catch (error: any) {
    console.error('Error getting leaderboard:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'خطا در دریافت رتبه‌بندی'
    }, { status: 500 })
  }
}

