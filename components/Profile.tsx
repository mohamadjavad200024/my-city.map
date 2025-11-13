'use client'

import { useState, useEffect } from 'react'
import AdCard from './AdCard'
import AdPreviewEdit from './AdPreviewEdit'

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
}

interface Product {
  id: number
  user_id: number
  title: string
  price: number
  description: string
  status: string
  images: string[]
  created_at: string
}

interface ProfileProps {
  userId: number
  refreshKey?: number
  onClose: () => void
  onCreateAd: () => void
  onLogout?: () => void
  onDeleteAccount?: () => void
  onSetLocation?: () => void
  onUpgradeToStore?: () => void
}

export default function Profile({ userId, refreshKey, onClose, onCreateAd, onLogout, onDeleteAccount, onSetLocation, onUpgradeToStore }: ProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<UserData>({
    username: '',
    phone: '',
    password: ''
  })
  const [errors, setErrors] = useState({
    username: '',
    phone: '',
    password: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [isFollowingUser, setIsFollowingUser] = useState(false)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)

  useEffect(() => {
    // دریافت userId جاری از localStorage
    if (typeof window !== 'undefined') {
      const savedUserId = localStorage.getItem('userId')
      if (savedUserId) {
        setCurrentUserId(parseInt(savedUserId))
      }
    }
    fetchUserData()
    fetchProducts()
  }, [userId, refreshKey])


  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      // دریافت userId جاری از localStorage
      const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const currentUserIdNum = currentUserId ? parseInt(currentUserId) : null
      
      // ارسال userId جاری به عنوان query parameter
      const url = currentUserIdNum && currentUserIdNum !== userId 
        ? `/api/ads/${userId}?currentUserId=${currentUserIdNum}`
        : `/api/ads/${userId}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success && data.data) {
        const userDataWithFollowers = {
          ...data.data,
          followers_count: data.data.followers_count || 0,
          following_count: data.data.following_count || 0,
          is_following: data.data.is_following || false
        }
        setUserData(userDataWithFollowers)
        setIsFollowingUser(userDataWithFollowers.is_following || false)
        setEditData({
          username: data.data.username,
          phone: data.data.phone,
          password: data.data.password,
          profile_image: data.data.profile_image || null
        })
        setImagePreview(data.data.profile_image || null)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const response = await fetch(`/api/products/user/${userId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setSaveMessage({ type: '', text: '' })
  }

  const handleCancel = () => {
    if (userData) {
      setEditData({
        username: userData.username,
        phone: userData.phone,
        password: userData.password,
        profile_image: userData.profile_image || null
      })
      setImagePreview(userData.profile_image || null)
    }
    setIsEditing(false)
    setErrors({ username: '', phone: '', password: '' })
    setSaveMessage({ type: '', text: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const type = (e.target as HTMLInputElement).type
    const checked = (e.target as HTMLInputElement).checked
    
    setEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // پاک کردن خطا هنگام تایپ
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {
      username: '',
      phone: '',
      password: ''
    }
    let isValid = true

    if (!editData.username.trim()) {
      newErrors.username = 'نام کاربری الزامی است'
      isValid = false
    }

    if (!editData.phone.trim()) {
      newErrors.phone = 'شماره تماس الزامی است'
      isValid = false
    } else if (!/^09\d{9}$/.test(editData.phone)) {
      newErrors.phone = 'شماره تماس باید با 09 شروع شود و 11 رقم باشد'
      isValid = false
    }

    if (!editData.password.trim()) {
      newErrors.password = 'رمز الزامی است'
      isValid = false
    } else if (editData.password.length < 6) {
      newErrors.password = 'رمز باید حداقل 6 کاراکتر باشد'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const saveProfile = async (options: { exitAfterSuccess?: boolean } = {}) => {
    const { exitAfterSuccess = true } = options

    if (!validateForm()) {
      return false
    }

    setIsSaving(true)
    setSaveMessage({ type: '', text: '' })

    try {
      const response = await fetch(`/api/ads/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editData.username,
          phone: editData.phone,
          password: editData.password,
          profile_image: editData.profile_image
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در به‌روزرسانی اطلاعات')
      }

      // به‌روزرسانی userData با اطلاعات جدید
      const updatedUserData = { ...editData }
      setUserData(prev => prev ? { ...prev, ...updatedUserData } : updatedUserData)
      // به‌روزرسانی preview تصویر
      if (editData.profile_image) {
        setImagePreview(editData.profile_image)
      }
      setSaveMessage({ type: 'success', text: 'اطلاعات با موفقیت به‌روزرسانی شد' })
      
      if (exitAfterSuccess) {
        setTimeout(() => {
          setIsEditing(false)
          setSaveMessage({ type: '', text: '' })
          // به‌روزرسانی مجدد اطلاعات از سرور
          fetchUserData()
        }, 1000)
      }

      return true
    } catch (error: any) {
      console.error('Error updating user data:', error)
      setSaveMessage({ type: 'error', text: error.message || 'خطا در به‌روزرسانی اطلاعات' })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    await saveProfile()
  }

  const handleChangeLocation = async () => {
    if (isSaving) {
      return
    }

    const hasUnsavedChanges =
      !!userData &&
      (editData.username !== userData.username ||
        editData.phone !== userData.phone ||
        editData.password !== userData.password ||
        (editData.is_store ? 1 : 0) !== (userData.is_store === 1 || userData.is_store === true ? 1 : 0))

    if (hasUnsavedChanges) {
      const shouldSave = window.confirm('برای تغییر موقعیت ابتدا اطلاعات خود را ذخیره کنید. آیا مایل به ذخیره هستید؟')
      if (!shouldSave) {
        return
      }

      const saveSuccess = await saveProfile({ exitAfterSuccess: false })
      if (!saveSuccess) {
        return
      }
    }

    setIsEditing(false)
    setSaveMessage({ type: '', text: '' })
    if (onSetLocation) {
      onSetLocation()
    }
  }

  const handleDeleteAccount = async () => {
    // تایید حذف حساب
    const confirmed = window.confirm('آیا از حذف حساب کاربری خود اطمینان دارید؟ این عمل غیرقابل برگشت است و تمام اطلاعات شما حذف خواهد شد.')
    
    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/ads/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در حذف حساب')
      }

      // بعد از حذف موفق، callback را فراخوانی کن
      if (onDeleteAccount) {
        onDeleteAccount()
      }
    } catch (error: any) {
      console.error('Error deleting account:', error)
      alert(error.message || 'خطا در حذف حساب. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">در حال بارگذاری...</div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="profile-container">
        <div className="profile-error">خطا در بارگذاری اطلاعات کاربر</div>
      </div>
    )
  }

  // اگر یک آگهی انتخاب شده است، کامپوننت پیش‌نمایش را نمایش بده
  if (selectedProduct) {
    return (
      <AdPreviewEdit
        product={selectedProduct}
        productId={selectedProduct.id}
        onClose={() => setSelectedProduct(null)}
        onUpdate={async () => {
          // به‌روزرسانی لیست محصولات
          await fetchProducts()
          // بعد از به‌روزرسانی، product را دوباره از API دریافت کن تا اطلاعات کامل باشد
          try {
            const response = await fetch(`/api/products/${selectedProduct.id}`)
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.data) {
                const updatedProduct: Product = {
                  id: data.data.id,
                  user_id: data.data.user_id || userId,
                  title: data.data.title,
                  price: data.data.price,
                  description: data.data.description || '',
                  status: data.data.status,
                  images: Array.isArray(data.data.images) ? data.data.images : (data.data.images ? JSON.parse(data.data.images) : []),
                  created_at: data.data.created_at || new Date().toISOString()
                }
                setSelectedProduct(updatedProduct)
              }
            }
          } catch (error) {
            console.error('Error refreshing product:', error)
          }
        }}
      />
    )
  }

  return (
    <div className="profile-container">
      {/* دکمه ارتقا به فروشگاه در حالت edit - در عرض کامل صفحه */}
      {isEditing && currentUserId === userId && (!userData.is_store || userData.is_store === 0) && (
        <div style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          padding: '16px 20px',
          background: 'transparent',
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '8px',
          flexWrap: 'nowrap',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
            {/* دکمه ارتقا به فروشگاه - فقط برای کاربران معمولی */}
            <button
              type="button"
              onClick={() => {
                // فراخوانی callback برای نمایش StoreProfile با حالت ویرایش
                if (onUpgradeToStore) {
                  onUpgradeToStore()
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c55 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 12px',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 107, 53, 0.3)'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              ارتقا به فروشگاه
            </button>
        </div>
      )}
      
      <div className="profile-content">
        {/* نمایش اطلاعات کاربر در بالا - فقط در حالت view */}
        {!isEditing && (
        <div className="profile-header-info" style={{ 
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'visible',
          background: 'rgba(255, 255, 255, 0.05)',
          position: 'relative',
          zIndex: isEditing ? 1 : 10,
          minHeight: '152px'
        }}>
          {/* Ring Lights - حلقه‌های تاریک در پس‌زمینه */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
            overflow: 'hidden'
          }}>
            {/* Ring 1 - حلقه تاریک اول (بزرگتر) با طرح برجسته */}
            <svg 
              width="380" 
              height="380" 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.8
              }}
            >
              <defs>
                <linearGradient id="ringDark1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(64, 64, 64, 0.8)" />
                  <stop offset="50%" stopColor="rgba(38, 38, 38, 0.6)" />
                  <stop offset="100%" stopColor="rgba(64, 64, 64, 0.8)" />
                </linearGradient>
              </defs>
              {/* حلقه بیرونی با طرح برجسته */}
              <circle 
                cx="190" 
                cy="190" 
                r="170" 
                fill="none" 
                stroke="rgba(115, 115, 115, 0.6)" 
                strokeWidth="5" 
                strokeDasharray="40 20"
                strokeLinecap="round"
              />
              <circle 
                cx="190" 
                cy="190" 
                r="152" 
                fill="none" 
                stroke="rgba(82, 82, 82, 0.5)" 
                strokeWidth="4" 
                strokeDasharray="25 25"
                strokeLinecap="round"
              />
              <circle 
                cx="190" 
                cy="190" 
                r="134" 
                fill="none" 
                stroke="rgba(64, 64, 64, 0.4)" 
                strokeWidth="3" 
                strokeDasharray="20 30"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Ring 2 - حلقه تاریک دوم (کوچکتر) با طرح برجسته */}
            <svg 
              width="300" 
              height="300" 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.85
              }}
            >
              <defs>
                <linearGradient id="ringDark2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(52, 52, 52, 0.8)" />
                  <stop offset="50%" stopColor="rgba(64, 64, 64, 0.6)" />
                  <stop offset="100%" stopColor="rgba(52, 52, 52, 0.8)" />
                </linearGradient>
              </defs>
              {/* حلقه داخلی با طرح برجسته */}
              <circle 
                cx="150" 
                cy="150" 
                r="140" 
                fill="none" 
                stroke="rgba(115, 115, 115, 0.65)" 
                strokeWidth="6" 
                strokeDasharray="45 15"
                strokeLinecap="round"
              />
              <circle 
                cx="150" 
                cy="150" 
                r="126" 
                fill="none" 
                stroke="rgba(82, 82, 82, 0.55)" 
                strokeWidth="4.5" 
                strokeDasharray="22 28"
                strokeLinecap="round"
              />
              <circle 
                cx="150" 
                cy="150" 
                r="112" 
                fill="none" 
                stroke="rgba(64, 64, 64, 0.45)" 
                strokeWidth="3.5" 
                strokeDasharray="15 35"
                strokeLinecap="round"
              />
            </svg>
            
            {/* حلقه‌های اضافی تاریک برای برجسته‌تر شدن */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '370px',
              height: '370px',
              marginTop: '-185px',
              marginLeft: '-185px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, transparent 40%, rgba(38, 38, 38, 0.5) 46%, rgba(64, 64, 64, 0.7) 50%, rgba(38, 38, 38, 0.5) 54%, transparent 60%)',
              border: '4px solid rgba(82, 82, 82, 0.6)',
              boxShadow: `
                inset 0 0 80px rgba(23, 23, 23, 0.6),
                0 0 50px rgba(23, 23, 23, 0.4),
                0 0 100px rgba(23, 23, 23, 0.2)
              `,
              filter: 'blur(2px)',
              pointerEvents: 'none'
            }} />
            
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '290px',
              height: '290px',
              marginTop: '-145px',
              marginLeft: '-145px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, transparent 36%, rgba(52, 52, 52, 0.5) 41%, rgba(82, 82, 82, 0.8) 45%, rgba(52, 52, 52, 0.5) 49%, transparent 54%)',
              border: '4px solid rgba(70, 70, 70, 0.7)',
              boxShadow: `
                inset 0 0 70px rgba(38, 38, 38, 0.7),
                0 0 40px rgba(38, 38, 38, 0.5),
                0 0 80px rgba(38, 38, 38, 0.3)
              `,
              filter: 'blur(1.5px)',
              pointerEvents: 'none'
            }} />
          </div>
          
          {/* بخش بالایی header: نام، دکمه‌ها */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '12px',
            width: '100%',
            paddingTop: '16px',
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingBottom: '16px',
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
            minHeight: '120px'
          }}>
            {/* آواتار و یوزرنیم در وسط */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                flex: 1
              }}>
                {/* آواتار */}
                <div className="profile-header-avatar" style={{ 
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '50%',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: userData && userData.profile_image ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                  flexShrink: 0,
                  border: '4px solid rgba(26, 26, 26, 0.8)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  {userData && (userData.profile_image || imagePreview) ? (
                    <img 
                      src={imagePreview || userData.profile_image || ''} 
                      alt="Profile" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  )}
                </div>
                {/* یوزرنیم زیر آواتار */}
                <div className="profile-header-username" style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#ffffff',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                }}>
                  {userData.username}
                </div>
              </div>
            
            {/* دکمه‌ها در سمت راست */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '8px', 
              flexShrink: 0,
              position: 'absolute',
              right: '20px',
              top: '16px'
            }}>
              
              {/* دکمه follow/unfollow - فقط برای کاربران دیگر */}
              {!isEditing && currentUserId && currentUserId !== userId && (
                <button
                  onClick={async () => {
                    if (!currentUserId) return
                    setIsTogglingFollow(true)
                    try {
                      if (isFollowingUser) {
                        // آنفالو کردن
                        const response = await fetch(`/api/follow/${userId}`, {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ followerId: currentUserId })
                        })
                        const data = await response.json()
                        if (data.success) {
                          setIsFollowingUser(false)
                          setUserData(prev => prev ? {
                            ...prev,
                            followers_count: (prev.followers_count || 0) - 1,
                            is_following: false
                          } : prev)
                        }
                      } else {
                        // دنبال کردن
                        const response = await fetch(`/api/follow/${userId}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ followerId: currentUserId })
                        })
                        const data = await response.json()
                        if (data.success) {
                          setIsFollowingUser(true)
                          setUserData(prev => prev ? {
                            ...prev,
                            followers_count: (prev.followers_count || 0) + 1,
                            is_following: true
                          } : prev)
                        }
                      }
                    } catch (error) {
                      console.error('Error toggling follow:', error)
                    } finally {
                      setIsTogglingFollow(false)
                    }
                  }}
                  disabled={isTogglingFollow}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isFollowingUser 
                      ? 'rgba(239, 68, 68, 0.2)' 
                      : 'rgba(59, 130, 246, 0.2)',
                    border: isFollowingUser 
                      ? '1px solid rgba(239, 68, 68, 0.5)' 
                      : '1px solid rgba(59, 130, 246, 0.5)',
                    color: isFollowingUser ? '#ef4444' : '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isTogglingFollow ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isTogglingFollow ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isTogglingFollow) {
                      e.currentTarget.style.background = isFollowingUser 
                        ? 'rgba(239, 68, 68, 0.3)' 
                        : 'rgba(59, 130, 246, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isTogglingFollow) {
                      e.currentTarget.style.background = isFollowingUser 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : 'rgba(59, 130, 246, 0.2)'
                    }
                  }}
                >
                  {isTogglingFollow ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }}>
                      <line x1="12" y1="2" x2="12" y2="6"></line>
                      <line x1="12" y1="18" x2="12" y2="22"></line>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                      <line x1="2" y1="12" x2="6" y2="12"></line>
                      <line x1="18" y1="12" x2="22" y2="12"></line>
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                    </svg>
                  ) : isFollowingUser ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                  )}
                </button>
              )}
              
              {/* دکمه ویرایش - بالا */}
              {!isEditing && (
                <button 
                  className="profile-header-edit-btn" 
                  onClick={handleEdit}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px'
                  }}
                >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
              </div>
          </div>
        </div>
          )}


        {/* بخش تنظیمات - فقط در حالت ویرایش - در عرض کامل صفحه */}
        {isEditing && (
          <div className="profile-settings-section" style={{ 
            position: 'relative', 
            zIndex: 10,
            width: '100vw',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            paddingLeft: '20px',
            paddingRight: '20px',
            boxSizing: 'border-box'
          }}>
            <form className="ad-form" onSubmit={(e) => { e.preventDefault(); saveProfile(); }} style={{ paddingBottom: '140px' }}>
              {/* آپلود تصویر پروفایل */}
              <div className="ad-form-group" style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ 
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: imagePreview || editData.profile_image ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
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
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>
                  <label 
                    htmlFor="profile-image-upload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '8px',
                      color: '#60a5fa',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                      opacity: isUploadingImage ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="file"
                      id="profile-image-upload"
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
                          setImagePreview(userData.profile_image || null)
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        {editData.profile_image || imagePreview ? 'تغییر تصویر پروفایل' : 'آپلود تصویر پروفایل'}
                      </>
                    )}
                  </label>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                    فرمت‌های مجاز: JPEG, PNG, WebP (حداکثر 5MB)
                  </div>
                </div>
              </div>

              <div className="ad-form-group">
                <div className="ad-form-input-wrapper">
                  <input
                    type="text"
                    id="profile-username"
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

              <div className="ad-form-group">
                <div className="ad-form-input-wrapper">
                  <input
                    type="tel"
                    id="profile-phone"
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

              <div className="ad-form-group">
                <div className="ad-form-input-wrapper">
                  <input
                    type="password"
                    id="profile-password"
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

              {/* دکمه‌های خروج از حساب، تغییر موقعیت و حذف حساب - در پایین فرم */}
              {currentUserId === userId && (
                <div style={{
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <button
                    type="button"
                    onClick={handleChangeLocation}
                    disabled={isSaving}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '12px',
                      color: '#60a5fa',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      opacity: isSaving ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.7)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    تغییر موقعیت
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogout) {
                        onLogout()
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#d4d4d4',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                      e.currentTarget.style.color = '#ffffff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.color = '#d4d4d4'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    خروج از حساب
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      color: '#ef4444',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      opacity: isDeleting ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                        e.currentTarget.style.color = '#dc2626'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                        e.currentTarget.style.color = '#ef4444'
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    {isDeleting ? 'در حال حذف...' : 'حذف حساب'}
                  </button>
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
        )}

        {/* دکمه مشخص کردن موقعیت - فقط زمانی که موقعیت در دیتابیس موجود نباشد */}
        {!isEditing && (userData.lat === null || userData.lat === undefined || userData.lng === null || userData.lng === undefined) && (
          <button
            className="profile-create-ad-btn"
            onClick={() => {
              if (onSetLocation) {
                onSetLocation()
              }
            }}
            style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>مشخص کردن موقعیت</span>
          </button>
        )}

        {/* دکمه ایجاد آگهی */}
        {!isEditing && (
          <button
            className="profile-create-ad-btn"
            onClick={onCreateAd}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>ایجاد آگهی</span>
          </button>
        )}

        {/* لیست آگهی‌ها */}
        {!isEditing && (
          <div className="profile-ads-section">
            {isLoadingProducts ? (
              <div className="profile-ads-loading">در حال بارگذاری آگهی‌ها...</div>
            ) : products.length > 0 ? (
              <div className="profile-ads-list">
                {products.map((product) => (
                  <div key={product.id} onClick={() => {
                    // اطمینان از اینکه همه فیلدهای مورد نیاز وجود دارند
                    const fullProduct: Product = {
                      id: product.id,
                      user_id: product.user_id || userId,
                      title: product.title,
                      price: product.price,
                      description: product.description || '',
                      status: product.status,
                      images: Array.isArray(product.images) ? product.images : [],
                      created_at: product.created_at || new Date().toISOString()
                    }
                    setSelectedProduct(fullProduct)
                  }}>
                    <AdCard
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      status={product.status}
                      images={product.images}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="profile-ads-empty">هنوز آگهی‌ای ثبت نکرده‌اید</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

