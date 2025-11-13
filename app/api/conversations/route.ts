import { NextRequest, NextResponse } from 'next/server'
import { getConversationsForUser, getOrCreateConversation, getAllUsersForChat } from '@/lib/database'

// GET - دریافت تمام گفتگوهای یک کاربر
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
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
    
    const conversations = await getConversationsForUser(userIdNum)
    
    return NextResponse.json({ success: true, data: conversations })
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت گفتگوها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد یا دریافت گفتگو بین دو کاربر
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user1Id, user2Id } = body
    
    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربران الزامی است' },
        { status: 400 }
      )
    }
    
    const userId1 = parseInt(user1Id)
    const userId2 = parseInt(user2Id)
    
    if (isNaN(userId1) || isNaN(userId2)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربران نامعتبر است' },
        { status: 400 }
      )
    }
    
    if (userId1 === userId2) {
      return NextResponse.json(
        { success: false, error: 'نمی‌توانید با خودتان گفتگو ایجاد کنید' },
        { status: 400 }
      )
    }
    
    const conversation = await getOrCreateConversation(userId1, userId2)
    
    return NextResponse.json({ success: true, data: conversation })
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در ایجاد گفتگو' },
      { status: 500 }
    )
  }
}

