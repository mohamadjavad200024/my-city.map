import { NextRequest, NextResponse } from 'next/server'
import { getAllUsersForChat } from '@/lib/database'

// GET - دریافت تمام کاربران برای شروع گفتگوی جدید
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const currentUserId = searchParams.get('currentUserId')
    
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }
    
    const currentUserIdNum = parseInt(currentUserId)
    if (isNaN(currentUserIdNum)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      )
    }
    
    const users = await getAllUsersForChat(currentUserIdNum)
    
    return NextResponse.json({ success: true, data: users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت کاربران' },
      { status: 500 }
    )
  }
}

