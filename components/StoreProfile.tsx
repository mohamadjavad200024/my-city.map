'use client'

import { useState, useEffect } from 'react'
import AdCard from './AdCard'
import AdPreviewEdit from './AdPreviewEdit'
import EditStoreProfile from './EditStoreProfile'

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

interface StoreProfileProps {
  userId: number
  refreshKey?: number
  onClose: () => void
  onCreateAd: () => void
  onLogout?: () => void
  onDeleteAccount?: () => void
  onSetLocation?: () => void
  onProfileUpdated?: () => void
  initialEditMode?: boolean
}

export default function StoreProfile({ userId, refreshKey, onClose, onCreateAd, onLogout, onDeleteAccount, onSetLocation, onProfileUpdated, initialEditMode = false }: StoreProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isEditing, setIsEditing] = useState(initialEditMode)
  const [editData, setEditData] = useState<UserData>({
    username: '',
    phone: '',
    password: '',
    is_store: false,
    store_name: '',
    store_description: '',
    working_hours_sat_wed: '',
    working_hours_thu: '',
    instagram_url: '',
    telegram_url: '',
    whatsapp_url: '',
    store_poster_image: ''
  })
  const [errors, setErrors] = useState({
    username: '',
    phone: '',
    password: '',
    store_name: ''
  })
  const [isCheckingStoreName, setIsCheckingStoreName] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isStoreInfoExpanded, setIsStoreInfoExpanded] = useState(false)
  const [isUploadingPoster, setIsUploadingPoster] = useState(false)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [isFollowingUser, setIsFollowingUser] = useState(false)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)
  const [windowWidth, setWindowWidth] = useState<number>(0)

  useEffect(() => {
    // تنظیم عرض صفحه برای responsive
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
      const handleResize = () => {
        setWindowWidth(window.innerWidth)
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

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
          is_following: data.data.is_following || false,
          rating: data.data.rating || 0
        }
        setUserData(userDataWithFollowers)
        setIsFollowingUser(userDataWithFollowers.is_following || false)
        const isStore = data.data.is_store === 1 || data.data.is_store === true
        const hasStoreInfo = !!(data.data.store_name || data.data.store_description || data.data.working_hours_sat_wed || data.data.working_hours_thu || data.data.instagram_url || data.data.telegram_url || data.data.whatsapp_url)
        
        // اگر initialEditMode true است و کاربر فروشگاه ندارد یا اطلاعات فروشگاه ندارد، فرم را خالی تنظیم کن
        // اما اگر بعد از ذخیره، isStore true شده و hasStoreInfo true شده، باید اطلاعات را نمایش دهیم
        if (initialEditMode && !isStore && !hasStoreInfo) {
          // کاربر فروشگاه ندارد و می‌خواهد فروشگاه ایجاد کند - فرم را خالی تنظیم کن
          setEditData({
            username: data.data.username,
            phone: data.data.phone,
            password: data.data.password,
            is_store: true, // برای ارتقا به فروشگاه
            store_name: '',
            store_description: '',
            working_hours_sat_wed: '',
            working_hours_thu: '',
            instagram_url: '',
            telegram_url: '',
            whatsapp_url: '',
            profile_image: data.data.profile_image || null,
            store_poster_image: null
          })
          setImagePreview(data.data.profile_image || null)
          setPosterPreview(null)
        } else {
          // حالت عادی - نمایش اطلاعات موجود (چه فروشگاه داشته باشد چه نداشته باشد)
          setEditData({
            username: data.data.username,
            phone: data.data.phone,
            password: data.data.password,
            is_store: isStore,
            store_name: data.data.store_name || '',
            store_description: data.data.store_description || '',
            working_hours_sat_wed: data.data.working_hours_sat_wed || '',
            working_hours_thu: data.data.working_hours_thu || '',
            instagram_url: data.data.instagram_url || '',
            telegram_url: data.data.telegram_url || '',
            whatsapp_url: data.data.whatsapp_url || '',
            profile_image: data.data.profile_image || null,
            store_poster_image: data.data.store_poster_image || null
          })
          setImagePreview(data.data.profile_image || null)
          setPosterPreview(data.data.store_poster_image || null)
          // اگر فروشگاه فعال است و اطلاعات دارد، به صورت پیش‌فرض باز باشد
          if (isStore && hasStoreInfo) {
            setIsStoreInfoExpanded(true)
          }
        }
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
    // اگر initialEditMode true است و کاربر انصراف می‌دهد، باید به Profile برگردد
    // چون کاربر فروشگاه ندارد و نمی‌خواهد ایجاد کند
    if (initialEditMode) {
      // بازگشت به Profile با بستن StoreProfile
      if (onClose) {
        onClose()
      }
      return
    }
    
    // حالت عادی - فقط reset کردن editData
    if (userData) {
      setEditData({
        username: userData.username,
        phone: userData.phone,
        password: userData.password,
        is_store: userData.is_store === 1 || userData.is_store === true,
        store_name: userData.store_name || '',
        store_description: userData.store_description || '',
        working_hours_sat_wed: userData.working_hours_sat_wed || '',
        working_hours_thu: userData.working_hours_thu || '',
        instagram_url: userData.instagram_url || '',
        telegram_url: userData.telegram_url || '',
        whatsapp_url: userData.whatsapp_url || '',
        profile_image: userData.profile_image || null,
        store_poster_image: userData.store_poster_image || null
      })
      setImagePreview(userData.profile_image || null)
      setPosterPreview(userData.store_poster_image || null)
    }
    setIsEditing(false)
    setErrors({ username: '', phone: '', password: '', store_name: '' })
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
      password: '',
      store_name: ''
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

    // اعتبارسنجی فیلدهای فروشگاه (اگر is_store فعال است)
    if (editData.is_store === true || editData.is_store === 1) {
      if (!editData.store_name || !editData.store_name.trim()) {
        newErrors.store_name = 'نام فروشگاه الزامی است'
        isValid = false
      } else {
        // بررسی یکتایی نام فروشگاه به صورت async (این چک در saveProfile انجام می‌شود)
        // در اینجا فقط خطای خالی بودن را چک می‌کنیم
      }
      if (!editData.working_hours_sat_wed || !editData.working_hours_sat_wed.trim()) {
        alert('ساعت کاری شنبه تا چهارشنبه الزامی است')
        isValid = false
      }
      if (!editData.working_hours_thu || !editData.working_hours_thu.trim()) {
        alert('ساعت کاری پنج‌شنبه الزامی است')
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }
  
  // تابع برای بررسی یکتایی نام فروشگاه
  const checkStoreNameUnique = async (storeName: string): Promise<boolean> => {
    if (!storeName || !storeName.trim()) {
      return true // نام خالی یکتا محسوب می‌شود
    }
    
    try {
      setIsCheckingStoreName(true)
      const response = await fetch(`/api/stores/check-name?storeName=${encodeURIComponent(storeName.trim())}&excludeUserId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        return data.isUnique
      }
      return false
    } catch (error) {
      console.error('Error checking store name:', error)
      return false
    } finally {
      setIsCheckingStoreName(false)
    }
  }

  const saveProfile = async (options: { exitAfterSuccess?: boolean } = {}) => {
    const { exitAfterSuccess = true } = options

    if (!validateForm()) {
      return false
    }
    
    // بررسی یکتایی نام فروشگاه قبل از ذخیره
    if (editData.is_store === true || editData.is_store === 1) {
      if (editData.store_name && editData.store_name.trim()) {
        const isUnique = await checkStoreNameUnique(editData.store_name)
        if (!isUnique) {
          setErrors(prev => ({ ...prev, store_name: 'این نام فروشگاه قبلاً استفاده شده است. لطفاً نام دیگری انتخاب کنید.' }))
          setSaveMessage({ type: 'error', text: 'این نام فروشگاه قبلاً استفاده شده است. لطفاً نام دیگری انتخاب کنید.' })
          return false
        }
        // پاک کردن خطا اگر یکتا باشد
        setErrors(prev => ({ ...prev, store_name: '' }))
      }
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
          is_store: editData.is_store,
          store_name: editData.store_name,
          store_description: editData.store_description,
          working_hours_sat_wed: editData.working_hours_sat_wed,
          working_hours_thu: editData.working_hours_thu,
          instagram_url: editData.instagram_url,
          telegram_url: editData.telegram_url,
          whatsapp_url: editData.whatsapp_url,
          profile_image: editData.profile_image,
          store_poster_image: editData.store_poster_image
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        // اگر خطای یکتایی نام باشد، آن را نمایش بده
        if (data.error && data.error.includes('نام فروشگاه')) {
          setErrors(prev => ({ ...prev, store_name: data.error }))
        }
        throw new Error(data.error || 'خطا در به‌روزرسانی اطلاعات')
      }

      // به‌روزرسانی userData با اطلاعات جدید
      const updatedUserData = { ...editData }
      setUserData(prev => prev ? { ...prev, ...updatedUserData } : updatedUserData)
      // به‌روزرسانی preview تصاویر
      if (editData.profile_image) {
        setImagePreview(editData.profile_image)
      }
      if (editData.store_poster_image) {
        setPosterPreview(editData.store_poster_image)
      }
      setSaveMessage({ type: 'success', text: 'اطلاعات با موفقیت به‌روزرسانی شد' })
      
      // اگر فروشگاه فعال است و اطلاعات دارد، کانتینر را باز کن
      const isStore = editData.is_store === true || editData.is_store === 1
      const hasStoreInfo = !!(editData.store_name || editData.store_description || editData.working_hours_sat_wed || editData.working_hours_thu || editData.instagram_url || editData.telegram_url || editData.whatsapp_url)
      if (isStore && hasStoreInfo) {
        setIsStoreInfoExpanded(true)
      }
      
      // اگر initialEditMode true است و کاربر فروشگاه ایجاد کرده، باید fetchUserData را فراخوانی کنیم
      // تا اطلاعات جدید از سرور لود شود و userData.is_store به true تبدیل شود
      if (initialEditMode && isStore) {
        // به‌روزرسانی مجدد اطلاعات از سرور
        await fetchUserData()
      }
      
      if (exitAfterSuccess) {
        setTimeout(() => {
          setIsEditing(false)
          setSaveMessage({ type: '', text: '' })
          // اگر initialEditMode true نبوده، اطلاعات را از سرور لود کن
          if (!initialEditMode || !isStore) {
            fetchUserData().then(() => {
              // بعد از لود اطلاعات، اگر فروشگاه فعال است و اطلاعات دارد، کانتینر را باز کن
              const isStoreAfterLoad = editData.is_store === true || editData.is_store === 1
              const hasStoreInfoAfterLoad = !!(editData.store_name || editData.store_description || editData.working_hours_sat_wed || editData.working_hours_thu || editData.instagram_url || editData.telegram_url || editData.whatsapp_url)
              if (isStoreAfterLoad && hasStoreInfoAfterLoad) {
                setIsStoreInfoExpanded(true)
              }
              // اطلاع دادن به parent component برای به‌روزرسانی isStore
              if (onProfileUpdated) {
                onProfileUpdated()
              }
            })
          } else {
            // اگر initialEditMode true بوده و اطلاعات از قبل لود شده، فقط parent را اطلاع بده
            if (onProfileUpdated) {
              onProfileUpdated()
            }
          }
        }, 1000)
      } else {
        // اگر exitAfterSuccess false است، فقط parent را اطلاع بده
        if (onProfileUpdated) {
          onProfileUpdated()
        }
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

  // تابع برای نمایش ستاره‌ها
  const renderStars = (ratingValue: number) => {
    const stars = []
    const fullStars = Math.floor(ratingValue)
    const hasHalfStar = ratingValue % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    // ستاره‌های پر
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={`full-${i}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{
            color: '#FFD700',
            filter: 'drop-shadow(0 1px 2px rgba(255, 215, 0, 0.5))'
          }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    }

    // ستاره نیمه‌پر (اگر وجود دارد)
    if (hasHalfStar) {
      stars.push(
        <svg
          key="half"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{
            color: '#FFD700',
            filter: 'drop-shadow(0 1px 2px rgba(255, 215, 0, 0.5))',
            position: 'relative'
          }}
        >
          <defs>
            <linearGradient id={`half-fill-store-${userId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={`url(#half-fill-store-${userId})`}
            stroke="#FFD700"
          />
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
          />
        </svg>
      )
    }

    // ستاره‌های خالی
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{
            color: 'rgba(255, 255, 255, 0.3)',
            opacity: 0.5
          }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    }

    return stars
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

  // بررسی اینکه آیا این کاربر فروشگاه است
  // اگر initialEditMode true است، اجازه می‌دهیم فرم ویرایش نمایش داده شود حتی اگر کاربر فروشگاه نداشته باشد
  const isStoreUser = userData.is_store === 1 || userData.is_store === true
  
  // اگر initialEditMode true است و isEditing false است (کاربر انصراف داد)، نباید StoreProfile را نمایش دهیم
  // چون کاربر فروشگاه ندارد و نمی‌خواهد ایجاد کند
  if (!isStoreUser && !initialEditMode) {
    return (
      <div className="profile-container">
        <div className="profile-content" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          padding: '40px 20px',
          color: '#e5e5e5'
        }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>این کاربر فروشگاه نیست</div>
            <button
              onClick={onClose}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // اگر initialEditMode true است و isEditing false است (کاربر انصراف داد)، نباید StoreProfile را نمایش دهیم
  // چون کاربر فروشگاه ندارد و نمی‌خواهد ایجاد کند
  // در این حالت باید به Profile برگردیم که در handleCancel انجام می‌شود
  // اما برای جلوگیری از نمایش header به هم ریخته، اگر این حالت رخ داد، loading نمایش دهیم
  // تا onClose کامل اجرا شود و به Profile برگردیم
  if (initialEditMode && !isEditing && !isStoreUser) {
    // اگر initialEditMode true است و isEditing false است و کاربر فروشگاه ندارد،
    // باید به Profile برگردیم (onClose در handleCancel فراخوانی می‌شود)
    // اما برای جلوگیری از باگ، loading نمایش می‌دهیم
    // چون onClose باید StoreProfile را ببندد و Profile را نمایش دهد
    return (
      <div className="profile-container">
        <div className="profile-loading">در حال بارگذاری...</div>
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

  const hasPoster = !isEditing && userData && (userData.is_store === 1 || userData.is_store === true) && (posterPreview || userData.store_poster_image)
  const posterHeight = 120
  const displayRating = userData.rating ?? 0
  
  // اگر initialEditMode true است و کاربر فروشگاه ندارد، نباید بخش نمایش اطلاعات را نمایش دهیم
  // چون اطلاعات فروشگاه وجود ندارد و header به هم می‌ریزد
  // فقط وقتی header را نمایش می‌دهیم که کاربر فروشگاه دارد و در حالت ویرایش نیست
  const shouldShowStoreHeader = !isEditing && isStoreUser

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* نمایش اطلاعات فروشگاه در بالا - فقط زمانی که در حال ویرایش نیستیم و کاربر فروشگاه دارد */}
        {shouldShowStoreHeader && (
        <div className="profile-header-info" style={{ 
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'visible',
          background: 'rgba(255, 255, 255, 0.05)',
          position: 'relative',
          zIndex: 10,
          minHeight: 'auto'
        }}>
          {/* نمایش تصویر پوستر فروشگاه در بالای header */}
          {(posterPreview || userData.store_poster_image) && (
            <div style={{
              width: '100%',
              height: '120px',
              position: 'relative',
              overflow: 'visible',
              background: 'rgba(0, 0, 0, 0.2)',
              flexShrink: 0,
              zIndex: 1
            }}>
              <img 
                src={posterPreview || userData.store_poster_image || ''} 
                alt="Store Poster"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
          
          {/* آواتار و نام فروشگاه که روی پوستر و header قرار می‌گیرد */}
          {(() => {
            const avatarSize = 80
            const overlapPercent = 0.30
            const overlapPixels = avatarSize * overlapPercent
            const topPosition = hasPoster 
              ? posterHeight - overlapPixels + 30 
              : 46
            
            return (
              <div key="avatar-container" style={{
                position: 'absolute',
                right: '20px',
                top: `${topPosition}px`,
                zIndex: 20,
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexDirection: 'row-reverse'
              }}>
                {/* نام فروشگاه */}
                {userData.store_name && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px'
                  }}>
                    <div className="profile-header-username" style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#ffffff',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      textAlign: 'right'
                    }}>
                      {userData.store_name}
                    </div>
                  </div>
                )}
                
                {/* آواتار */}
                <div className="profile-header-avatar" style={{ 
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  width: `${avatarSize}px`,
                  height: `${avatarSize}px`,
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
                      alt="Store Logo" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <svg width={avatarSize} height={avatarSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  )}
                </div>
              </div>
            );
          })()}
          
          {/* بخش بالایی header: نام، دکمه‌ها */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between',
            gap: '12px',
            width: '100%',
            paddingTop: '16px',
            paddingLeft: '20px',
            paddingRight: userData && (posterPreview || userData.store_poster_image)
              ? '120px'
              : '20px',
            paddingBottom: '16px',
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
            minHeight: userData && (posterPreview || userData.store_poster_image)
              ? '80px'
              : 'auto'
          }}>
            <div className="profile-header-details" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '100%', paddingBottom: 0, overflow: 'visible' }}>
              {/* نمایش ستاره‌ها - div جداگانه با فضای ثابت */}
              <div style={{
                width: '100%',
                height: '20px',
                minHeight: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '4px',
                marginBottom: '8px',
                flexShrink: 0,
                pointerEvents: 'none'
              }}>
                {renderStars(displayRating)}
                {displayRating > 0 && (
                  <span style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginRight: '4px',
                    lineHeight: '1'
                  }}>
                    {displayRating.toFixed(1)}
                  </span>
                )}
              </div>
              
                {/* نمایش تعداد دنبال‌کننده‌ها و دنبال‌شونده‌ها - فقط در حالت فروشگاه */}
                {(
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginTop: 'auto',
                    marginBottom: '-12px',
                    paddingTop: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px'
                    }}>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#ffffff'
                      }}>
                        {userData.followers_count || 0}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}>
                        دنبال‌کننده
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px'
                    }}>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#ffffff'
                      }}>
                        {userData.following_count || 0}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}>
                        دنبال‌شونده
                      </span>
                    </div>
                  </div>
                )}
              </div>
            
            {/* دکمه‌ها در سمت راست */}
            {(
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '8px', 
                flexShrink: 0,
                position: 'relative'
              }}>
              
                {/* دکمه follow/unfollow - فقط برای کاربران دیگر */}
                {currentUserId && currentUserId !== userId && (
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
                
                {/* دکمه ویرایش - فقط برای کاربر جاری */}
                {currentUserId === userId && (
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
                
                {/* فلش پایین برای باز/بسته کردن اطلاعات فروشگاه */}
                {shouldShowStoreHeader && 
                 (userData.store_name || userData.store_description || userData.working_hours_sat_wed || userData.working_hours_thu || userData.instagram_url || userData.telegram_url || userData.whatsapp_url) && (
                  <button
                    onClick={() => setIsStoreInfoExpanded(!isStoreInfoExpanded)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{
                        transform: isStoreInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

        {/* بخش کشویی اطلاعات فروشگاه - در داخل header */}
        {shouldShowStoreHeader && (userData.store_name || userData.store_description || userData.working_hours_sat_wed || userData.working_hours_thu || userData.instagram_url || userData.telegram_url || userData.whatsapp_url) && (
          <div 
            style={{
              maxHeight: isStoreInfoExpanded ? '2000px' : '0px',
              overflow: 'hidden',
              opacity: isStoreInfoExpanded ? 1 : 0,
              marginTop: isStoreInfoExpanded ? '12px' : '0px',
              borderTop: isStoreInfoExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              paddingTop: isStoreInfoExpanded ? '12px' : '0px',
              transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease, margin-top 0.3s ease, padding-top 0.3s ease'
            }}
          >
            <div 
              style={{
                padding: '16px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              {/* توضیحات فروشگاه */}
              {userData.store_description && (
                <div style={{
                  marginBottom: '20px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '13px',
                    marginBottom: '8px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    درباره فروشگاه
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {userData.store_description}
                  </div>
                </div>
              )}

              {/* ساعت کاری */}
              {(userData.working_hours_sat_wed || userData.working_hours_thu) && (
                <div style={{
                  marginBottom: '20px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '13px',
                    marginBottom: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ساعت کاری
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {userData.working_hours_sat_wed && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px'
                      }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                          شنبه تا چهارشنبه
                        </span>
                        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 500, direction: 'ltr' }}>
                          {userData.working_hours_sat_wed}
                        </span>
                      </div>
                    )}
                    {userData.working_hours_thu && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px'
                      }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                          پنج‌شنبه
                        </span>
                        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 500, direction: 'ltr' }}>
                          {userData.working_hours_thu}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* شبکه‌های اجتماعی */}
              {(userData.instagram_url || userData.telegram_url || userData.whatsapp_url) && (
                <div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '13px',
                    marginBottom: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                    شبکه‌های اجتماعی
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    {userData.instagram_url && (
                      <a 
                        href={userData.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                        اینستاگرام
                      </a>
                    )}
                    {userData.telegram_url && (
                      <a 
                        href={userData.telegram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        تلگرام
                      </a>
                    )}
                    {userData.whatsapp_url && (
                      <a 
                        href={userData.whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        واتساپ
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
        )}

        {/* بخش ویرایش پروفایل */}
        {isEditing && (
          <EditStoreProfile
            userId={userId}
            editData={editData}
            setEditData={setEditData}
            userData={userData}
            setUserData={setUserData}
            errors={errors}
            handleChange={handleChange}
            isSaving={isSaving}
            saveMessage={saveMessage}
            setSaveMessage={setSaveMessage}
            isUploadingImage={isUploadingImage}
            setIsUploadingImage={setIsUploadingImage}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            isUploadingPoster={isUploadingPoster}
            setIsUploadingPoster={setIsUploadingPoster}
            posterPreview={posterPreview}
            setPosterPreview={setPosterPreview}
            handleSave={handleSave}
          />
        )}

        {/* دکمه‌ها در حالت edit - در انتهای صفحه */}
        {isEditing && (
          <div style={{
            padding: '0',
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'rgba(239, 68, 68, 0.7)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(239, 68, 68, 0.9)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  خروج
                </button>
              )}
              {onDeleteAccount && (
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'rgba(239, 68, 68, 0.7)',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 400,
                    opacity: isDeleting ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.color = 'rgba(239, 68, 68, 0.9)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'
                    }
                  }}
                >
                  {isDeleting ? 'در حال حذف...' : 'حذف حساب'}
                </button>
              )}
          </div>
        )}

        {/* دکمه انصراف شناور در پایین صفحه */}
        {isEditing && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 11000,
            display: 'flex',
            justifyContent: 'flex-start'
          }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              انصراف
            </button>
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

