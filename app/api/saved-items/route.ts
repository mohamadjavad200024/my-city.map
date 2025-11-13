import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { promisify } from 'util'

// GET: دریافت تمام محتوای ذخیره شده یک کاربر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIdStr = searchParams.get('userId')
    
    if (!userIdStr) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId is required' 
      }, { status: 400 })
    }
    
    const userId = parseInt(userIdStr)
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid userId' 
      }, { status: 400 })
    }
    
    const db = getDatabase()
    const dbAll = promisify(db.all.bind(db)) as (sql: string, ...params: any[]) => Promise<any[]>
    
    // بررسی وجود جدول ratings
    const dbGet = promisify(db.get.bind(db)) as (sql: string, ...params: any[]) => Promise<any>
    let hasRatingsTable = false
    try {
      const tableCheck = await dbGet(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='ratings'
      `)
      hasRatingsTable = !!tableCheck
    } catch (error) {
      // اگر خطا رخ داد، جدول وجود ندارد
      hasRatingsTable = false
    }
    
    // دریافت تمام محتوای ذخیره شده
    let savedItems
    if (hasRatingsTable) {
      savedItems = await dbAll(`
        SELECT 
          si.id,
          si.item_type,
          si.item_id,
          si.created_at,
          CASE 
            WHEN si.item_type = 'product' THEN p.title
            WHEN si.item_type = 'store' THEN a.store_name
            ELSE NULL
          END as title,
          CASE 
            WHEN si.item_type = 'product' THEN p.price
            ELSE NULL
          END as price,
          CASE 
            WHEN si.item_type = 'product' THEN p.images
            ELSE NULL
          END as images,
          CASE 
            WHEN si.item_type = 'product' THEN p.status
            ELSE NULL
          END as status,
          CASE 
            WHEN si.item_type = 'store' THEN a.profile_image
            ELSE NULL
          END as profile_image,
          CASE 
            WHEN si.item_type = 'store' THEN a.store_poster_image
            ELSE NULL
          END as store_poster_image,
          CASE 
            WHEN si.item_type = 'store' THEN COALESCE((
              SELECT AVG(rating) 
              FROM ratings 
              WHERE rated_user_id = a.id
            ), 0)
            ELSE NULL
          END as rating
        FROM saved_items si
        LEFT JOIN products p ON si.item_type = 'product' AND si.item_id = p.id
        LEFT JOIN ads a ON si.item_type = 'store' AND si.item_id = a.id
        WHERE si.user_id = ?
        ORDER BY si.created_at DESC
      `, userId)
    } else {
      savedItems = await dbAll(`
        SELECT 
          si.id,
          si.item_type,
          si.item_id,
          si.created_at,
          CASE 
            WHEN si.item_type = 'product' THEN p.title
            WHEN si.item_type = 'store' THEN a.store_name
            ELSE NULL
          END as title,
          CASE 
            WHEN si.item_type = 'product' THEN p.price
            ELSE NULL
          END as price,
          CASE 
            WHEN si.item_type = 'product' THEN p.images
            ELSE NULL
          END as images,
          CASE 
            WHEN si.item_type = 'product' THEN p.status
            ELSE NULL
          END as status,
          CASE 
            WHEN si.item_type = 'store' THEN a.profile_image
            ELSE NULL
          END as profile_image,
          CASE 
            WHEN si.item_type = 'store' THEN a.store_poster_image
            ELSE NULL
          END as store_poster_image,
          CASE 
            WHEN si.item_type = 'store' THEN 0
            ELSE NULL
          END as rating
        FROM saved_items si
        LEFT JOIN products p ON si.item_type = 'product' AND si.item_id = p.id
        LEFT JOIN ads a ON si.item_type = 'store' AND si.item_id = a.id
        WHERE si.user_id = ?
        ORDER BY si.created_at DESC
      `, userId)
    }
    
    return NextResponse.json({ 
      success: true, 
      data: savedItems || [] 
    })
  } catch (error: any) {
    console.error('Error fetching saved items:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// POST: ذخیره یک محتوا
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId: userIdRaw, itemType, itemId: itemIdRaw } = body
    
    if (!userIdRaw || !itemType || !itemIdRaw) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId, itemType, and itemId are required' 
      }, { status: 400 })
    }
    
    const userId = parseInt(userIdRaw)
    const itemId = parseInt(itemIdRaw)
    
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid userId' 
      }, { status: 400 })
    }
    
    if (isNaN(itemId) || itemId <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid itemId' 
      }, { status: 400 })
    }
    
    if (itemType !== 'product' && itemType !== 'store') {
      return NextResponse.json({ 
        success: false, 
        error: 'itemType must be "product" or "store"' 
      }, { status: 400 })
    }
    
    const db = getDatabase()
    const dbRun = promisify(db.run.bind(db)) as (sql: string, ...params: any[]) => Promise<{ lastID: number; changes: number }>
    
    // بررسی وجود محتوا
    const dbGet = promisify(db.get.bind(db)) as (sql: string, ...params: any[]) => Promise<any>
    
    if (itemType === 'product') {
      const product = await dbGet('SELECT id FROM products WHERE id = ?', itemId)
      if (!product) {
        return NextResponse.json({ 
          success: false, 
          error: 'Product not found' 
        }, { status: 404 })
      }
    } else if (itemType === 'store') {
      const store = await dbGet('SELECT id FROM ads WHERE id = ? AND is_store = 1', itemId)
      if (!store) {
        return NextResponse.json({ 
          success: false, 
          error: 'Store not found' 
        }, { status: 404 })
      }
    }
    
    // ذخیره محتوا (اگر قبلاً ذخیره نشده باشد)
    await dbRun(`
      INSERT OR IGNORE INTO saved_items (user_id, item_type, item_id)
      VALUES (?, ?, ?)
    `, userId, itemType, itemId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item saved successfully' 
    })
  } catch (error: any) {
    console.error('Error saving item:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// DELETE: حذف یک محتوای ذخیره شده
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIdStr = searchParams.get('userId')
    const itemType = searchParams.get('itemType')
    const itemIdStr = searchParams.get('itemId')
    
    if (!userIdStr || !itemType || !itemIdStr) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId, itemType, and itemId are required' 
      }, { status: 400 })
    }
    
    const userId = parseInt(userIdStr)
    const itemId = parseInt(itemIdStr)
    
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid userId' 
      }, { status: 400 })
    }
    
    if (isNaN(itemId) || itemId <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid itemId' 
      }, { status: 400 })
    }
    
    if (itemType !== 'product' && itemType !== 'store') {
      return NextResponse.json({ 
        success: false, 
        error: 'itemType must be "product" or "store"' 
      }, { status: 400 })
    }
    
    const db = getDatabase()
    const dbRun = promisify(db.run.bind(db)) as (sql: string, ...params: any[]) => Promise<{ lastID: number; changes: number }>
    
    await dbRun(`
      DELETE FROM saved_items 
      WHERE user_id = ? AND item_type = ? AND item_id = ?
    `, userId, itemType, itemId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item removed from saved items' 
    })
  } catch (error: any) {
    console.error('Error removing saved item:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

