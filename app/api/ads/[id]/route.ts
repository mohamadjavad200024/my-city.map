import { NextRequest, NextResponse } from 'next/server'
import { getAdById, updateAd, deleteUser, getFollowersCount, getFollowingCount, isFollowing, getUserAverageRating, isStoreNameUnique } from '@/lib/database'

// GET - دریافت اطلاعات کاربر بر اساس ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const id = parseInt(resolvedParams.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID نامعتبر است' },
        { status: 400 }
      )
    }
    
    const ad = await getAdById(id)
    
    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }
    
    // دریافت تعداد دنبال‌کننده‌ها و دنبال‌شونده‌ها
    const followersCount = await getFollowersCount(id)
    const followingCount = await getFollowingCount(id)
    
    // دریافت میانگین امتیاز
    const ratingData = await getUserAverageRating(id)
    
    // بررسی اینکه آیا کاربر جاری این کاربر را دنبال می‌کند
    const { searchParams } = new URL(request.url)
    const currentUserIdParam = searchParams.get('currentUserId')
    let isFollowingUser = false
    if (currentUserIdParam) {
      const currentId = parseInt(currentUserIdParam)
      if (!isNaN(currentId) && currentId !== id) {
        isFollowingUser = await isFollowing(currentId, id)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...ad,
        followers_count: followersCount,
        following_count: followingCount,
        is_following: isFollowingUser,
        rating: ratingData.average
      }
    })
  } catch (error: any) {
    console.error('Error fetching ad:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی اطلاعات کاربر
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const id = parseInt(resolvedParams.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID نامعتبر است' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { 
      username, 
      phone, 
      password, 
      lat, 
      lng, 
      is_store,
      store_name,
      store_description,
      working_hours_sat_wed,
      working_hours_thu,
      instagram_url,
      telegram_url,
      whatsapp_url,
      profile_image,
      store_poster_image
    } = body
    
    // بررسی وجود کاربر
    const existingAd = await getAdById(id)
    if (!existingAd) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }
    
    // اگر lat و lng ارسال شده، فقط آنها را به‌روزرسانی کن
    if (lat !== undefined && lng !== undefined) {
      // تبدیل به عدد برای اطمینان از نوع صحیح
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      
      // بررسی معتبر بودن موقعیت
      if (isNaN(latNum) || isNaN(lngNum)) {
        return NextResponse.json(
          { success: false, error: 'موقعیت نامعتبر است' },
          { status: 400 }
        )
      }
      
      console.log('به‌روزرسانی موقعیت:', { id, lat: latNum, lng: lngNum })
      
      const result = await updateAd(id, {
        lat: latNum,
        lng: lngNum
      })
      
      if (!result.success) {
        console.error('خطا در به‌روزرسانی موقعیت:', result.error)
        return NextResponse.json(
          { success: false, error: result.error || 'خطا در به‌روزرسانی لوکیشن' },
          { status: 500 }
        )
      }
      
      console.log('موقعیت با موفقیت به‌روزرسانی شد:', { id, lat: latNum, lng: lngNum })
      
      return NextResponse.json({
        success: true,
        message: 'لوکیشن با موفقیت به‌روزرسانی شد',
        data: { lat: latNum, lng: lngNum }
      })
    }
    
    // اعتبارسنجی داده‌ها برای به‌روزرسانی اطلاعات کاربری
    if (!username || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'تمام فیلدها الزامی هستند' },
        { status: 400 }
      )
    }
    
    // اعتبارسنجی شماره تماس
    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'شماره تماس باید با 09 شروع شود و 11 رقم باشد' },
        { status: 400 }
      )
    }
    
    // اعتبارسنجی رمز
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'رمز باید حداقل 6 کاراکتر باشد' },
        { status: 400 }
      )
    }
    
    // به‌روزرسانی اطلاعات
    const updateData: {
      username: string
      phone: string
      password: string
      is_store?: boolean
      store_name?: string
      store_description?: string
      working_hours_sat_wed?: string
      working_hours_thu?: string
      instagram_url?: string
      telegram_url?: string
      whatsapp_url?: string
      profile_image?: string
      store_poster_image?: string
    } = {
      username: username.trim(),
      phone: phone.trim(),
      password: password.trim()
    }
    
    // اگر is_store ارسال شده، اضافه کن
    if (is_store !== undefined) {
      updateData.is_store = Boolean(is_store)
    }
    
    // اضافه کردن فیلدهای فروشگاه اگر ارسال شده باشند
    if (store_name !== undefined) {
      const trimmedStoreName = store_name.trim() || null
      
      // اگر نام فروشگاه خالی نیست و is_store فعال است، چک یکتایی انجام بده
      if (trimmedStoreName && (is_store === true || is_store === 1 || existingAd.is_store === 1 || existingAd.is_store === true)) {
        const isUnique = await isStoreNameUnique(trimmedStoreName, id)
        if (!isUnique) {
          return NextResponse.json(
            { success: false, error: 'این نام فروشگاه قبلاً استفاده شده است. لطفاً نام دیگری انتخاب کنید.' },
            { status: 400 }
          )
        }
      }
      
      updateData.store_name = trimmedStoreName
    }
    if (store_description !== undefined) {
      updateData.store_description = store_description.trim() || null
    }
    if (working_hours_sat_wed !== undefined) {
      updateData.working_hours_sat_wed = working_hours_sat_wed.trim() || null
    }
    if (working_hours_thu !== undefined) {
      updateData.working_hours_thu = working_hours_thu.trim() || null
    }
    if (instagram_url !== undefined) {
      updateData.instagram_url = instagram_url.trim() || null
    }
    if (telegram_url !== undefined) {
      updateData.telegram_url = telegram_url.trim() || null
    }
    if (whatsapp_url !== undefined) {
      updateData.whatsapp_url = whatsapp_url.trim() || null
    }
    if (profile_image !== undefined) {
      updateData.profile_image = profile_image || null
    }
    if (store_poster_image !== undefined) {
      updateData.store_poster_image = store_poster_image || null
    }
    
    const result = await updateAd(id, updateData)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'خطا در به‌روزرسانی اطلاعات' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'اطلاعات با موفقیت به‌روزرسانی شد'
    })
  } catch (error: any) {
    console.error('Error updating ad:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در به‌روزرسانی اطلاعات' },
      { status: 500 }
    )
  }
}

// DELETE - حذف کاربر و تمام اطلاعات مرتبط
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const id = parseInt(resolvedParams.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID نامعتبر است' },
        { status: 400 }
      )
    }
    
    // بررسی وجود کاربر
    const existingAd = await getAdById(id)
    if (!existingAd) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }
    
    // حذف کاربر و تمام اطلاعات مرتبط (شامل محصولات و عکس‌ها)
    const result = await deleteUser(id)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'خطا در حذف حساب' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'حساب کاربری و تمام اطلاعات مرتبط با موفقیت حذف شد'
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در حذف حساب' },
      { status: 500 }
    )
  }
}

