import { NextRequest, NextResponse } from 'next/server'
import { insertAd, getAllAds, findUserByPhoneOrUsername, findUserByCredentials, findUserByPhone, findUserByUsername } from '@/lib/database'

// GET - دریافت تمام آگهی‌ها
export async function GET() {
  try {
    const ads = await getAllAds()
    return NextResponse.json({ success: true, data: ads })
  } catch (error: any) {
    console.error('Error fetching ads:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - ایجاد آگهی جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, phone, password, lat, lng, forceRegister } = body
    
    // اعتبارسنجی داده‌های الزامی
    // اگر در حالت لاگین هستیم (forceRegister = false)، نام کاربری الزامی نیست
    if (forceRegister === false) {
      // در حالت لاگین فقط شماره تماس و پسورد الزامی است
      if (!phone || !password) {
        return NextResponse.json(
          { success: false, error: 'شماره تماس و رمز عبور الزامی هستند' },
          { status: 400 }
        )
      }
    } else {
      // در حالت ثبت‌نام، نام کاربری، شماره تماس و پسورد الزامی است
      if (!username || !phone || !password) {
        return NextResponse.json(
          { success: false, error: 'نام کاربری، شماره تماس و رمز عبور الزامی هستند' },
          { status: 400 }
        )
      }
    }
    
    // اعتبارسنجی شماره تماس - فرمت
    const trimmedPhone = phone.trim()
    if (!trimmedPhone) {
      return NextResponse.json(
        { success: false, error: 'شماره تماس الزامی است' },
        { status: 400 }
      )
    }
    
    // اعتبارسنجی فرمت شماره تماس
    if (!/^09\d{9}$/.test(trimmedPhone)) {
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
    
    // اعتبارسنجی فقط بر اساس شماره تماس - هر شماره تماس متعلق به یک نفر است
    // بررسی اینکه آیا کاربری با این phone وجود دارد یا نه
    const existingUserByPhone = await findUserByPhone(trimmedPhone)
    
    if (existingUserByPhone) {
      // اگر forceRegister = true باشد، نباید ثبت‌نام جدید انجام شود
      if (forceRegister === true) {
        return NextResponse.json(
          { success: false, error: 'این شماره تماس قبلاً ثبت شده است. لطفاً وارد شوید.' },
          { status: 400 }
        )
      }
      
      // اگر forceRegister = false یا undefined باشد (یعنی حالت لاگین)، بررسی کن که password درست است یا نه
      if (existingUserByPhone.password === password.trim()) {
        // اگر password درست است، همان userId را برگردان (لاگین موفق)
        // اعتبارسنجی فقط بر اساس شماره تماس است - موقعیت نقشی ندارد
        return NextResponse.json({
          success: true,
          message: 'ورود با موفقیت انجام شد',
          data: { id: existingUserByPhone.id }
        })
      } else {
        // اگر password اشتباه است
        return NextResponse.json(
          { success: false, error: 'رمز عبور اشتباه است' },
          { status: 401 }
        )
      }
    }
    
    // اگر کاربر وجود ندارد و forceRegister = false (یعنی حالت لاگین)، خطا برگردان
    if (forceRegister === false) {
      return NextResponse.json(
        { success: false, error: 'شماره تماس یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' },
        { status: 404 }
      )
    }
    
    // بررسی اینکه آیا username تکراری است یا نه (فقط برای کاربر جدید و در حالت ثبت‌نام)
    if (username && username.trim()) {
      const existingUserByUsername = await findUserByUsername(username.trim())
      if (existingUserByUsername && existingUserByUsername.phone !== trimmedPhone) {
        return NextResponse.json(
          { success: false, error: 'این نام کاربری قبلاً ثبت شده است' },
          { status: 400 }
        )
      }
    }
    
    // اگر کاربر وجود ندارد، یک کاربر جدید بساز
    // موقعیت الزامی است - اگر ارسال نشده باشد خطا می‌دهیم
    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, error: 'موقعیت الزامی است' },
        { status: 400 }
      )
    }
    
    const finalLat = parseFloat(lat)
    const finalLng = parseFloat(lng)
    
    // بررسی معتبر بودن موقعیت
    if (isNaN(finalLat) || isNaN(finalLng)) {
      return NextResponse.json(
        { success: false, error: 'موقعیت نامعتبر است' },
        { status: 400 }
      )
    }
    
    // در حالت ثبت‌نام، نام کاربری الزامی است
    if (!username || !username.trim()) {
      return NextResponse.json(
        { success: false, error: 'نام کاربری الزامی است' },
        { status: 400 }
      )
    }
    
    // ذخیره در دیتابیس
    const result = await insertAd({
      username: username.trim(),
      phone: trimmedPhone,
      password: password.trim(),
      lat: finalLat,
      lng: finalLng
    })
    
    return NextResponse.json({
      success: true,
      message: 'آگهی با موفقیت ثبت شد',
      data: { id: result.id }
    })
  } catch (error: any) {
    console.error('Error creating ad:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در ثبت آگهی' },
      { status: 500 }
    )
  }
}


