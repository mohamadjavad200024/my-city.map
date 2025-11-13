import { NextRequest, NextResponse } from 'next/server'
import { getMessagesForConversation, markMessagesAsRead } from '@/lib/database'

// GET - دریافت پیام‌های یک گفتگو
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const conversationId = parseInt(params.conversationId)
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const markAsRead = searchParams.get('markAsRead') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه گفتگو نامعتبر است' },
        { status: 400 }
      )
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }
    
    const userIdNum = parseInt(userId)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      )
    }
    
    const messages = await getMessagesForConversation(conversationId, userIdNum, limit)
    
    // اگر markAsRead true باشد، پیام‌ها را به عنوان خوانده شده علامت بزن
    if (markAsRead) {
      await markMessagesAsRead(conversationId, userIdNum)
    }
    
    return NextResponse.json({ success: true, data: messages })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت پیام‌ها' },
      { status: 500 }
    )
  }
}

// PUT - علامت‌گذاری پیام‌ها به عنوان خوانده شده
export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const conversationId = parseInt(params.conversationId)
    const body = await request.json()
    const { userId } = body
    
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه گفتگو نامعتبر است' },
        { status: 400 }
      )
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }
    
    const userIdNum = parseInt(userId)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      )
    }
    
    const result = await markMessagesAsRead(conversationId, userIdNum)
    
    return NextResponse.json({
      success: result.success,
      data: { changes: result.changes }
    })
  } catch (error: any) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در علامت‌گذاری پیام‌ها' },
      { status: 500 }
    )
  }
}

