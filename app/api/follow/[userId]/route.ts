import { NextRequest, NextResponse } from 'next/server'
import { followUser, unfollowUser, getFollowersCount, getFollowingCount } from '@/lib/database'

// POST - دنبال کردن یک کاربر
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const followingId = parseInt(resolvedParams.userId)
    
    if (isNaN(followingId)) {
      return NextResponse.json(
        { success: false, error: 'ID کاربر نامعتبر است' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { followerId } = body
    
    if (!followerId || isNaN(followerId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر دنبال‌کننده نامعتبر است' },
        { status: 400 }
      )
    }
    
    const result = await followUser(followerId, followingId)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'خطا در دنبال کردن کاربر' },
        { status: 400 }
      )
    }
    
    // دریافت تعداد جدید دنبال‌کننده‌ها
    const followersCount = await getFollowersCount(followingId)
    
    return NextResponse.json({
      success: true,
      message: 'کاربر با موفقیت دنبال شد',
      data: { followers_count: followersCount }
    })
  } catch (error: any) {
    console.error('Error following user:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دنبال کردن کاربر' },
      { status: 500 }
    )
  }
}

// DELETE - آنفالو کردن یک کاربر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const followingId = parseInt(resolvedParams.userId)
    
    if (isNaN(followingId)) {
      return NextResponse.json(
        { success: false, error: 'ID کاربر نامعتبر است' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { followerId } = body
    
    if (!followerId || isNaN(followerId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر دنبال‌کننده نامعتبر است' },
        { status: 400 }
      )
    }
    
    const result = await unfollowUser(followerId, followingId)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'خطا در آنفالو کردن کاربر' },
        { status: 400 }
      )
    }
    
    // دریافت تعداد جدید دنبال‌کننده‌ها
    const followersCount = await getFollowersCount(followingId)
    
    return NextResponse.json({
      success: true,
      message: 'کاربر با موفقیت آنفالو شد',
      data: { followers_count: followersCount }
    })
  } catch (error: any) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در آنفالو کردن کاربر' },
      { status: 500 }
    )
  }
}

