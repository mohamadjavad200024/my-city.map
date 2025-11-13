'use client'

interface UserData {
  username: string
  phone: string
  password: string
  lat?: number | null
  lng?: number | null
  is_store?: boolean | number
  store_name?: string | null
  store_description?: string | null
  working_hours_sat_wed?: string | null
  working_hours_thu?: string | null
  instagram_url?: string | null
  telegram_url?: string | null
  whatsapp_url?: string | null
  profile_image?: string | null
  store_poster_image?: string | null
  followers_count?: number
  following_count?: number
  is_following?: boolean
  rating?: number
}

interface EditStoreProfileProps {
  userId: number
  editData: UserData
  setEditData: React.Dispatch<React.SetStateAction<UserData>>
  userData: UserData | null
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>
  errors: {
    username: string
    phone: string  
    password: string
    store_name?: string
  }
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  isSaving: boolean
  saveMessage: { type: string; text: string }
  setSaveMessage: React.Dispatch<React.SetStateAction<{ type: string; text: string }>>
  isUploadingImage: boolean
  setIsUploadingImage: React.Dispatch<React.SetStateAction<boolean>>
  imagePreview: string | null
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>
  isUploadingPoster: boolean
  setIsUploadingPoster: React.Dispatch<React.SetStateAction<boolean>>
  posterPreview: string | null
  setPosterPreview: React.Dispatch<React.SetStateAction<string | null>>
  handleSave: () => Promise<void>
}

export default function EditStoreProfile({
  userId,
  editData,
  setEditData,
  userData,
  setUserData,
  errors,
  handleChange,
  isSaving,
  saveMessage,
  setSaveMessage,
  isUploadingImage,
  setIsUploadingImage,
  imagePreview,
  setImagePreview,
  isUploadingPoster,
  setIsUploadingPoster,
  posterPreview,
  setPosterPreview,
  handleSave
}: EditStoreProfileProps) {
  return (
    <div className="profile-settings-section" style={{ 
      position: 'relative', 
      zIndex: 10,
      width: '100%',
      padding: '0',
      boxSizing: 'border-box'
    }}>
      <form className="ad-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ paddingBottom: '140px' }}>
        {/* بخش آپلود تصویر پوستر و پروفایل - اولین بخش */}
        <div style={{ 
          marginTop: '24px', 
          padding: '20px', 
          background: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '12px', 
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          {/* آپلود تصویر پوستر و پروفایل */}
          <div className="ad-form-group" style={{ marginBottom: '16px' }}>
            <div style={{ 
              marginBottom: '12px', 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '13px', 
              fontWeight: 500 
            }}>
              تصویر پوستر و لوگو فروشگاه
            </div>
            <div style={{ 
              position: 'relative',
              width: '100%',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {/* پوستر با لوگو در گوشه پایین */}
              <div style={{ 
                position: 'relative',
                width: '100%',
                marginBottom: '60px',
                overflow: 'visible'
              }}>
                {posterPreview || editData.store_poster_image ? (
                  <div style={{ 
                    position: 'relative',
                    width: '100%',
                    height: '120px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'rgba(0, 0, 0, 0.2)'
                  }}>
                    <img 
                      src={posterPreview || editData.store_poster_image || ''} 
                      alt="Poster Preview" 
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    position: 'relative',
                    width: '100%',
                    height: '120px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    overflow: 'visible'
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                )}
                {/* لوگو در گوشه پایین راست - نصفش روی پوستر */}
                <div style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '20px',
                  zIndex: 20,
                  transform: 'translateY(50%)'
                }}>
                  <div style={{ 
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: imagePreview || editData.profile_image ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid rgba(26, 26, 26, 0.8)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                  }}>
                    {imagePreview || editData.profile_image ? (
                      <img 
                        src={imagePreview || editData.profile_image || ''} 
                        alt="Profile Preview" 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* دکمه‌های آپلود کنار هم */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'flex-start'
              }}>
                {/* دکمه آپلود پروفایل */}
                <label 
                  htmlFor="profile-image-upload-store"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '8px',
                    color: '#60a5fa',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    opacity: isUploadingImage ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="file"
                    id="profile-image-upload-store"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      // بررسی نوع فایل
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
                      if (!allowedTypes.includes(file.type)) {
                        alert('نوع فایل معتبر نیست. فقط JPEG, PNG و WebP مجاز است')
                        return
                      }
                      
                      // بررسی اندازه فایل (حداکثر 5MB)
                      const maxSize = 5 * 1024 * 1024 // 5MB
                      if (file.size > maxSize) {
                        alert('حجم فایل باید کمتر از 5 مگابایت باشد')
                        return
                      }
                      
                      // نمایش پیش‌نمایش
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        setImagePreview(event.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                      
                      // آپلود فایل
                      setIsUploadingImage(true)
                      try {
                        const formData = new FormData()
                        formData.append('userId', userId.toString())
                        formData.append('image', file)
                        
                        const response = await fetch('/api/profile/upload-image', {
                          method: 'POST',
                          body: formData
                        })
                        
                        const data = await response.json()
                        
                        if (!response.ok || !data.success) {
                          throw new Error(data.error || 'خطا در آپلود تصویر')
                        }
                        
                        // به‌روزرسانی state
                        setEditData(prev => ({ ...prev, profile_image: data.data.profile_image }))
                        setUserData(prev => prev ? { ...prev, profile_image: data.data.profile_image } : prev)
                        
                        // به‌روزرسانی preview با URL جدید
                        setImagePreview(data.data.profile_image)
                        
                        setSaveMessage({ type: 'success', text: 'تصویر پروفایل با موفقیت آپلود شد' })
                        setTimeout(() => {
                          setSaveMessage({ type: '', text: '' })
                        }, 2000)
                      } catch (error: any) {
                        console.error('Error uploading image:', error)
                        setSaveMessage({ type: 'error', text: error.message || 'خطا در آپلود تصویر' })
                        setImagePreview(null)
                        // بازگشت به تصویر قبلی
                        setImagePreview(userData?.profile_image || null)
                      } finally {
                        setIsUploadingImage(false)
                        // reset input
                        e.target.value = ''
                      }
                    }}
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                      </svg>
                      در حال آپلود...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      {editData.profile_image || imagePreview ? 'تغییر لوگو' : 'آپلود لوگو'}
                    </>
                  )}
                </label>

                {/* دکمه آپلود پوستر */}
                <label 
                  htmlFor="store-poster-upload-store"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '8px',
                    color: '#60a5fa',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: isUploadingPoster ? 'not-allowed' : 'pointer',
                    opacity: isUploadingPoster ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="file"
                    id="store-poster-upload-store"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      // بررسی نوع فایل
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
                      if (!allowedTypes.includes(file.type)) {
                        alert('نوع فایل معتبر نیست. فقط JPEG, PNG و WebP مجاز است')
                        return
                      }
                      
                      // بررسی اندازه فایل (حداکثر 5MB)
                      const maxSize = 5 * 1024 * 1024 // 5MB
                      if (file.size > maxSize) {
                        alert('حجم فایل باید کمتر از 5 مگابایت باشد')
                        return
                      }
                      
                      // نمایش پیش‌نمایش
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        setPosterPreview(event.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                      
                      // آپلود فایل
                      setIsUploadingPoster(true)
                      try {
                        const formData = new FormData()
                        formData.append('userId', userId.toString())
                        formData.append('image', file)
                        formData.append('type', 'poster')
                        
                        const response = await fetch('/api/profile/upload-image', {
                          method: 'POST',
                          body: formData
                        })
                        
                        const data = await response.json()
                        
                        if (!response.ok || !data.success) {
                          throw new Error(data.error || 'خطا در آپلود تصویر')
                        }
                        
                        // به‌روزرسانی state
                        setEditData(prev => ({ ...prev, store_poster_image: data.data.store_poster_image }))
                        setUserData(prev => prev ? { ...prev, store_poster_image: data.data.store_poster_image } : prev)
                        
                        // به‌روزرسانی preview با URL جدید
                        setPosterPreview(data.data.store_poster_image)
                        
                        setSaveMessage({ type: 'success', text: 'تصویر پوستر با موفقیت آپلود شد' })
                        setTimeout(() => {
                          setSaveMessage({ type: '', text: '' })
                        }, 2000)
                      } catch (error: any) {
                        console.error('Error uploading poster:', error)
                        setSaveMessage({ type: 'error', text: error.message || 'خطا در آپلود تصویر پوستر' })
                        setPosterPreview(null)
                        // بازگشت به تصویر قبلی
                        setPosterPreview(userData?.store_poster_image || null)
                      } finally {
                        setIsUploadingPoster(false)
                        // reset input
                        e.target.value = ''
                      }
                    }}
                  />
                  {isUploadingPoster ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }}>
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                      </svg>
                      در حال آپلود...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      {editData.store_poster_image || posterPreview ? 'تغییر پوستر' : 'آپلود پوستر'}
                    </>
                  )}
                </label>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginTop: '8px' }}>
                فرمت‌های مجاز: JPEG, PNG, WebP (حداکثر 5MB)
              </div>
            </div>
          </div>
        </div>

        {/* بخش اطلاعات فروشگاه */}
        <div style={{ 
          marginTop: '24px', 
          padding: '20px', 
          background: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '12px', 
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          {/* نام کاربری */}
                  <div className="ad-form-group" style={{ marginBottom: '16px' }}>
                    <div className="ad-form-input-wrapper">
                      <input
                        type="text"
                        id="profile-username-store"
                        name="username"
                        value={editData.username}
                        onChange={handleChange}
                        className={`ad-form-input ${errors.username ? 'ad-form-input-error' : ''}`}
                        placeholder="نام کاربری خود را وارد کنید"
                        autoComplete="username"
                      />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
                        position: 'absolute', 
                        right: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#ffffff',
                        pointerEvents: 'none'
                      }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    {errors.username && (
                      <span className="ad-form-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {errors.username}
                      </span>
                    )}
                  </div>
  
                  {/* شماره تماس */}
                  <div className="ad-form-group" style={{ marginBottom: '16px' }}>
                    <div className="ad-form-input-wrapper">
                      <input
                        type="tel"
                        id="profile-phone-store"
                        name="phone"
                        value={editData.phone}
                        onChange={handleChange}
                        className={`ad-form-input ${errors.phone ? 'ad-form-input-error' : ''}`}
                        placeholder="09123456789"
                        autoComplete="tel"
                        dir="ltr"
                      />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
                        position: 'absolute', 
                        right: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#ffffff',
                        pointerEvents: 'none'
                      }}>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                    {errors.phone && (
                      <span className="ad-form-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {errors.phone}
                      </span>
                    )}
                  </div>
  
                  {/* رمز عبور */}
                  <div className="ad-form-group" style={{ marginBottom: '16px' }}>
                    <div className="ad-form-input-wrapper">
                      <input
                        type="password"
                        id="profile-password-store"
                        name="password"
                        value={editData.password}
                        onChange={handleChange}
                        className={`ad-form-input ${errors.password ? 'ad-form-input-error' : ''}`}
                        placeholder="رمز خود را وارد کنید"
                        autoComplete="new-password"
                      />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
                        position: 'absolute', 
                        right: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#ffffff',
                        pointerEvents: 'none'
                      }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    {errors.password && (
                      <span className="ad-form-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {errors.password}
                      </span>
                    )}
                  </div>
  
                  {/* نام فروشگاه */}
                  <div className="ad-form-group" style={{ marginBottom: '16px' }}>
                    <div className="ad-form-input-wrapper">
                      <input
                        type="text"
                        id="profile-store-name-store"
                        name="store_name"
                        value={editData.store_name || ''}
                        onChange={handleChange}
                        className={`ad-form-input ${errors.store_name ? 'ad-form-input-error' : ''}`}
                        placeholder="نام فروشگاه *"
                        required
                      />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
                        position: 'absolute', 
                        right: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#ffffff',
                        pointerEvents: 'none'
                      }}>
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                    {errors.store_name && (
                      <span className="ad-form-error" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        marginTop: '6px',
                        fontSize: '12px',
                        color: '#ef4444'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {errors.store_name}
                      </span>
                    )}
                  </div>
  
                  {/* توضیحات فروشگاه */}
                  <div className="ad-form-group" style={{ marginBottom: '16px' }}>
                    <div className="ad-form-input-wrapper" style={{ minHeight: '100px', position: 'relative' }}>
                      <textarea
                        id="profile-store-description-store"
                        name="store_description"
                        value={editData.store_description || ''}
                        onChange={handleChange}
                        className="ad-form-input"
                        placeholder="توضیحات فروشگاه"
                        rows={4}
                        style={{
                          minHeight: '100px',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          paddingRight: '40px'
                        }}
                      />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
                        position: 'absolute', 
                        right: '14px', 
                        top: '14px',
                        color: '#ffffff',
                        pointerEvents: 'none'
                      }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                  </div>
  
                  {/* ساعت کاری شنبه تا چهارشنبه */}
                  <div className="ad-form-group" style={{ marginBottom: '12px' }}>
                    <div style={{ marginBottom: '6px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', fontWeight: 500 }}>
                      ساعت کاری شنبه تا چهارشنبه *
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ad-form-input-wrapper" style={{ height: '40px' }}>
                          <input
                            type="time"
                            id="profile-working-hours-sat-wed-start-store"
                            name="working_hours_sat_wed_start"
                            value={editData.working_hours_sat_wed?.split(' - ')[0] || ''}
                            onChange={(e) => {
                              const endTime = editData.working_hours_sat_wed?.split(' - ')[1] || ''
                              setEditData(prev => ({
                                ...prev,
                                working_hours_sat_wed: endTime ? `${e.target.value} - ${endTime}` : e.target.value
                              }))
                            }}
                            className="ad-form-input"
                            required
                            style={{ 
                              direction: 'ltr', 
                              textAlign: 'left',
                              fontSize: '13px',
                              padding: '8px 12px',
                              height: '40px'
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ 
                        color: 'rgba(255, 255, 255, 0.5)', 
                        fontSize: '13px',
                        alignSelf: 'center',
                        paddingTop: '8px',
                        whiteSpace: 'nowrap'
                      }}>
                        تا
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ad-form-input-wrapper" style={{ height: '40px' }}>
                          <input
                            type="time"
                            id="profile-working-hours-sat-wed-end-store"
                            name="working_hours_sat-wed-end"
                            value={editData.working_hours_sat_wed?.split(' - ')[1] || ''}
                            onChange={(e) => {
                              const startTime = editData.working_hours_sat_wed?.split(' - ')[0] || ''
                              setEditData(prev => ({
                                ...prev,
                                working_hours_sat_wed: startTime ? `${startTime} - ${e.target.value}` : e.target.value
                              }))
                            }}
                            className="ad-form-input"
                            required
                            style={{ 
                              direction: 'ltr', 
                              textAlign: 'left',
                              fontSize: '13px',
                              padding: '8px 12px',
                              height: '40px'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* ساعت کاری پنج‌شنبه */}
                  <div className="ad-form-group" style={{ marginBottom: '12px' }}>
                    <div style={{ marginBottom: '6px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', fontWeight: 500 }}>
                      ساعت کاری پنج‌شنبه *
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ad-form-input-wrapper" style={{ height: '40px' }}>
                          <input
                            type="time"
                            id="profile-working-hours-thu-start-store"
                            name="working_hours_thu_start"
                            value={editData.working_hours_thu?.split(' - ')[0] || ''}
                            onChange={(e) => {
                              const endTime = editData.working_hours_thu?.split(' - ')[1] || ''
                              setEditData(prev => ({
                                ...prev,
                                working_hours_thu: endTime ? `${e.target.value} - ${endTime}` : e.target.value
                              }))
                            }}
                            className="ad-form-input"
                            required
                            style={{ 
                              direction: 'ltr', 
                              textAlign: 'left',
                              fontSize: '13px',
                              padding: '8px 12px',
                              height: '40px'
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ 
                        color: 'rgba(255, 255, 255, 0.5)', 
                        fontSize: '13px',
                        alignSelf: 'center',
                        paddingTop: '8px',
                        whiteSpace: 'nowrap'
                      }}>
                        تا
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ad-form-input-wrapper" style={{ height: '40px' }}>
                          <input
                            type="time"
                            id="profile-working-hours-thu-end-store"
                            name="working_hours_thu_end"
                            value={editData.working_hours_thu?.split(' - ')[1] || ''}
                            onChange={(e) => {
                              const startTime = editData.working_hours_thu?.split(' - ')[0] || ''
                              setEditData(prev => ({
                                ...prev,
                                working_hours_thu: startTime ? `${startTime} - ${e.target.value}` : e.target.value
                              }))
                            }}
                            className="ad-form-input"
                            required
                            style={{ 
                              direction: 'ltr', 
                              textAlign: 'left',
                              fontSize: '13px',
                              padding: '8px 12px',
                              height: '40px'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* آدرس شبکه‌های اجتماعی */}
                  <div style={{ 
                    marginTop: '20px', 
                    paddingTop: '20px', 
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '13px', 
                      marginBottom: '16px',
                      fontWeight: 500
                    }}>
                      شبکه‌های اجتماعی (اختیاری)
                    </div>
  
                    {/* اینستاگرام */}
                    <div className="ad-form-group" style={{ marginBottom: '16px' }}>
                      <div className="ad-form-input-wrapper">
                        <input
                          type="url"
                          id="profile-instagram-url-store"
                          name="instagram_url"
                          value={editData.instagram_url || ''}
                          onChange={handleChange}
                          className="ad-form-input"
                          placeholder="آدرس اینستاگرام"
                        />
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
                          position: 'absolute', 
                          right: '14px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: '#ffffff',
                          pointerEvents: 'none'
                        }}>
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </div>
                    </div>
  
                    {/* تلگرام */}
                    <div className="ad-form-group" style={{ marginBottom: '16px' }}>
                      <div className="ad-form-input-wrapper">
                        <input
                          type="url"
                          id="profile-telegram-url-store"
                          name="telegram_url"
                          value={editData.telegram_url || ''}
                          onChange={handleChange}
                          className="ad-form-input"
                          placeholder="آدرس تلگرام"
                        />
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
                          position: 'absolute', 
                          right: '14px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: '#ffffff',
                          pointerEvents: 'none'
                        }}>
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                      </div>
                    </div>
  
                    {/* واتساپ */}
                    <div className="ad-form-group" style={{ marginBottom: '16px' }}>
                      <div className="ad-form-input-wrapper">
                        <input
                          type="url"
                          id="profile-whatsapp-url-store"
                          name="whatsapp_url"
                          value={editData.whatsapp_url || ''}
                          onChange={handleChange}
                          className="ad-form-input"
                          placeholder="آدرس واتساپ"
                        />
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
                          position: 'absolute', 
                          right: '14px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: '#ffffff',
                          pointerEvents: 'none'
                        }}>
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

        {saveMessage.type === 'error' && (
          <div className="ad-form-error-message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{saveMessage.text}</span>
          </div>
        )}
        
        {saveMessage.type === 'success' && (
          <div className="ad-form-success-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{saveMessage.text}</span>
          </div>
        )}
      </form>

      {/* دکمه شناور */}
      <div className="ad-form-floating-action">
        <button 
          className="ad-details-like-btn ad-details-like-btn-floating" 
          onClick={handleSave}
          disabled={isSaving}
          type="button"
        >
          <img 
            src="/thumbs-up-icon.png" 
            alt="تایید و خروج" 
            className="ad-details-like-icon"
            style={{ 
              opacity: isSaving ? 0.5 : 1
            }} 
          />
        </button>
      </div>
    </div>
  )
}
