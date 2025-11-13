'use client'

import { useState, useEffect, useRef } from 'react'

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

interface AdOwner {
  id: number
  username: string
  phone: string
}

interface AdDetailsProps {
  productId?: number
  product?: Product
  currentUserId?: number | null
  onClose: () => void
  onStartChat?: (ownerUserId: number) => void
}

export default function AdDetails({ productId, product: initialProduct, currentUserId, onClose, onStartChat }: AdDetailsProps) {
  const [product, setProduct] = useState<Product | null>(initialProduct || null)
  const [isLoading, setIsLoading] = useState(!initialProduct)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [carouselProgress, setCarouselProgress] = useState(0)
  const [adOwner, setAdOwner] = useState<AdOwner | null>(null)
  const [isOwnerLoading, setIsOwnerLoading] = useState(false)
  const [ownerError, setOwnerError] = useState<string | null>(null)
  const [ownerAds, setOwnerAds] = useState<Product[]>([])
  const [isOwnerAdsLoading, setIsOwnerAdsLoading] = useState(false)
  const [ownerAdsError, setOwnerAdsError] = useState<string | null>(null)
  const [ownerAdIndex, setOwnerAdIndex] = useState(0)
  const [showFloatingButtons, setShowFloatingButtons] = useState(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [tempRating, setTempRating] = useState<number | null>(null)
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [showRatingSection, setShowRatingSection] = useState(true)
  const [ownerRating, setOwnerRating] = useState<number | null>(null)

  const SHOW_DURATION = 3000

  const showFloatingButtonsNow = () => {
    setShowFloatingButtons(true)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setShowFloatingButtons(false)
    }, SHOW_DURATION)
  }

  useEffect(() => {
    const container = containerRef.current
    const activityEvents: Array<keyof WindowEventMap> = [
      'scroll',
      'touchmove',
      'touchstart',
      'wheel'
    ]

    const handleActivity = () => {
      showFloatingButtonsNow()
    }

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
      container?.addEventListener(eventName, handleActivity, { passive: true })
    })

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
        container?.removeEventListener(eventName, handleActivity)
      })
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // اگر product اولیه پاس داده شده، از آن استفاده کن
    if (initialProduct) {
      setProduct(initialProduct)
      setIsLoading(false)
      return
    }
    
    // در غیر این صورت از API دریافت کن
    if (productId && productId > 0) {
      fetchProduct()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, initialProduct])

  const fetchProduct = async () => {
    if (!productId || productId <= 0) {
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/products/${productId}`)
      
      if (!response.ok) {
        throw new Error('خطا در دریافت داده‌ها')
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        // اطمینان از اینکه images یک آرایه است
        const productData = {
          ...data.data,
          images: Array.isArray(data.data.images) ? data.data.images : (data.data.images ? JSON.parse(data.data.images) : [])
        }
        setProduct(productData)
        setCurrentImageIndex(0)
      }
    } catch (error: any) {
      console.error('Error fetching product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'نو'
      case 'used':
        return 'دست دوم'
      case 'damaged':
      case 'needs_repair':
        return 'نیاز به تعمیر'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#10b981'
      case 'used':
        return '#f59e0b'
      case 'damaged':
      case 'needs_repair':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price)
  }

  // تابع برای نمایش ستاره‌ها بر اساس امتیاز
  const renderStars = (ratingValue: number) => {
    const fullStars = Math.floor(ratingValue)
    const hasHalfStar = ratingValue % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
            <defs>
              <linearGradient id={`half-star-${ratingValue}`}>
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="transparent" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half-star-${ratingValue})" />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    )
  }

  // دریافت اطلاعات آگهی‌دهنده
  useEffect(() => {
    if (!product?.user_id) {
      setAdOwner(null)
      setOwnerError(null)
      return
    }

    const controller = new AbortController()
    let isCanceled = false

    const fetchAdOwner = async () => {
      try {
        setIsOwnerLoading(true)
        setOwnerError(null)
        const response = await fetch(`/api/ads/${product.user_id}`, {
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error('خطا در دریافت اطلاعات آگهی‌دهنده')
        }

        const data = await response.json()
        if (!isCanceled && data?.success && data?.data) {
          setAdOwner({
            id: data.data.id,
            username: data.data.username,
            phone: data.data.phone
          })
          // دریافت امتیاز واقعی کاربر
          if (data.data.rating !== undefined) {
            setOwnerRating(data.data.rating)
          }
        } else if (!isCanceled) {
          setAdOwner(null)
          setOwnerRating(null)
        }
      } catch (error: any) {
        if (controller.signal.aborted) return
        console.error('Error fetching ad owner:', error)
        if (!isCanceled) {
          setOwnerError(error?.message || 'خطا در دریافت اطلاعات آگهی‌دهنده')
          setAdOwner(null)
        }
      } finally {
        if (!isCanceled) {
          setIsOwnerLoading(false)
        }
      }
    }

    fetchAdOwner()

    return () => {
      isCanceled = true
      controller.abort()
    }
  }, [product?.user_id])

  // دریافت آگهی‌های دیگر این آگهی‌دهنده
  useEffect(() => {
    if (!product?.user_id) {
      setOwnerAds([])
      setOwnerAdsError(null)
      setIsOwnerAdsLoading(false)
      setOwnerAdIndex(0)
      return
    }

    const controller = new AbortController()
    let isCanceled = false

    const fetchOwnerAds = async () => {
      try {
        setIsOwnerAdsLoading(true)
        setOwnerAdsError(null)

        const response = await fetch(`/api/products/user/${product.user_id}`, {
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error('خطا در دریافت آگهی‌های دیگر')
        }

        const data = await response.json()
        if (isCanceled) return

        if (data?.success && Array.isArray(data?.data)) {
          const normalizedAds: Product[] = data.data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            title: item.title,
            price: item.price,
            description: item.description,
            status: item.status,
            images: Array.isArray(item.images)
              ? item.images
              : item.images
              ? (() => {
                  try {
                    const parsed = JSON.parse(item.images)
                    return Array.isArray(parsed) ? parsed : []
                  } catch {
                    return []
                  }
                })()
              : [],
            created_at: item.created_at
          }))

          setOwnerAds(normalizedAds)
        } else {
          setOwnerAds([])
        }
      } catch (error: any) {
        if (controller.signal.aborted) return
        console.error('Error fetching owner ads:', error)
        if (!isCanceled) {
          setOwnerAds([])
          setOwnerAdsError(error?.message || 'خطا در دریافت آگهی‌های دیگر')
        }
      } finally {
        if (!isCanceled) {
          setIsOwnerAdsLoading(false)
        }
      }
    }

    fetchOwnerAds()

    return () => {
      isCanceled = true
      controller.abort()
    }
  }, [product?.user_id])

  // بررسی وضعیت ذخیره شده بودن محصول
  useEffect(() => {
    if (!currentUserId || !product?.id) {
      setIsSaved(false)
      return
    }

    const checkSaved = async () => {
      try {
        const response = await fetch(`/api/saved-items?userId=${currentUserId}`)
        const data = await response.json()
        
        if (data.success && Array.isArray(data.data)) {
          const saved = data.data.some((item: any) => 
            item.item_type === 'product' && item.item_id === product.id
          )
          setIsSaved(saved)
        }
      } catch (error) {
        console.error('Error checking saved status:', error)
      }
    }

    checkSaved()
  }, [currentUserId, product?.id])

  // دریافت امتیاز کاربر جاری برای آگهی‌دهنده
  useEffect(() => {
    if (!currentUserId || !product?.user_id || currentUserId === product.user_id) {
      setUserRating(null)
      setShowRatingSection(false)
      return
    }

    const fetchUserRating = async () => {
      try {
        const response = await fetch(`/api/ratings?ratedUserId=${product.user_id}&raterUserId=${currentUserId}`)
        const data = await response.json()
        if (data.success && data.data.rating) {
          setUserRating(data.data.rating)
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

    fetchUserRating()
  }, [currentUserId, product?.user_id])

  const handleStarClick = (rating: number) => {
    if (!currentUserId || !product?.user_id || currentUserId === product.user_id) {
      return
    }
    setTempRating(rating)
  }

  const handleRatingSubmit = async () => {
    console.log('handleRatingSubmit called', {
      currentUserId,
      productUserId: product?.user_id,
      tempRating,
      isSubmittingRating
    })
    
    if (!currentUserId || !product?.user_id || currentUserId === product.user_id || !tempRating) {
      console.log('Validation failed:', {
        hasCurrentUserId: !!currentUserId,
        hasProductUserId: !!product?.user_id,
        isSameUser: currentUserId === product?.user_id,
        hasTempRating: !!tempRating
      })
      return
    }
    
    try {
      setIsSubmittingRating(true)
      const requestBody = {
        ratedUserId: product.user_id,
        raterUserId: currentUserId,
        rating: tempRating
      }
      console.log('Submitting rating:', requestBody)
      
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      console.log('Rating response:', data)
      
      if (data.success) {
        setUserRating(tempRating)
        // به‌روزرسانی امتیاز واقعی کاربر (ownerRating)
        if (data.data && data.data.averageRating !== undefined) {
          setOwnerRating(data.data.averageRating)
        }
        // بعد از ثبت امتیاز، بخش امتیازدهی را مخفی کن
        setShowRatingSection(false)
        // بعد از مخفی کردن بخش، tempRating را پاک کن
        setTimeout(() => {
          setTempRating(null)
        }, 300)
      } else {
        console.error('Failed to submit rating:', data.error)
        alert(data.error || 'خطا در ثبت امتیاز')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('خطا در ارسال درخواست. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsSubmittingRating(false)
    }
  }

  // تابع ذخیره/حذف از ذخیره شده‌ها
  const handleSave = async () => {
    if (!currentUserId || !product?.id || isSaving) return

    try {
      setIsSaving(true)
      
      if (isSaved) {
        // حذف از ذخیره شده‌ها
        const response = await fetch(
          `/api/saved-items?userId=${currentUserId}&itemType=product&itemId=${product.id}`,
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
            itemType: 'product',
            itemId: product.id
          })
        })
        const data = await response.json()
        
        if (data.success) {
          setIsSaved(true)
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving product:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // به روزرسانی index آگهی جاری در لیست آگهی‌های آگهی‌دهنده
  useEffect(() => {
    if (!product) return
    if (!ownerAds.length) {
      setOwnerAdIndex(0)
      return
    }

    const currentIndex = ownerAds.findIndex((item) => item.id === product.id)
    if (currentIndex >= 0) {
      setOwnerAdIndex(currentIndex)
    } else {
      setOwnerAdIndex(0)
    }
  }, [product?.id, ownerAds])

  // حذف منطق اسکرول برای دکمه‌های شناور (رفتار سابق باقی می‌ماند)

  const handleShowNextOwnerAd = () => {
    if (ownerAds.length <= 1) return
    const nextIndex = ownerAdIndex === ownerAds.length - 1 ? 0 : ownerAdIndex + 1
    const nextAd = ownerAds[nextIndex]
    if (!nextAd) return

    setOwnerAdIndex(nextIndex)
    setProduct({
      ...nextAd,
      images: Array.isArray(nextAd.images) ? nextAd.images : []
    })
    setCurrentImageIndex(0)
    setCarouselProgress(0)
  }

  // تایمر خودکار برای کاروسل
  useEffect(() => {
    // اگر فقط یک تصویر داریم، timer را متوقف کن
    if (!product || !product.images || product.images.length <= 1) {
      setCarouselProgress(0)
      return
    }

    // Reset progress وقتی تصویر تغییر می‌کند
    setCarouselProgress(0)

    const intervalDuration = 50 // هر 50 میلی‌ثانیه
    const totalDuration = 3000 // 3 ثانیه برای هر تصویر
    const totalSteps = totalDuration / intervalDuration // تعداد کل step ها
    const progressStep = 100 / totalSteps // درصد افزایش در هر step

    let currentProgress = 0
    let stepCount = 0

    const interval = setInterval(() => {
      stepCount++
      currentProgress = Math.min((stepCount / totalSteps) * 100, 100)
      
      setCarouselProgress(currentProgress)
      
      // وقتی progress کامل شد، به تصویر بعدی برو
      if (currentProgress >= 100) {
        clearInterval(interval)
        // استفاده از setTimeout برای اطمینان از state update
        setTimeout(() => {
          if (product.images && product.images.length > 1) {
            setCurrentImageIndex((prevIndex) => 
              prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
            )
          }
        }, 50) // یک delay کوچک برای نمایش کامل progress
      }
    }, intervalDuration)

    return () => {
      clearInterval(interval)
    }
  }, [currentImageIndex, product])

  // توابع کاروسل
  const goToPreviousImage = () => {
    if (!product || !product.images || product.images.length <= 1) return
    setCarouselProgress(0) // Reset progress هنگام تغییر دستی
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const goToNextImage = () => {
    if (!product || !product.images || product.images.length <= 1) return
    setCarouselProgress(0) // Reset progress هنگام تغییر دستی
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  // توابع swipe عمودی
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isUpSwipe = distance > minSwipeDistance
    const isDownSwipe = distance < -minSwipeDistance

    if (isUpSwipe) {
      goToNextImage()
    }
    if (isDownSwipe) {
      goToPreviousImage()
    }
  }

  if (isLoading) {
    return (
      <div className="ad-details-container">
        <div className="ad-details-loading">در حال بارگذاری...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="ad-details-container">
        <div className="ad-details-error">خطا در بارگذاری آگهی</div>
      </div>
    )
  }

  const statusColor = getStatusColor(product.status)
  const images = product.images || []
  const safeImageIndex = images.length > 0 
    ? Math.min(currentImageIndex, images.length - 1) 
    : 0
  const otherAdsCount = ownerAds.filter((item) => item.id !== product.id).length
  const otherAdsCountLabel = otherAdsCount > 0 ? new Intl.NumberFormat('fa-IR').format(otherAdsCount) : null

  return (
    <div className="ad-details-container" ref={containerRef}>
      <div className="ad-details-content">
        {/* تصاویر */}
        <div className="ad-details-images-section">
          <div className="ad-details-user-profile-header">
            {ownerAds.length > 1 && !ownerAdsError && (
              <button
                className="ad-details-nav-btn ad-details-user-nav-btn"
                onClick={handleShowNextOwnerAd}
                aria-label="مشاهده آگهی بعدی این آگهی‌دهنده"
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
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span>
                  آگهی دیگر{otherAdsCountLabel ? ` (${otherAdsCountLabel})` : ''}
                </span>
              </button>
            )}
            <div className="ad-details-user-profile-info">
              <div className="ad-details-user-avatar" aria-hidden="true">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="ad-details-user-products-nav-wrapper">
                <div className="ad-details-user-name">
                  {isOwnerLoading ? 'در حال دریافت...' : adOwner?.username || 'نام آگهی‌دهنده'}
                </div>
                {ownerError ? (
                  <div className="ad-details-user-products-hint" role="alert">
                    {ownerError}
                  </div>
                ) : ownerAdsError ? (
                  <div className="ad-details-user-products-hint" role="alert">
                    {ownerAdsError}
                  </div>
                ) : ownerRating !== null && ownerRating > 0 ? (
                  <div className="ad-details-user-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {renderStars(ownerRating)}
                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginRight: '2px' }}>
                      {ownerRating.toFixed(1)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {images.length > 0 ? (
            <>
              <div className="ad-details-images-wrapper">
                <div 
                  className="ad-details-main-image"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  style={{ position: 'relative' }}
                >
                  <img src={images[safeImageIndex] || ''} alt={product.title} />
                  
                  {/* دکمه ذخیره روی تصویر */}
                  {currentUserId && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSave()
                      }}
                      disabled={isSaving}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: isSaved ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isSaving ? 0.6 : 1,
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSaving) {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSaving) {
                          e.currentTarget.style.background = isSaved 
                            ? 'rgba(0, 0, 0, 0.8)' 
                            : 'rgba(0, 0, 0, 0.6)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }
                      }}
                      title={isSaved ? 'حذف از ذخیره شده' : 'ذخیره'}
                    >
                      {isSaving ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      )}
                    </button>
                  )}
                  
                  {/* نمایش شماره تصویر با progress bar */}
                  {images.length > 1 && (
                    <>
                      <div className="ad-details-image-counter-wrapper">
                        <svg className="ad-details-image-counter-progress" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="3"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - carouselProgress / 100)}`}
                            transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                          />
                        </svg>
                        <div className="ad-details-image-counter">
                          {safeImageIndex + 1} / {images.length}
                        </div>
                      </div>
                      
                    </>
                  )}
                </div>
                
                {/* نقطه‌های نشانگر عمودی */}
                {images.length > 1 && (
                  <div className="ad-details-carousel-dots">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        className={`ad-details-carousel-dot ${index === safeImageIndex ? 'active' : ''}`}
                        onClick={() => {
                          setCarouselProgress(0)
                          setCurrentImageIndex(index)
                        }}
                        aria-label={`تصویر ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="ad-details-no-image">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>تصویری موجود نیست</p>
            </div>
          )}
        </div>

        {/* عنوان */}
        <div className="ad-details-field">
          <label className="ad-details-field-label">عنوان</label>
          <div className="ad-details-field-value">
            {product.title}
          </div>
        </div>

        {/* قیمت */}
        <div className="ad-details-field ad-details-field--price">
          <label className="ad-details-field-label">قیمت</label>
          <div className="ad-details-field-value">
            <span className="ad-details-price-amount">{formatPrice(product.price)}</span>
            <span className="ad-details-price-currency">تومان</span>
          </div>
        </div>

        {/* وضعیت */}
        <div className="ad-details-field">
          <label className="ad-details-field-label">وضعیت</label>
          <div className="ad-details-field-value">
            <span
              className="ad-details-status-badge"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              {getStatusText(product.status)}
            </span>
          </div>
        </div>

        {/* توضیحات */}
        <div className="ad-details-field">
          <label className="ad-details-field-label">توضیحات</label>
          <div className="ad-details-field-value ad-details-description">
            {product.description || 'توضیحاتی ثبت نشده است'}
          </div>
        </div>

        {/* Rating Section - زیر توضیحات */}
        {currentUserId && product?.user_id && currentUserId !== product.user_id && showRatingSection && (
          <div style={{
            position: 'static',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '24px',
            width: '100%'
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
              امتیاز شما به این کاربر:
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
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRatingSubmit()
                  }}
                  disabled={isSubmittingRating}
                  style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(20, 20, 20, 0.6)',
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(12px)',
                    cursor: isSubmittingRating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: isSubmittingRating ? 0.55 : 1,
                    position: 'relative',
                    transform: 'none',
                    margin: 0,
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmittingRating) {
                      e.currentTarget.style.background = 'rgba(20, 20, 20, 0.85)'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmittingRating) {
                      e.currentTarget.style.background = 'rgba(20, 20, 20, 0.6)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                >
                  <img 
                    src="/thumbs-up-icon.png" 
                    alt="تایید" 
                    style={{ 
                      width: '32px',
                      height: '32px',
                      objectFit: 'contain',
                      filter: 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
                      opacity: isSubmittingRating ? 0.5 : 1
                    }} 
                  />
                </button>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* دکمه‌های شناور در پایین */}
      <div
        className={`ad-details-floating-buttons-wrapper ${
          showFloatingButtons ? 'visible' : ''
        }`}
      >
        {/* دکمه تماس */}
        <button 
          className="ad-details-like-btn-floating ad-details-call-btn" 
          onClick={() => {
            const phoneNumber = adOwner?.phone
            if (phoneNumber) {
              window.location.href = `tel:${phoneNumber}`
            } else if (product?.user_id) {
              window.location.href = `tel:${product.user_id}`
            }
          }}
          title="تماس"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </button>

        {/* دکمه لایک/تایید */}
        <button className="ad-details-like-btn ad-details-like-btn-floating" onClick={onClose}>
          <img 
            src="/thumbs-up-icon.png" 
            alt="Like" 
            className="ad-details-like-icon"
          />
        </button>

        {/* دکمه چت */}
        <button 
          className="ad-details-like-btn-floating ad-details-message-btn" 
          onClick={() => {
            if (product?.user_id && onStartChat) {
              onStartChat(product.user_id)
            } else if (product?.user_id) {
              console.log('Open chat with user:', product.user_id)
            }
          }}
          title="چت"
          disabled={!product?.user_id || !onStartChat}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}

