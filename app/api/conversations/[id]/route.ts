import { NextRequest, NextResponse } from 'next/server'
import { getConversationsForUser } from '@/lib/database'
import { getDatabase } from '@/lib/database'
import { promisify } from 'util'

// GET - دریافت جزئیات یک گفتگو
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = parseInt(params.id)
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
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
    
    // Ensure database is initialized by calling getConversationsForUser
    await getConversationsForUser(userIdNum)
    
    const database = getDatabase()
    const dbGet = promisify(database.get.bind(database)) as (sql: string, ...params: any[]) => Promise<any>
    
    // بررسی اینکه کاربر در این گفتگو شرکت دارد
    const conversation = await dbGet(
      'SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      conversationId,
      userIdNum,
      userIdNum
    )
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'گفتگو یافت نشد یا شما دسترسی ندارید' },
        { status: 404 }
      )
    }
    
    // دریافت اطلاعات کاربر دیگر
    const otherUserId = conversation.user1_id === userIdNum ? conversation.user2_id : conversation.user1_id
    const otherUser = await dbGet('SELECT id, username, phone FROM ads WHERE id = ?', otherUserId)
    
    return NextResponse.json({
      success: true,
      data: {
        ...conversation,
        other_user: otherUser
      }
    })
  } catch (error: any) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت گفتگو' },
      { status: 500 }
    )
  }
}

