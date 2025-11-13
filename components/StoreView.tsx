'use client'

import { useState, useEffect } from 'react'
import AdCard from './AdCard'

interface UserData {
  username: string
  phone: string
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

interface StoreViewProps {
  userId: number
  onClose: () => void
  onChat?: () => void
}

export default function StoreView({ userId, onClose, onChat }: StoreViewProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [isFollowingUser, setIsFollowingUser] = useState(false)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)
  const [isStoreInfoExpanded, setIsStoreInfoExpanded] = useState(false)
  const [windowWidth, setWindowWidth] = useState<number>(0)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [tempRating, setTempRating] = useState<number | null>(null)
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [showRatingSection, setShowRatingSection] = useState(true)

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
        const userIdNum = parseInt(savedUserId)
        setCurrentUserId(userIdNum)
        console.log('StoreView - currentUserId:', userIdNum, 'storeUserId:', userId)
      } else {
        console.log('StoreView - No currentUserId found in localStorage')
      }
    }
    fetchUserData()
    fetchProducts()
  }, [userId])

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
        
        // دریافت امتیاز کاربر جاری (اگر وجود دارد)
        if (currentUserIdNum && currentUserIdNum !== userId) {
          try {
            const ratingResponse = await fetch(`/api/ratings?ratedUserId=${userId}&raterUserId=${currentUserIdNum}`)
            const ratingData = await ratingResponse.json()
            if (ratingData.success && ratingData.data.rating) {
              setUserRating(ratingData.data.rating)
              // اگر کاربر قبلاً امتیاز داده، بخش امتیازدهی را مخفی کن
              setShowRatingSection(false)
            } else {
              // اگر کاربر هنوز امتیاز نداده، بخش امتیازدهی را نمایش بده
              setShowRatingSection(true)
            }
          } catch (error) {
            console.error('Error fetching user rating:', error)
            setShowRatingSection(true)
          }
        }
        
        // اگر فروشگاه فعال است و اطلاعات دارد، به صورت پیش‌فرض باز باشد
        const isStore = data.data.is_store === 1 || data.data.is_store === true
        const hasStoreInfo = !!(data.data.store_name || data.data.store_description || data.data.working_hours_sat_wed || data.data.working_hours_thu || data.data.instagram_url || data.data.telegram_url || data.data.whatsapp_url)
        if (isStore && hasStoreInfo) {
          setIsStoreInfoExpanded(true)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleStarClick = (rating: number) => {
    if (!currentUserId || currentUserId === userId) {
      return
    }
    setTempRating(rating)
  }

  const handleRatingSubmit = async () => {
    if (!currentUserId || currentUserId === userId || !tempRating) {
      return
    }
    
    try {
      setIsSubmittingRating(true)
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ratedUserId: userId,
          raterUserId: currentUserId,
          rating: tempRating
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setUserRating(tempRating)
        // به‌روزرسانی میانگین امتیاز
        if (userData) {
          setUserData({
            ...userData,
            rating: data.data.averageRating
          })
        }
        // مخفی کردن بخش امتیازدهی
        setShowRatingSection(false)
        setTempRating(null)
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
    } finally {
      setIsSubmittingRating(false)
    }
  }

  // بررسی وضعیت ذخیره شده بودن فروشگاه
  useEffect(() => {
    if (!currentUserId || !userId) {
      setIsSaved(false)
      return
    }

    const checkSaved = async () => {
      try {
        const response = await fetch(`/api/saved-items?userId=${currentUserId}`)
        const data = await response.json()
        
        if (data.success && Array.isArray(data.data)) {
          const saved = data.data.some((item: any) => 
            item.item_type === 'store' && item.item_id === userId
          )
          setIsSaved(saved)
        }
      } catch (error) {
        console.error('Error checking saved status:', error)
      }
    }

    checkSaved()
  }, [currentUserId, userId])

  // تابع ذخیره/حذف از ذخیره شده‌ها
  const handleSave = async () => {
    if (!currentUserId || !userId || isSaving) return

    try {
      setIsSaving(true)
      
      if (isSaved) {
        // حذف از ذخیره شده‌ها
        const response = await fetch(
          `/api/saved-items?userId=${currentUserId}&itemType=store&itemId=${userId}`,
          { method: 'DELETE' }
        )
        const data = await response.json()
        
        if (data.success) {
          setIsSaved(false)
        }
      } else {
        // ذخیره
        const response = await fetch('/api/saved-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUserId,
            itemType: 'store',
            itemId: userId
          })
        })
        const data = await response.json()
        
        if (data.success) {
          setIsSaved(true)
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving store:', error)
    } finally {
      setIsSaving(false)
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

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-content" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          padding: '40px 20px'
        }}>
          <div style={{ textAlign: 'center', color: '#e5e5e5' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(255, 255, 255, 0.1)',
              borderTop: '4px solid #ffffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <div>در حال بارگذاری...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!userData || !userData.is_store || (userData.is_store !== 1 && userData.is_store !== true)) {
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

  const hasPoster = userData.store_poster_image
  const posterHeight = 120

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

  const displayRating = userData.rating ?? 0

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* Header */}
        <div className="profile-header-info" style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 0,
          marginTop: '-24px',
          marginBottom: '20px',
          marginLeft: '-20px',
          marginRight: '-20px',
          width: 'calc(100% + 40px)',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10,
          overflow: 'visible',
          boxShadow: '0 8px 24px rgba(255, 255, 255, 0.2)'
        }}>
          {/* Store Poster */}
          {hasPoster && (
            <div style={{
              width: '100%',
              height: `${posterHeight}px`,
              position: 'relative',
              overflow: 'visible',
              background: 'rgba(0, 0, 0, 0.2)',
              flexShrink: 0,
              zIndex: 1
            }}>
              <img 
                src={userData.store_poster_image || ''} 
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

          {/* Avatar and Store Name */}
          {(() => {
            const avatarSize = userData.is_store === 1 || userData.is_store === true ? 80 : 64
            const overlapPercent = 0.30
            const overlapPixels = avatarSize * overlapPercent
            const topPosition = hasPoster ? posterHeight - overlapPixels + 30 : 46
            const isStore = userData && (userData.is_store === 1 || userData.is_store === true)
            
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
                {/* Store Name */}
                {isStore && userData.store_name && (
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
                
                {/* Avatar */}
                <div className="profile-header-avatar" style={{ 
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: isStore ? '12px' : '50%',
                  width: `${avatarSize}px`,
                  height: `${avatarSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: userData.profile_image ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                  flexShrink: 0,
                  border: '4px solid rgba(26, 26, 26, 0.8)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  {userData.profile_image ? (
                    <img 
                      src={userData.profile_image} 
                      alt="Store Logo" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: isStore ? '8px' : '50%'
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

          {/* Main Content */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            width: '100%',
            maxWidth: '100%',
            paddingTop: '16px',
            paddingLeft: '20px',
            paddingRight: windowWidth > 0 && windowWidth < 768 
              ? (hasPoster ? '20px' : '20px')
              : (hasPoster ? '120px' : '20px'),
            paddingBottom: '12px',
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
            height: hasPoster ? '80px' : 'auto',
            minHeight: hasPoster ? '80px' : 'auto',
            overflow: 'visible',
            boxSizing: 'border-box'
          }}>
            <div className="profile-header-details" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '100%', paddingBottom: 0, overflow: 'visible' }}>
              {/* نمایش ستاره‌ها - div جداگانه با فضای ثابت */}
              <div style={{
                width: '100%',
                minHeight: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '8px',
                marginBottom: '8px',
                flexShrink: 0
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
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
                
              </div>
              
              {/* Followers, Following, and Follow Button - هم‌ردیف افقی */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                width: '100%',
                maxWidth: '100%',
                marginTop: 'auto',
                marginBottom: '-12px',
                paddingTop: '8px',
                flexWrap: 'nowrap',
                gap: windowWidth > 0 && windowWidth < 768 ? '12px' : '20px',
                overflow: 'visible',
                minWidth: 0
              }}>
                {/* Followers - سمت راست */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  flexShrink: 0
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
                
                {/* Following - وسط */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  flexShrink: 0
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
                
                {/* Follow Button - سمت چپ */}
                {currentUserId && currentUserId !== userId && (
                  <button
                    onClick={async () => {
                      if (!currentUserId) return
                      setIsTogglingFollow(true)
                      try {
                        if (isFollowingUser) {
                          // Unfollow
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
                          // Follow
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
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: isFollowingUser 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(59, 130, 246, 0.2)',
                      border: isFollowingUser 
                        ? '1px solid rgba(255, 255, 255, 0.3)' 
                        : '1px solid rgba(59, 130, 246, 0.5)',
                      color: isFollowingUser ? 'rgba(255, 255, 255, 0.7)' : '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: isTogglingFollow ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isTogglingFollow ? 0.6 : 1,
                      fontSize: '13px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      if (!isTogglingFollow) {
                        e.currentTarget.style.background = isFollowingUser 
                          ? 'rgba(255, 255, 255, 0.15)' 
                          : 'rgba(59, 130, 246, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isTogglingFollow) {
                        e.currentTarget.style.background = isFollowingUser 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(59, 130, 246, 0.2)'
                      }
                    }}
                  >
                    {isTogglingFollow ? (
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
                    ) : isFollowingUser ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="8.5" cy="7" r="4"></circle>
                          <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        <span>دنبال می‌کنم</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="8.5" cy="7" r="4"></circle>
                          <line x1="20" y1="8" x2="20" y2="14"></line>
                          <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        <span>دنبال کردن</span>
                      </>
                    )}
                  </button>
                )}

                {/* Save Button - برای ذخیره فروشگاه */}
                {currentUserId && currentUserId !== userId && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isSaved ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      border: isSaved ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                      color: isSaved ? '#60a5fa' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isSaving ? 0.6 : 1,
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.background = isSaved 
                          ? 'rgba(59, 130, 246, 0.3)' 
                          : 'rgba(255, 255, 255, 0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.background = isSaved 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                    title={isSaved ? 'حذف از ذخیره شده' : 'ذخیره فروشگاه'}
                  >
                    {isSaving ? (
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
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                      </svg>
                    )}
                  </button>
                )}

                {/* Expand/Collapse Button for Store Info - هم راستا با دنبال‌کننده و دنبال‌شونده */}
                {userData.store_description || userData.working_hours_sat_wed || userData.working_hours_thu || userData.instagram_url || userData.telegram_url || userData.whatsapp_url ? (
                  <button
                    onClick={() => setIsStoreInfoExpanded(!isStoreInfoExpanded)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      transform: isStoreInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0
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
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>

          </div>

          {/* Collapsible Store Info - داخل هدر */}
          <div style={{
            maxHeight: isStoreInfoExpanded ? '1000px' : '0px',
            opacity: isStoreInfoExpanded ? 1 : 0,
            marginTop: isStoreInfoExpanded ? '0px' : '0px',
            paddingTop: isStoreInfoExpanded ? '16px' : '0px',
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingBottom: isStoreInfoExpanded ? '16px' : '0px',
            borderTop: isStoreInfoExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease, padding-top 0.3s ease, padding-bottom 0.3s ease, border-top 0.3s ease'
          }}>
            {userData.store_description && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '8px'
                }}>
                  درباره فروشگاه
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.6'
                }}>
                  {userData.store_description}
                </div>
              </div>
            )}

            {(userData.working_hours_sat_wed || userData.working_hours_thu) && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '8px'
                }}>
                  ساعت کاری
                </div>
                {userData.working_hours_sat_wed && (
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '4px'
                  }}>
                    شنبه تا چهارشنبه: {userData.working_hours_sat_wed}
                  </div>
                )}
                {userData.working_hours_thu && (
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    پنج‌شنبه: {userData.working_hours_thu}
                  </div>
                )}
              </div>
            )}

            {(userData.instagram_url || userData.telegram_url || userData.whatsapp_url) && (
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '8px'
                }}>
                  شبکه‌های اجتماعی
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontSize: '13px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                      Instagram
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
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontSize: '13px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      Telegram
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
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontSize: '13px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating Section - بالای بخش محصولات */}
        {currentUserId && currentUserId !== userId && showRatingSection && (
          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '12px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '4px'
              }}>
                امتیاز شما به این فروشگاه:
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                width: '100%',
                justifyContent: 'flex-end'
              }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    pointerEvents: isSubmittingRating ? 'none' : 'auto'
                  }}
                  onMouseLeave={() => setHoveredStar(null)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoveredStar !== null
                      ? star <= hoveredStar
                      : tempRating !== null
                      ? star <= tempRating
                      : userRating !== null
                      ? star <= userRating
                      : false
                    
                    return (
                      <button
                        key={star}
                        onClick={() => handleStarClick(star)}
                        disabled={isSubmittingRating}
                        onMouseEnter={() => setHoveredStar(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: isSubmittingRating ? 'not-allowed' : 'pointer',
                          opacity: isSubmittingRating ? 0.6 : 1,
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.transform = 'scale(0.9)'
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill={isFilled ? '#FFD700' : 'none'}
                          stroke={isFilled ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'}
                          strokeWidth="2"
                          style={{
                            filter: isFilled ? 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
                
                {/* دکمه تایید (لایک) */}
                {tempRating !== null && (
                  <button
                    className="ad-details-like-btn ad-details-like-btn-floating"
                    onClick={handleRatingSubmit}
                    disabled={isSubmittingRating}
                    style={{
                      opacity: isSubmittingRating ? 0.5 : 1
                    }}
                  >
                    <img 
                      src="/thumbs-up-icon.png" 
                      alt="تایید" 
                      className="ad-details-like-icon"
                      style={{ 
                        opacity: isSubmittingRating ? 0.5 : 1
                      }} 
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        <div style={{ marginTop: currentUserId && currentUserId !== userId ? '0px' : '20px', paddingTop: currentUserId && currentUserId !== userId ? '24px' : '0px', borderTop: currentUserId && currentUserId !== userId ? '1px solid rgba(255, 255, 255, 0.1)' : 'none' }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#ffffff'
          }}>
            محصولات ({products.length})
          </div>
          {isLoadingProducts ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>
              در حال بارگذاری محصولات...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>
              هیچ محصولی موجود نیست
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {products.map((product) => (
                <AdCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  status={product.status}
                  images={product.images || []}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Chat Button */}
      {onChat && currentUserId && currentUserId !== userId && (
        <button
          className="ad-details-like-btn-floating ad-details-message-btn"
          onClick={onChat}
          title="چت"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 10000
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
    </div>
  )
}

