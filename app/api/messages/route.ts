import { NextRequest, NextResponse } from 'next/server'
import { sendMessage, getOrCreateConversation } from '@/lib/database'

// POST - ارسال پیام
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, senderId, receiverId, text, user1Id, user2Id } = body
    
    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'متن پیام الزامی است' },
        { status: 400 }
      )
    }
    
    let finalConversationId = conversationId
    
    // اگر conversationId داده نشده، از user1Id و user2Id استفاده کن
    if (!finalConversationId && user1Id && user2Id) {
      const conversation = await getOrCreateConversation(
        parseInt(user1Id),
        parseInt(user2Id)
      )
      finalConversationId = conversation.id
    }
    
    if (!finalConversationId) {
      return NextResponse.json(
        { success: false, error: 'شناسه گفتگو الزامی است' },
        { status: 400 }
      )
    }
    
    if (!senderId || !receiverId) {
      return NextResponse.json(
        { success: false, error: 'شناسه فرستنده و گیرنده الزامی است' },
        { status: 400 }
      )
    }
    
    const senderIdNum = parseInt(senderId)
    const receiverIdNum = parseInt(receiverId)
    const conversationIdNum = parseInt(finalConversationId)
    
    if (isNaN(senderIdNum) || isNaN(receiverIdNum) || isNaN(conversationIdNum)) {
      return NextResponse.json(
        { success: false, error: 'شناسه‌ها نامعتبر هستند' },
        { status: 400 }
      )
    }
    
    const result = await sendMessage(
      conversationIdNum,
      senderIdNum,
      receiverIdNum,
      text.trim()
    )
    
    return NextResponse.json({
      success: true,
      data: result.message
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در ارسال پیام' },
      { status: 500 }
    )
  }
}

