'use client'

import { useState, useEffect, useCallback } from 'react'
import CityMap from '@/components/CityMap'
import AdForm from '@/components/AdForm'
import Profile from '@/components/Profile'
import StoreProfile from '@/components/StoreProfile'
import AdCreationForm from '@/components/AdCreationForm'
import AdCard from '@/components/AdCard'
import AdDetails from '@/components/AdDetails'
import Messenger from '../components/Messenger'
import StoreView from '@/components/StoreView'
import MyStoresCarousel from '@/components/MyStoresCarousel'
import SavedItems from '@/components/SavedItems'
import StoreCard from '@/components/StoreCard'
import Leaderboard from '@/components/Leaderboard'

export default function Home() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerHeight, setDrawerHeight] = useState(80) // ارتفاع به درصد
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartHeight, setDragStartHeight] = useState(80)
  const [searchValue, setSearchValue] = useState('')
  const [radius, setRadius] = useState(1000) // شعاع محدوده به متر (1000 تا 20000) - از 1 کیلومتر شروع می‌شود
  const [adFormPosition, setAdFormPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [showAdCreationForm, setShowAdCreationForm] = useState(false)
  const [refreshAds, setRefreshAds] = useState(0)
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userHasLocation, setUserHasLocation] = useState(false)
  const [isChangingLocation, setIsChangingLocation] = useState(false)
  const [oldLocation, setOldLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [showAdDetails, setShowAdDetails] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [showMessenger, setShowMessenger] = useState(false)
  const [chatWithUserId, setChatWithUserId] = useState<number | null>(null)
  const [showStoreView, setShowStoreView] = useState(false)
  const [selectedStoreUserId, setSelectedStoreUserId] = useState<number | null>(null)
  const [isStore, setIsStore] = useState(false)
  const [upgradeToStore, setUpgradeToStore] = useState(false)
  const [showSavedItems, setShowSavedItems] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [selectedMarkerType, setSelectedMarkerType] = useState<'all' | 'store' | 'product' | 'service' | 'event'>('all')

  // تابع دریافت محصولات
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  // به‌روزرسانی محصولات وقتی refreshAds تغییر می‌کند
  useEffect(() => {
    if (isDrawerOpen && !showProfile && !showAdCreationForm && !adFormPosition && !showRegistrationForm) {
      fetchProducts()
    }
  }, [refreshAds, isDrawerOpen, showProfile, showAdCreationForm, adFormPosition, showRegistrationForm, fetchProducts])
  
  // بارگذاری محصولات هنگام شروع
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // بارگذاری userId از localStorage در ابتدا و چک کردن لوکیشن
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedUserId = localStorage.getItem('userId')
    if (savedUserId) {
      const id = parseInt(savedUserId)
      setUserId(id)
      // چک کردن لوکیشن کاربر و is_store
      fetch(`/api/ads/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            if (data.data.lat && data.data.lng) {
              setUserHasLocation(true)
              setUserLocation({ lat: data.data.lat, lng: data.data.lng })
            } else {
              setUserHasLocation(false)
              setUserLocation(null)
            }
            // چک کردن is_store
            setIsStore(data.data.is_store === 1 || data.data.is_store === true)
          } else {
            setUserHasLocation(false)
            setUserLocation(null)
            setIsStore(false)
          }
        })
        .catch(() => {
          setUserHasLocation(false)
          setUserLocation(null)
          setIsStore(false)
        })
    } else {
      setUserHasLocation(false)
      setUserLocation(null)
    }
  }, [])
  
  // چک کردن لوکیشن کاربر فقط وقتی userId تغییر می‌کند (نه refreshAds)
  // موقعیت از دیتابیس فقط زمانی لود می‌شود که userId تغییر کند یا userLocation null باشد
  useEffect(() => {
    if (userId && !userLocation) {
      // فقط اگر موقعیت در state وجود ندارد، از دیتابیس بگیر
      fetch(`/api/ads/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            // چک کردن is_store
            setIsStore(data.data.is_store === 1 || data.data.is_store === true)
            
            if (data.data.lat && data.data.lng) {
              setUserHasLocation(true)
              setUserLocation({ lat: data.data.lat, lng: data.data.lng })
            } else {
              setUserHasLocation(false)
              setUserLocation(null)
              
              // اگر موقعیت pending وجود دارد، آن را ذخیره کن
              if (typeof window !== 'undefined') {
                const pendingLocationStr = localStorage.getItem('pendingLocation')
                if (pendingLocationStr) {
                  try {
                    const pendingLocation = JSON.parse(pendingLocationStr)
                    console.log('موقعیت pending پیدا شد، در حال ذخیره...', pendingLocation)
                    
                    // ذخیره موقعیت در دیتابیس
                    fetch(`/api/ads/${userId}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        lat: pendingLocation.lat,
                        lng: pendingLocation.lng
                      })
                    })
                    .then(res => res.json())
                    .then(result => {
                      if (result.success) {
                        console.log('✅ موقعیت pending با موفقیت ذخیره شد')
                        localStorage.removeItem('pendingLocation')
                        setUserLocation(pendingLocation)
                        setUserHasLocation(true)
                      } else {
                        console.error('❌ خطا در ذخیره موقعیت pending:', result.error)
                      }
                    })
                    .catch(error => {
                      console.error('❌ خطا در ارسال موقعیت pending:', error)
                    })
                  } catch (e) {
                    console.error('خطا در parse کردن موقعیت pending:', e)
                    localStorage.removeItem('pendingLocation')
                  }
                }
              }
            }
          } else {
            setIsStore(false)
          }
        })
        .catch(() => {
          setUserHasLocation(false)
          setUserLocation(null)
          setIsStore(false)
        })
    } else if (!userId) {
      setUserHasLocation(false)
      setUserLocation(null)
      setIsStore(false)
    }
    // فقط وقتی userId تغییر می‌کند یا userLocation null است، این effect اجرا می‌شود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // چک کردن is_store کاربر وقتی showProfile یا refreshAds تغییر می‌کند
  // اما اگر upgradeToStore true است، isStore را تغییر نده (برای اجازه دادن به ارتقا)
  useEffect(() => {
    const currentUserId = userId || (typeof window !== 'undefined' ? parseInt(localStorage.getItem('userId') || '0') : 0)
    if (showProfile && currentUserId && !upgradeToStore) {
      fetch(`/api/ads/${currentUserId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setIsStore(data.data.is_store === 1 || data.data.is_store === true)
          } else {
            setIsStore(false)
          }
        })
        .catch(() => {
          setIsStore(false)
        })
    }
  }, [showProfile, refreshAds, userId, upgradeToStore])

  // ذخیره userId در localStorage وقتی تغییر می‌کند
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (userId) {
      localStorage.setItem('userId', userId.toString())
    } else {
      localStorage.removeItem('userId')
    }
  }, [userId])

  const handleDrawerToggle = async () => {
    // اگر در حال تغییر موقعیت است، اجازه باز کردن drawer را نده
    if (isChangingLocation) {
      alert('لطفاً ابتدا موقعیت جدید خود را انتخاب کنید.')
      return
    }
    
    if (!isDrawerOpen) {
      setShowMessenger(false)
      setIsDrawerOpen(true)
      setDrawerHeight(80)
      setShowProfile(false) // نمایش Your City
      setAdFormPosition(null)
      setShowAdCreationForm(false)
      setShowRegistrationForm(false)
      // دریافت محصولات هنگام باز کردن drawer
      await fetchProducts()
    } else {
      // بستن drawer و reset کردن تمام محتوای داخل
      setShowMessenger(false)
      setIsDrawerOpen(false)
      setShowProfile(false)
      setShowRegistrationForm(false)
      setShowStoreView(false)
      setSelectedStoreUserId(null)
      setShowAdCreationForm(false)
      setAdFormPosition(null)
      setShowAdDetails(false)
      setSelectedProductId(null)
      setChatWithUserId(null)
      setShowSavedItems(false)
      setShowLeaderboard(false)
      setSelectedMarkerType('all')
    }
  }

  const handleHandleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setDragStartY(e.touches[0].clientY)
    setDragStartHeight(drawerHeight)
  }

  const handleHandleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentY = e.touches[0].clientY
    const deltaY = dragStartY - currentY // منفی یعنی بالا کشیدن
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0
    const newHeightPercent = windowHeight > 0 ? ((windowHeight - currentY) / windowHeight) * 100 : 80
    
    // محدود کردن بین 20% تا 100%
    const clampedHeight = Math.max(20, Math.min(100, newHeightPercent))
    setDrawerHeight(clampedHeight)
  }

  const handleHandleTouchEnd = () => {
    setIsDragging(false)
    
    // اگر ارتفاع کمتر از 25% شد، drawer را ببند و محتوای داخل را reset کن
    if (drawerHeight < 25) {
      setIsDrawerOpen(false)
      setDrawerHeight(80)
      // Reset تمام محتوای داخل drawer
      setShowStoreView(false)
      setSelectedStoreUserId(null)
      setShowProfile(false)
      setShowAdCreationForm(false)
      setShowRegistrationForm(false)
      setAdFormPosition(null)
      setShowAdDetails(false)
      setSelectedProductId(null)
      setShowMessenger(false)
      setChatWithUserId(null)
      setShowSavedItems(false)
      setShowLeaderboard(false)
      setSelectedMarkerType('all')
    }
  }

  return (
    <div className="container">
      {/* پس‌زمینه نقشه شهر */}
      <div className="city-map-background"></div>
      
      {/* Toast Notification */}
      {toast && (
        <div 
          className="toast-notification"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: toast.type === 'success' 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : toast.type === 'error'
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#ffffff',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '90%',
            animation: 'slideDown 0.3s ease-out',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div style={{ fontSize: '20px' }}>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </div>
          <div style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>
            {toast.message}
          </div>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isSavingLocation && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
            padding: '32px 40px',
            borderRadius: '16px',
            color: '#ffffff',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(59, 130, 246, 0.2)',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>
              در حال ذخیره موقعیت...
            </div>
          </div>
        </div>
      )}
      
      {/* نقشه شهر */}
            <CityMap 
              whiteHillsRadius={radius}
              products={products}
              userHasLocation={userHasLocation}
              userLocation={userLocation}
              isChangingLocation={isChangingLocation}
              onChangeLocation={() => {
                // شروع فرآیند تغییر موقعیت
                if (userLocation) {
                  setOldLocation(userLocation) // ذخیره موقعیت قبلی (بدون حذف از دیتابیس)
                  setUserLocation(null) // حذف marker از نقشه
                  setUserHasLocation(false) // غیرفعال کردن نمایش موقعیت
                  setIsChangingLocation(true) // فعال کردن حالت تغییر موقعیت
                  
                  // بستن drawer و غیرفعال کردن تعاملات
                  setIsDrawerOpen(false)
                  setShowProfile(false)
                  setShowAdCreationForm(false)
                  setShowRegistrationForm(false)
                  setAdFormPosition(null)
              setShowMessenger(false)
                  setShowStoreView(false)
                  
                  // نمایش پیام راهنما
                  setTimeout(() => {
                    setToast({ 
                      message: 'لطفاً موقعیت جدید خود را روی نقشه انتخاب کنید', 
                      type: 'info' 
                    })
                    setTimeout(() => setToast(null), 4000)
                  }, 300)
                }
              }}
              onStoreClick={(storeUserId) => {
                setSelectedStoreUserId(storeUserId)
                setShowStoreView(true)
                setShowProfile(false)
                setShowAdCreationForm(false)
                setShowRegistrationForm(false)
                setShowAdDetails(false)
                setShowMessenger(false)
                setIsDrawerOpen(true)
                setDrawerHeight(80)
              }}
              onAdMarkerClick={(position) => {
                // اگر در حال تغییر موقعیت است، اجازه کلیک روی آگهی‌ها را نده
                if (isChangingLocation) {
                  setToast({ 
                    message: 'لطفاً ابتدا موقعیت جدید خود را انتخاب کنید', 
                    type: 'info' 
                  })
                  setTimeout(() => setToast(null), 3000)
                  return
                }
                setAdFormPosition(position)
                setShowRegistrationForm(false)
                setIsDrawerOpen(true)
                setDrawerHeight(80)
                setShowMessenger(false)
              }}
              onAdCardClick={(productId) => {
                setSelectedProductId(productId)
                setShowAdDetails(true)
                setShowProfile(false)
                setShowAdCreationForm(false)
                setShowRegistrationForm(false)
                setAdFormPosition(null)
                setIsDrawerOpen(true)
                setDrawerHeight(80)
                setShowMessenger(false)
              }}
              onLocationSet={async (position) => {
                console.log('onLocationSet called:', { position, isChangingLocation })
                
                // اگر در حال تغییر موقعیت است، موقعیت جدید را ذخیره کن
                if (isChangingLocation) {
                  console.log('در حال تغییر موقعیت - ذخیره موقعیت جدید:', position)
                  
                  // ذخیره موقعیت جدید در دیتابیس
                  const targetUserId = userId || (typeof window !== 'undefined' ? parseInt(localStorage.getItem('userId') || '0') : 0)
                  
                  console.log('targetUserId:', targetUserId)
                  
                  if (targetUserId && targetUserId > 0) {
                    setIsSavingLocation(true)
                    try {
                      console.log('ارسال درخواست به API:', { userId: targetUserId, lat: position.lat, lng: position.lng })
                      
                      const response = await fetch(`/api/ads/${targetUserId}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          lat: position.lat,
                          lng: position.lng
                        })
                      })
                      
                      console.log('Response status:', response.status)
                      const data = await response.json()
                      console.log('Response data:', data)
                      
                      if (response.ok && data.success) {
                        console.log('✅ موقعیت جدید با موفقیت ذخیره شد')
                        
                        // جایگزین کردن موقعیت قبلی با موقعیت جدید
                        // به‌روزرسانی تمام state ها بدون نیاز به refresh
                        setIsSavingLocation(false)
                        setIsChangingLocation(false)
                        setOldLocation(null)
                        
                        // به‌روزرسانی موقعیت بلافاصله
                        setUserLocation(position)
                        setUserHasLocation(true)
                        console.log('موقعیت جدید در state تنظیم شد:', position)
                        
                        // فقط برای به‌روزرسانی Profile component (نه location)
                        setRefreshAds(prev => prev + 1)
                        
                        setToast({ 
                          message: 'موقعیت جدید با موفقیت ذخیره شد', 
                          type: 'success' 
                        })
                        setTimeout(() => setToast(null), 3000)
                        
                        // بازگشت به پروفایل
                        setTimeout(() => {
                          setIsDrawerOpen(true)
                          setDrawerHeight(80)
                          setShowProfile(true)
                          setShowAdCreationForm(false)
                          setShowRegistrationForm(false)
                          setAdFormPosition(null)
                        setShowMessenger(false)
                        }, 500)
                      } else {
                        console.error('❌ خطا در ذخیره موقعیت جدید:', data.error)
                        setIsSavingLocation(false)
                        setToast({ 
                          message: 'خطا در ذخیره موقعیت جدید: ' + (data.error || 'خطای ناشناخته'), 
                          type: 'error' 
                        })
                        setTimeout(() => setToast(null), 4000)
                        // بازگشت به موقعیت قبلی در صورت خطا
                        if (oldLocation) {
                          setUserLocation(oldLocation)
                          setUserHasLocation(true)
                          setIsChangingLocation(false)
                          setOldLocation(null)
                        }
                      }
                    } catch (error) {
                      console.error('❌ خطا در ارسال موقعیت جدید به سرور:', error)
                      setIsSavingLocation(false)
                      setToast({ 
                        message: 'خطا در ارسال موقعیت جدید به سرور. لطفاً دوباره تلاش کنید', 
                        type: 'error' 
                      })
                      setTimeout(() => setToast(null), 4000)
                      // بازگشت به موقعیت قبلی در صورت خطا
                      if (oldLocation) {
                        setUserLocation(oldLocation)
                        setUserHasLocation(true)
                        setIsChangingLocation(false)
                        setOldLocation(null)
                      }
                    }
                  } else {
                    console.error('❌ userId نامعتبر:', targetUserId)
                    setToast({ 
                      message: 'خطا: شناسه کاربر یافت نشد', 
                      type: 'error' 
                    })
                    setTimeout(() => setToast(null), 3000)
                    // بازگشت به موقعیت قبلی در صورت خطا
                    if (oldLocation) {
                      setUserLocation(oldLocation)
                      setUserHasLocation(true)
                      setIsChangingLocation(false)
                      setOldLocation(null)
                    }
                  }
                  return
                }
                
                // کد قبلی برای انتخاب موقعیت اولیه یا تغییر موقعیت
                console.log('onLocationSet called with position:', position)
                
                // ذخیره مقدار قبلی userHasLocation قبل از به‌روزرسانی
                const hadLocationBefore = userHasLocation
                
                setUserLocation(position)
                setUserHasLocation(true)
                
                // دریافت userId از state یا localStorage
                let currentUserId = userId
                console.log('Current userId from state:', currentUserId)
                
                if (!currentUserId && typeof window !== 'undefined') {
                  const savedUserId = localStorage.getItem('userId')
                  console.log('userId from localStorage:', savedUserId)
                  if (savedUserId) {
                    currentUserId = parseInt(savedUserId)
                    console.log('Parsed userId from localStorage:', currentUserId)
                  }
                }
                
                // اگر userId وجود دارد، موقعیت را در دیتابیس ذخیره کن
                if (currentUserId) {
                  try {
                    console.log('در حال ذخیره موقعیت در دیتابیس...', { 
                      userId: currentUserId, 
                      position,
                      lat: position.lat,
                      lng: position.lng,
                      hadLocationBefore
                    })
                    
                    const requestBody = {
                      lat: position.lat,
                      lng: position.lng
                    }
                    
                    console.log('Request body:', JSON.stringify(requestBody))
                    console.log('API URL:', `/api/ads/${currentUserId}`)
                    
                    const response = await fetch(`/api/ads/${currentUserId}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(requestBody)
                    })
                    
                    console.log('Response status:', response.status)
                    console.log('Response ok:', response.ok)
                    
                    const data = await response.json()
                    console.log('Response data:', data)
                    
                    if (response.ok && data.success) {
                      console.log('✅ موقعیت با موفقیت در دیتابیس ذخیره شد:', data)
                      
                      // اگر userId در state نیست اما در localStorage هست، آن را تنظیم کن
                      if (!userId && currentUserId) {
                        setUserId(currentUserId)
                        console.log('userId به state اضافه شد:', currentUserId)
                      }
                      
                      // نمایش پیام موفقیت برای تغییر موقعیت
                      if (hadLocationBefore) {
                        setToast({ 
                          message: 'موقعیت با موفقیت تغییر یافت', 
                          type: 'success' 
                        })
                        setTimeout(() => setToast(null), 3000)
                      }
                      
                      // به‌روزرسانی state برای اطمینان از همگام بودن
                      // refreshAds برای به‌روزرسانی سایر کامپوننت‌ها (مثل Profile)
                      setRefreshAds(prev => prev + 1)
                      
                      // اگر userId وجود دارد و موقعیت قبلی نداشت، به پروفایل برگرد
                      // اگر موقعیت قبلی داشت، فقط نقشه را به‌روزرسانی کن (drawer را باز نکن)
                      const targetUserId = currentUserId || userId
                      console.log('برگشت به پروفایل - userId از state:', userId, 'currentUserId:', currentUserId, 'targetUserId:', targetUserId, 'hadLocationBefore:', hadLocationBefore)
                      
                      if (targetUserId && !hadLocationBefore) {
                        // فقط برای اولین بار که موقعیت تنظیم می‌شود، به پروفایل برگرد
                        // اطمینان از اینکه userId در state تنظیم شده است
                        if (!userId && currentUserId) {
                          setUserId(currentUserId)
                          console.log('userId به state اضافه شد:', currentUserId)
                        }
                        
                        console.log('باز کردن drawer و نمایش پروفایل - userId:', targetUserId)
                        
                        // باز کردن drawer و نمایش پروفایل
                        // استفاده از targetUserId که در closure موجود است
                        setIsDrawerOpen(true)
                        setDrawerHeight(80)
                        setShowProfile(true)
                        setShowAdCreationForm(false)
                        setShowRegistrationForm(false)
                        setAdFormPosition(null)
                        setShowMessenger(false)
                        
                        // اطمینان از اینکه userId در state تنظیم شده است
                        // استفاده از targetUserId که در closure موجود است
                        if (!userId && targetUserId) {
                          setUserId(targetUserId)
                        }
                      }
                    } else {
                      console.error('❌ خطا در ذخیره موقعیت:', data)
                      setToast({ 
                        message: 'خطا در ذخیره موقعیت: ' + (data.error || 'خطای ناشناخته'), 
                        type: 'error' 
                      })
                      setTimeout(() => setToast(null), 4000)
                    }
                  } catch (error) {
                    console.error('❌ خطا در ارسال موقعیت به سرور:', error)
                    setToast({ 
                      message: 'خطا در ارسال موقعیت به سرور. لطفاً دوباره تلاش کنید.', 
                      type: 'error' 
                    })
                    setTimeout(() => setToast(null), 4000)
                  }
                } else {
                  console.warn('⚠️ userId موجود نیست، موقعیت فقط در state ذخیره شد')
                  console.log('userId state:', userId)
                  console.log('localStorage:', typeof window !== 'undefined' ? localStorage.getItem('userId') : 'N/A')
                  
                  // ذخیره موقعیت موقت در localStorage تا بعد از لاگین ذخیره شود
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('pendingLocation', JSON.stringify(position))
                    console.log('موقعیت موقت در localStorage ذخیره شد')
                  }
                  
                  // نمایش فرم لاگین/ثبت‌نام برای کاربر
                  setIsDrawerOpen(true)
                  setDrawerHeight(80)
                  setAdFormPosition(position)
                  setShowProfile(false)
                  setShowAdCreationForm(false)
                  setShowRegistrationForm(false)
                  setShowMessenger(false)
                  
                  // نمایش پیام به کاربر
                  alert('برای ثبت موقعیت، لطفاً ابتدا لاگین کنید یا ثبت‌نام کنید.')
                }
              }}
            />
      
      {/* Header بالای صفحه */}
      <div className={`top-header ${isDrawerOpen ? 'drawer-open' : ''}`}>
        <button className="header-button settings-button" aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        
        <input
          type="search"
          className="header-search-input"
          placeholder="جستجو..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        
        <button className="header-button help-button" aria-label="Help">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </button>
      </div>
      
      {/* Wrapper ثابت برای کانتینرها و نوار */}
      <div className="fixed-ui-wrapper">
        {/* ردیف کانتینرها */}
        <div className="containers-row">
        {/* کانتینر کارت White Hills و آمار */}
        <div className="white-hills-wrapper">
        {/* کارت بالا سمت چپ - همیشه نمایش داده می‌شود اما وقتی موقعیت ثبت نشده غیرفعال است */}
        <div className={`top-left-card ${!userHasLocation ? 'disabled' : ''}`}>
          {/* بخش فروشگاه‌های من */}
          <div className="my-stores-section">
            <div className="my-stores-content">
              <MyStoresCarousel userId={userId} />
            </div>
          </div>
          
          {/* جداکننده */}
          <div className="card-divider"></div>
          
          <div className="card-content">
            <div className="radius-control-row">
            <div className="level-info">
              <span>شعاع محدوده</span>
              <span className="next-level">{radius >= 1000 ? `${(radius / 1000).toFixed(radius % 1000 === 0 ? 0 : 1)} کیلومتر` : `${radius} متر`}</span>
            </div>
            <div className="progress-bar-container">
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="radius-slider"
                disabled={!userHasLocation}
              />
              </div>
            </div>
          </div>
        </div>
        
        {/* کانتینر آمار */}
        <div className="stats-container">
          <div className="stats">
            <div className="stat-item">
              <div className="stat-icon">🏠</div>
              <span>52</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon">👥</div>
              <span>431</span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* نوار پایینی / پرده Your City */}
      <div 
        className={`bottom-navigation-bar ${isDrawerOpen ? 'drawer-open' : ''} ${isDragging ? 'dragging' : ''} ${showAdDetails ? 'ad-details-open' : ''}`}
        style={isDrawerOpen ? { height: `${drawerHeight}vh` } : {}}
      >
        {isDrawerOpen && (
          <>
            <div 
              className="drawer-drag-handle"
              onTouchStart={handleHandleTouchStart}
              onTouchMove={handleHandleTouchMove}
              onTouchEnd={handleHandleTouchEnd}
            ></div>
            <div className={`city-drawer-content ${showProfile && userId ? 'profile-active' : ''} ${showAdCreationForm && userId ? 'ad-creation-active' : ''} ${adFormPosition ? 'ad-form-active' : ''} ${showRegistrationForm ? 'registration-form-active' : ''} ${showAdDetails ? 'ad-details-active' : ''} ${showMessenger ? 'messenger-active' : ''} ${showStoreView ? 'store-view-active' : ''} ${showSavedItems ? 'saved-items-active' : ''} ${showLeaderboard ? 'leaderboard-active' : ''} ${!showProfile && !showAdCreationForm && !adFormPosition && !showRegistrationForm && !showAdDetails && !showMessenger && !showStoreView && !showSavedItems && !showLeaderboard ? 'your-city-active' : ''}`}>
                  {showLeaderboard ? (
                    <Leaderboard
                      currentUserId={userId}
                      onClose={() => {
                        setShowLeaderboard(false)
                        // برگشت به Your City بدون بستن drawer
                        setShowProfile(false)
                        setShowAdCreationForm(false)
                        setShowRegistrationForm(false)
                        setAdFormPosition(null)
                        setShowAdDetails(false)
                        setShowMessenger(false)
                        setShowStoreView(false)
                        setShowSavedItems(false)
                      }}
                    />
                  ) : showSavedItems && userId ? (
                    <SavedItems
                      userId={userId}
                      onClose={() => {
                        setShowSavedItems(false)
                        // برگشت به Your City بدون بستن drawer
                        setShowProfile(false)
                        setShowAdCreationForm(false)
                        setShowRegistrationForm(false)
                        setAdFormPosition(null)
                        setShowAdDetails(false)
                        setShowMessenger(false)
                        setShowStoreView(false)
                      }}
                      onProductClick={(productId) => {
                        setSelectedProductId(productId)
                        setShowAdDetails(true)
                        setShowSavedItems(false)
                        setShowProfile(false)
                        setShowAdCreationForm(false)
                        setShowRegistrationForm(false)
                        setAdFormPosition(null)
                        setShowMessenger(false)
                      }}
                      onStoreClick={(storeUserId) => {
                        setSelectedStoreUserId(storeUserId)
                        setShowStoreView(true)
                        setShowSavedItems(false)
                        setShowProfile(false)
                        setShowAdCreationForm(false)
                        setShowRegistrationForm(false)
                        setShowAdDetails(false)
                        setShowMessenger(false)
                      }}
                    />
                  ) : showStoreView && selectedStoreUserId ? (
                    <StoreView
                      userId={selectedStoreUserId}
                      onClose={() => {
                        setShowStoreView(false)
                        setSelectedStoreUserId(null)
                        // برگشت به Your City بدون بستن drawer
                        setShowProfile(false)
                        setShowAdCreationForm(false)
                        setShowRegistrationForm(false)
                        setAdFormPosition(null)
                        setShowAdDetails(false)
                        setShowMessenger(false)
                      }}
                      onChat={() => {
                        setChatWithUserId(selectedStoreUserId)
                        setShowMessenger(true)
                        setShowStoreView(false)
                      }}
                    />
                  ) : showAdDetails && selectedProductId ? (
                    <AdDetails
                      productId={selectedProductId}
                      currentUserId={userId}
                      onClose={() => {
                        setShowAdDetails(false)
                        setSelectedProductId(null)
                        // برگشت به Your City بدون بستن drawer
                        setShowProfile(false)
                        setShowAdCreationForm(false)
                        setShowRegistrationForm(false)
                        setAdFormPosition(null)
                        setShowMessenger(false)
                        setChatWithUserId(null)
                      }}
                      onStartChat={(ownerUserId: number) => {
                        // بستن AdDetails و باز کردن Messenger
                        setShowAdDetails(false)
                        setSelectedProductId(null)
                        setShowProfile(false)
                        setShowAdCreationForm(false)
                        setShowRegistrationForm(false)
                        setAdFormPosition(null)
                        // تنظیم userId برای شروع گفتگو
                        setChatWithUserId(ownerUserId)
                        setShowMessenger(true)
                        setIsDrawerOpen(true)
                        setDrawerHeight(80)
                      }}
                    />
                  ) : showMessenger ? (
                    <Messenger
                      onClose={() => {
                        setShowMessenger(false)
                        setIsDrawerOpen(false)
                        setChatWithUserId(null)
                      }}
                      onOpenProfile={() => {
                        if (userId) {
                          setShowMessenger(false)
                          setShowAdCreationForm(false)
                          setShowRegistrationForm(false)
                          setAdFormPosition(null)
                          setShowAdDetails(false)
                          setSelectedProductId(null)
                          setChatWithUserId(null)
                          setShowProfile(true)
                          setIsDrawerOpen(true)
                          setDrawerHeight(80)
                        }
                      }}
                      initialChatUserId={chatWithUserId || undefined}
                    />
                  ) : showAdCreationForm && userId ? (
                    <AdCreationForm 
                      userId={userId}
                      userLocation={userLocation}
                      onClose={() => {
                        setShowAdCreationForm(false)
                        setShowMessenger(false)
                      }}
                      onSuccess={() => {
                        setShowAdCreationForm(false)
                        setShowProfile(true)
                        setRefreshAds(prev => prev + 1)
                        setShowMessenger(false)
                      }}
                    />
                  ) : showRegistrationForm && !userId ? (
                    <AdForm 
                      onClose={() => {
                        setShowRegistrationForm(false)
                        setIsDrawerOpen(false)
                        setShowMessenger(false)
                      }}
                      position={null}
                      onSuccess={async (id) => {
                        setUserId(id)
                        setShowRegistrationForm(false)
                        setShowProfile(true) // بعد از ثبت، Profile را نمایش بده
                        setShowMessenger(false)
                        
                        // به‌روزرسانی موقعیت کاربر و وضعیت لوکیشن
                        let locationToSave = null
                        
                        // اگر موقعیت pending وجود دارد، از آن استفاده کن
                        if (typeof window !== 'undefined') {
                          const pendingLocationStr = localStorage.getItem('pendingLocation')
                          if (pendingLocationStr) {
                            try {
                              const pendingLocation = JSON.parse(pendingLocationStr)
                              locationToSave = pendingLocation
                              localStorage.removeItem('pendingLocation')
                              console.log('موقعیت pending استفاده شد:', pendingLocation)
                            } catch (e) {
                              console.error('خطا در parse کردن موقعیت pending:', e)
                            }
                          }
                        }
                        
                        if (locationToSave) {
                          setUserLocation(locationToSave)
                          setUserHasLocation(true)
                          
                          // ذخیره موقعیت در دیتابیس
                          try {
                            console.log('ذخیره موقعیت بعد از لاگین/ثبت‌نام:', { id, location: locationToSave })
                            const response = await fetch(`/api/ads/${id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                lat: locationToSave.lat,
                                lng: locationToSave.lng
                              })
                            })
                            
                            const data = await response.json()
                            
                            if (response.ok && data.success) {
                              console.log('✅ موقعیت با موفقیت در دیتابیس ذخیره شد')
                              setRefreshAds(prev => prev + 1)
                            } else {
                              console.error('❌ خطا در ذخیره موقعیت:', data.error)
                            }
                          } catch (error) {
                            console.error('❌ خطا در ارسال موقعیت به سرور:', error)
                          }
                        }
                        
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('userId', id.toString())
                        }
                      }}
                    />
                  ) : adFormPosition ? (
                    <AdForm 
                      onClose={() => {
                        setAdFormPosition(null)
                        setShowRegistrationForm(false)
                        setIsDrawerOpen(false)
                        setShowMessenger(false)
                      }}
                      position={adFormPosition}
                      onSuccess={async (id) => {
                        setUserId(id)
                        setAdFormPosition(null)
                        setShowRegistrationForm(false)
                        setShowProfile(true) // بعد از ثبت، Profile را نمایش بده
                        setShowMessenger(false)
                        
                        // به‌روزرسانی موقعیت کاربر و وضعیت لوکیشن
                        let locationToSave = adFormPosition
                        
                        // اگر موقعیت pending وجود دارد، از آن استفاده کن
                        if (typeof window !== 'undefined') {
                          const pendingLocationStr = localStorage.getItem('pendingLocation')
                          if (pendingLocationStr) {
                            try {
                              const pendingLocation = JSON.parse(pendingLocationStr)
                              locationToSave = pendingLocation
                              localStorage.removeItem('pendingLocation')
                              console.log('موقعیت pending استفاده شد:', pendingLocation)
                            } catch (e) {
                              console.error('خطا در parse کردن موقعیت pending:', e)
                            }
                          }
                        }
                        
                        if (locationToSave) {
                          setUserLocation(locationToSave)
                          setUserHasLocation(true)
                          
                          // ذخیره موقعیت در دیتابیس
                          try {
                            console.log('ذخیره موقعیت بعد از لاگین/ثبت‌نام:', { id, location: locationToSave })
                            const response = await fetch(`/api/ads/${id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                lat: locationToSave.lat,
                                lng: locationToSave.lng
                              })
                            })
                            
                            const data = await response.json()
                            
                            if (response.ok && data.success) {
                              console.log('✅ موقعیت با موفقیت در دیتابیس ذخیره شد')
                              setRefreshAds(prev => prev + 1)
                            } else {
                              console.error('❌ خطا در ذخیره موقعیت:', data.error)
                            }
                          } catch (error) {
                            console.error('❌ خطا در ارسال موقعیت به سرور:', error)
                          }
                        }
                        
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('userId', id.toString())
                        }
                      }}
                    />
                  ) : showProfile && (userId || (typeof window !== 'undefined' && localStorage.getItem('userId'))) ? (
                    (isStore || upgradeToStore) ? (
                      <StoreProfile 
                        userId={userId || (typeof window !== 'undefined' ? parseInt(localStorage.getItem('userId') || '0') : 0)}
                        refreshKey={refreshAds}
                        initialEditMode={upgradeToStore}
                        onLogout={() => {
                          setUserId(null)
                          setShowProfile(false)
                          setShowAdCreationForm(false)
                          setShowRegistrationForm(false)
                          setUserLocation(null)
                          setAdFormPosition(null)
                          setShowMessenger(false)
                          setIsStore(false)
                          setUpgradeToStore(false)
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem('userId')
                          }
                        }}
                        onDeleteAccount={() => {
                          setUserId(null)
                          setShowProfile(false)
                          setShowAdCreationForm(false)
                          setShowRegistrationForm(false)
                          setUserHasLocation(false)
                          setUserLocation(null)
                          setRefreshAds(prev => prev + 1)
                          setShowMessenger(false)
                          setIsStore(false)
                          setUpgradeToStore(false)
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem('userId')
                          }
                        }}
                        onClose={() => {
                          // اگر upgradeToStore true است، فقط upgradeToStore را false کنیم
                          // تا Profile نمایش داده شود (نه اینکه showProfile را false کنیم)
                          if (upgradeToStore) {
                            setUpgradeToStore(false)
                            // showProfile را true نگه می‌داریم تا Profile نمایش داده شود
                            setShowProfile(true)
                          } else {
                            // حالت عادی - بستن Profile
                          setIsDrawerOpen(false)
                          setShowProfile(false)
                          setShowRegistrationForm(false)
                          setShowMessenger(false)
                          }
                        }}
                        onCreateAd={() => {
                          setShowProfile(false)
                          setShowRegistrationForm(false)
                          setShowAdCreationForm(true)
                          setShowMessenger(false)
                          setUpgradeToStore(false)
                        }}
                        onSetLocation={() => {
                          // بستن drawer و آماده کردن برای انتخاب موقعیت
                          setIsDrawerOpen(false)
                          setShowProfile(false)
                          setShowAdCreationForm(false)
                          setShowRegistrationForm(false)
                          setAdFormPosition(null)
                          setShowMessenger(false)
                          
                          // نمایش راهنمایی به کاربر (با تأخیر کوتاه برای بسته شدن drawer)
                          setTimeout(() => {
                            // استفاده از یک toast یا notification بهتر
                            const message = 'لطفاً روی نقشه کلیک کنید و گزینه "موقعیت" را انتخاب کنید تا موقعیت خود را مشخص کنید.'
                            alert(message)
                          }, 500)
                        }}
                        onProfileUpdated={() => {
                          // به‌روزرسانی refreshAds برای چک کردن مجدد is_store
                          setUpgradeToStore(false)
                          setRefreshAds(prev => prev + 1)
                        }}
                      />
                    ) : (
                      <Profile 
                        userId={userId || (typeof window !== 'undefined' ? parseInt(localStorage.getItem('userId') || '0') : 0)}
                        refreshKey={refreshAds}
                        onLogout={() => {
                          setUserId(null)
                          setShowProfile(false)
                          setShowAdCreationForm(false)
                          setShowRegistrationForm(false)
                          setUserLocation(null)
                          setAdFormPosition(null)
                          setShowMessenger(false)
                          setIsStore(false)
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem('userId')
                          }
                        }}
                        onDeleteAccount={() => {
                          setUserId(null)
                          setShowProfile(false)
                          setShowAdCreationForm(false)
                          setShowRegistrationForm(false)
                          setUserHasLocation(false)
                          setUserLocation(null)
                          setRefreshAds(prev => prev + 1)
                          setShowMessenger(false)
                          setIsStore(false)
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem('userId')
                          }
                        }}
                        onClose={() => {
                          setIsDrawerOpen(false)
                          setShowProfile(false)
                          setShowRegistrationForm(false)
                          setShowMessenger(false)
                        }}
                        onCreateAd={() => {
                          setShowProfile(false)
                          setShowRegistrationForm(false)
                          setShowAdCreationForm(true)
                          setShowMessenger(false)
                        }}
                        onSetLocation={() => {
                          // بستن drawer و آماده کردن برای انتخاب موقعیت
                          setIsDrawerOpen(false)
                          setShowProfile(false)
                          setShowAdCreationForm(false)
                          setShowRegistrationForm(false)
                          setAdFormPosition(null)
                          setShowMessenger(false)
                          
                          // نمایش راهنمایی به کاربر (با تأخیر کوتاه برای بسته شدن drawer)
                          setTimeout(() => {
                            // استفاده از یک toast یا notification بهتر
                            const message = 'لطفاً روی نقشه کلیک کنید و گزینه "موقعیت" را انتخاب کنید تا موقعیت خود را مشخص کنید.'
                            alert(message)
                          }, 500)
                        }}
                        onUpgradeToStore={() => {
                          // ارتقا به فروشگاه - نمایش StoreProfile با حالت ویرایش
                          setUpgradeToStore(true)
                          setShowProfile(true)
                        }}
                      />
                    )
                  ) : (
                    <div className="city-drawer-your-city">
                      <div className="drawer-header">
                        {/* لژند مارکرها */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'nowrap',
                          overflowX: 'auto',
                          paddingBottom: '4px',
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none'
                        }} className="marker-legend-scroll">
                          {/* مارکر فروشگاه */}
                          <div 
                            onClick={() => setSelectedMarkerType(selectedMarkerType === 'store' ? 'all' : 'store')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                              background: selectedMarkerType === 'store' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                              border: selectedMarkerType === 'store' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedMarkerType !== 'store') {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedMarkerType !== 'store') {
                                e.currentTarget.style.background = 'transparent'
                              }
                            }}
                          >
                            <div style={{
                              width: '24px',
                              height: '30px',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="24" height="30" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}>
                                <defs>
                                  <linearGradient id="storeGradient-legend" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#8b0000', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#8b0000', stopOpacity: 1 }} />
                                  </linearGradient>
                                </defs>
                                <circle cx="18" cy="18" r="10" fill="url(#storeGradient-legend)" />
                                <circle cx="18" cy="18" r="9.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                                <circle cx="18" cy="18" r="7" fill="white" opacity="0.95" />
                                <circle cx="18" cy="18" r="6" fill="#8b0000" />
                                <g transform="translate(18, 18) scale(0.5)" fill="white" stroke="white" strokeWidth="2">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                  <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </g>
                                <circle cx="18" cy="32" r="2.5" fill="url(#storeGradient-legend)" />
                                <rect x="17.5" y="26" width="1" height="4" fill="url(#storeGradient-legend)" opacity="0.6" rx="0.5"/>
                              </svg>
                            </div>
                            <span style={{
                              fontSize: '10px',
                              color: 'rgba(255, 255, 255, 0.7)',
                              whiteSpace: 'nowrap'
                            }}>فروشگاه</span>
                          </div>
                          
                          {/* مارکر آگهی */}
                          <div 
                            onClick={() => setSelectedMarkerType(selectedMarkerType === 'product' ? 'all' : 'product')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                              background: selectedMarkerType === 'product' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                              border: selectedMarkerType === 'product' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedMarkerType !== 'product') {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedMarkerType !== 'product') {
                                e.currentTarget.style.background = 'transparent'
                              }
                            }}
                          >
                            <div style={{
                              width: '24px',
                              height: '30px',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="24" height="30" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}>
                                <defs>
                                  <linearGradient id="adGradient-legend" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#ff6b35', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#ff8c55', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#ff6b35', stopOpacity: 1 }} />
                                  </linearGradient>
                                </defs>
                                <circle cx="18" cy="18" r="10" fill="url(#adGradient-legend)" />
                                <circle cx="18" cy="18" r="9.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                                <circle cx="18" cy="18" r="7" fill="white" opacity="0.95" />
                                <circle cx="18" cy="18" r="6" fill="#ff6b35" />
                                <g transform="translate(18, 18) scale(0.6)" fill="white" stroke="white" strokeWidth="3">
                                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </g>
                                <circle cx="18" cy="32" r="2.5" fill="url(#adGradient-legend)" />
                                <rect x="17.5" y="26" width="1" height="4" fill="url(#adGradient-legend)" opacity="0.6" rx="0.5"/>
                              </svg>
                            </div>
                            <span style={{
                              fontSize: '10px',
                              color: 'rgba(255, 255, 255, 0.7)',
                              whiteSpace: 'nowrap'
                            }}>آگهی</span>
                          </div>

                          {/* مارکر سرویس (سبز) */}
                          <div 
                            onClick={() => setSelectedMarkerType(selectedMarkerType === 'service' ? 'all' : 'service')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                              background: selectedMarkerType === 'service' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                              border: selectedMarkerType === 'service' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedMarkerType !== 'service') {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedMarkerType !== 'service') {
                                e.currentTarget.style.background = 'transparent'
                              }
                            }}
                          >
                            <div style={{
                              width: '24px',
                              height: '30px',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="24" height="30" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}>
                                <defs>
                                  <linearGradient id="serviceGradient-legend" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#34d399', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                                  </linearGradient>
                                </defs>
                                <circle cx="18" cy="18" r="10" fill="url(#serviceGradient-legend)" />
                                <circle cx="18" cy="18" r="9.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                                <circle cx="18" cy="18" r="7" fill="white" opacity="0.95" />
                                <circle cx="18" cy="18" r="6" fill="#10b981" />
                                <g transform="translate(18, 18) scale(0.5)" fill="white" stroke="white" strokeWidth="2">
                                  <path d="M12 2l3.09 6.26L22 9.27l-4 3.89L18.18 21 12 17.77 5.82 21 7 13.16l-4-3.89 6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </g>
                                <circle cx="18" cy="32" r="2.5" fill="url(#serviceGradient-legend)" />
                                <rect x="17.5" y="26" width="1" height="4" fill="url(#serviceGradient-legend)" opacity="0.6" rx="0.5"/>
                              </svg>
                            </div>
                            <span style={{
                              fontSize: '10px',
                              color: 'rgba(255, 255, 255, 0.7)',
                              whiteSpace: 'nowrap'
                            }}>سرویس</span>
                          </div>

                          {/* مارکر رویداد (بنفش) */}
                          <div 
                            onClick={() => setSelectedMarkerType(selectedMarkerType === 'event' ? 'all' : 'event')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                              background: selectedMarkerType === 'event' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                              border: selectedMarkerType === 'event' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedMarkerType !== 'event') {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedMarkerType !== 'event') {
                                e.currentTarget.style.background = 'transparent'
                              }
                            }}
                          >
                            <div style={{
                              width: '24px',
                              height: '30px',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="24" height="30" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}>
                                <defs>
                                  <linearGradient id="eventGradient-legend" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                                  </linearGradient>
                                </defs>
                                <circle cx="18" cy="18" r="10" fill="url(#eventGradient-legend)" />
                                <circle cx="18" cy="18" r="9.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                                <circle cx="18" cy="18" r="7" fill="white" opacity="0.95" />
                                <circle cx="18" cy="18" r="6" fill="#8b5cf6" />
                                <g transform="translate(18, 18) scale(0.5)" fill="white" stroke="white" strokeWidth="2.5">
                                  <rect x="3" y="5" width="18" height="16" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                  <line x1="16" y1="3" x2="16" y2="7" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="8" y1="3" x2="8" y2="7" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="3" y1="11" x2="21" y2="11" strokeLinecap="round" strokeLinejoin="round"/>
                                  <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
                                  <circle cx="16" cy="15" r="1.5" fill="currentColor"/>
                                </g>
                                <circle cx="18" cy="32" r="2.5" fill="url(#eventGradient-legend)" />
                                <rect x="17.5" y="26" width="1" height="4" fill="url(#eventGradient-legend)" opacity="0.6" rx="0.5"/>
                              </svg>
                            </div>
                            <span style={{
                              fontSize: '10px',
                              color: 'rgba(255, 255, 255, 0.7)',
                              whiteSpace: 'nowrap'
                            }}>رویداد</span>
                          </div>
                        </div>
                      </div>
                      <div className="drawer-body">
                        {loadingProducts ? (
                          <div style={{ textAlign: 'center', padding: '2rem', color: '#ffffff' }}>
                            در حال بارگذاری...
                          </div>
                        ) : (() => {
                          // فیلتر کردن محصولات بر اساس نوع مارکر انتخاب شده
                          let filteredProducts = products
                          
                          if (selectedMarkerType === 'store') {
                            // فقط فروشگاه‌ها - فقط یک کارت برای هر user_id منحصر به فرد
                            const storeMap = new Map<number, any>()
                            products.forEach(p => {
                              if ((p.is_store === 1 || p.is_store === true) && p.user_id) {
                                if (!storeMap.has(p.user_id)) {
                                  storeMap.set(p.user_id, p)
                                }
                              }
                            })
                            filteredProducts = Array.from(storeMap.values())
                          } else if (selectedMarkerType === 'product') {
                            // فقط آگهی‌های عادی (غیر فروشگاه)
                            filteredProducts = products.filter(p => !p.is_store || (p.is_store !== 1 && p.is_store !== true))
                          } else if (selectedMarkerType === 'service') {
                            // برای سرویس - فعلاً خالی (باید فیلد type اضافه شود)
                            filteredProducts = []
                          } else if (selectedMarkerType === 'event') {
                            // برای رویداد - فعلاً خالی (باید فیلد type اضافه شود)
                            filteredProducts = []
                          } else if (selectedMarkerType === 'all') {
                            // برای 'all' - فقط یک کارت برای هر فروشگاه و همه آگهی‌ها
                            const storeMap = new Map<number, any>()
                            const regularProducts: any[] = []
                            
                            products.forEach(p => {
                              if (p.is_store === 1 || p.is_store === true) {
                                // فروشگاه - فقط یک کارت برای هر user_id
                                if (p.user_id && !storeMap.has(p.user_id)) {
                                  storeMap.set(p.user_id, p)
                                }
                              } else {
                                // آگهی عادی
                                regularProducts.push(p)
                              }
                            })
                            
                            filteredProducts = [...Array.from(storeMap.values()), ...regularProducts]
                          }
                          
                          return filteredProducts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#ffffff' }}>
                              {selectedMarkerType === 'all' 
                                ? 'هیچ آگهی‌ای یافت نشد'
                                : selectedMarkerType === 'store'
                                ? 'هیچ فروشگاهی یافت نشد'
                                : selectedMarkerType === 'product'
                                ? 'هیچ آگهی‌ای یافت نشد'
                                : selectedMarkerType === 'service'
                                ? 'هیچ سرویسی یافت نشد'
                                : 'هیچ رویدادی یافت نشد'
                              }
                            </div>
                          ) : (
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                              gap: '1rem',
                              padding: '1rem'
                            }}>
                              {filteredProducts.map((product) => {
                                const isStore = product.is_store === 1 || product.is_store === true
                                
                                if (isStore && product.user_id) {
                                  // نمایش StoreCard برای فروشگاه‌ها
                                  return (
                                    <StoreCard
                                      key={product.id}
                                      userId={product.user_id}
                                      storeName={product.store_name || null}
                                      profileImage={product.profile_image || null}
                                      storePosterImage={product.store_poster_image || null}
                                      onClick={() => {
                                        setSelectedStoreUserId(product.user_id)
                                        setShowStoreView(true)
                                        setShowProfile(false)
                                        setShowAdCreationForm(false)
                                        setShowRegistrationForm(false)
                                        setShowAdDetails(false)
                                        setAdFormPosition(null)
                                      }}
                                    />
                                  )
                                } else {
                                  // نمایش AdCard برای آگهی‌های عادی
                                  return (
                                    <AdCard
                                      key={product.id}
                                      id={product.id}
                                      title={product.title}
                                      price={product.price}
                                      status={product.status}
                                      images={product.images || []}
                                      onClick={(productId) => {
                                        setSelectedProductId(productId)
                                        setShowAdDetails(true)
                                        setShowProfile(false)
                                        setShowAdCreationForm(false)
                                        setShowRegistrationForm(false)
                                        setAdFormPosition(null)
                                      }}
                                    />
                                  )
                                }
                              })}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
        {!isDrawerOpen && (
          <>
            <div 
              className="nav-button"
              onClick={() => {
                setShowAdDetails(false)
                setSelectedProductId(null)
                setShowMessenger(false)
                if (userId) {
                  // اگر userId دارد، Profile را نمایش بده
                  setAdFormPosition(null)
                  setShowAdCreationForm(false)
                  setShowProfile(true)
                  setIsDrawerOpen(true)
                  setDrawerHeight(80)
                } else {
                  // اگر userId ندارد، فرم ثبت‌نام را نمایش بده
                  setShowProfile(false)
                  setShowAdCreationForm(false)
                  setAdFormPosition(null)
                  setShowRegistrationForm(true)
                  setIsDrawerOpen(true)
                  setDrawerHeight(80)
                }
              }}
              style={{ cursor: 'pointer', opacity: 1 }}
            >
              <div className="nav-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span className="nav-text">Profile</span>
            </div>
            <div 
              className="nav-button"
              onClick={() => {
                setShowAdDetails(false)
                setSelectedProductId(null)
                setShowProfile(false)
                setShowAdCreationForm(false)
                setShowRegistrationForm(false)
                setAdFormPosition(null)
                setShowMessenger(true)
                setIsDrawerOpen(true)
                setDrawerHeight(80)
              }}
              style={{ cursor: 'pointer', opacity: 1 }}
            >
              <div className="nav-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <line x1="8" y1="9" x2="16" y2="9"></line>
                  <line x1="8" y1="13" x2="13" y2="13"></line>
                </svg>
              </div>
              <span className="nav-text">Messenger</span>
            </div>
          </>
        )}
        {!isDrawerOpen && (
          <div 
            className="nav-button active"
            onClick={handleDrawerToggle}
          >
            <div className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6"></path>
              </svg>
            </div>
            <span className="nav-text">Your City</span>
          </div>
        )}
        {!isDrawerOpen && (
          <>
            <div 
              className="nav-button"
              onClick={() => {
                if (userId) {
                  setShowSavedItems(true)
                  setShowProfile(false)
                  setShowAdCreationForm(false)
                  setShowRegistrationForm(false)
                  setAdFormPosition(null)
                  setShowAdDetails(false)
                  setShowMessenger(false)
                  setShowStoreView(false)
                  setIsDrawerOpen(true)
                  setDrawerHeight(80)
                } else {
                  setToast({ 
                    message: 'لطفاً ابتدا وارد حساب کاربری خود شوید', 
                    type: 'info' 
                  })
                  setTimeout(() => setToast(null), 3000)
                }
              }}
              style={{ cursor: 'pointer', opacity: 1 }}
            >
              <div className="nav-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <span className="nav-text">ذخیره شده</span>
            </div>
            <div 
              className="nav-button"
              onClick={() => {
                setShowLeaderboard(true)
                setShowProfile(false)
                setShowAdCreationForm(false)
                setShowRegistrationForm(false)
                setAdFormPosition(null)
                setShowAdDetails(false)
                setShowMessenger(false)
                setShowStoreView(false)
                setShowSavedItems(false)
                setIsDrawerOpen(true)
                setDrawerHeight(80)
              }}
              style={{ cursor: 'pointer', opacity: 1 }}
            >
              <div className="nav-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
              </div>
              <span className="nav-text">رتبه‌بندی</span>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
