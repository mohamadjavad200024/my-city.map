'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

interface AdCardProps {
  id: number
  title: string
  price: number
  status: string
  images: string[]
  onClick?: (id: number) => void
  overlayButton?: React.ReactNode
}

export default function AdCard({ id, title, price, status, images, onClick, overlayButton }: AdCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [imageOpacity, setImageOpacity] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isManualChangeRef = useRef(false)
  const currentImageIndexRef = useRef(0)

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
        return '#10b981' // green
      case 'used':
        return '#f59e0b' // amber
      case 'damaged':
      case 'needs_repair':
        return '#ef4444' // red
      default:
        return '#6b7280' // gray
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price)
  }

  // توابع swipe عمودی
  const minSwipeDistance = 50

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    setTouchEnd(null)
    setTouchStart(touch.clientY)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const touchEndTime = Date.now()
    const touchStart = touchStartRef.current
    
    if (!touchStart) return
    
    // اگر swipe نبود و فقط یک tap است
    if (!touchEnd || Math.abs(touchStart.y - touchEnd) < minSwipeDistance) {
      const touch = e.changedTouches[0]
      const moveDistance = Math.abs(touch.clientX - touchStart.x) + Math.abs(touch.clientY - touchStart.y)
      const touchDuration = touchEndTime - touchStart.time
      
      // اگر حرکت کمتر از 10px و زمان کمتر از 300ms باشد، یک tap است
      if (moveDistance < 10 && touchDuration < 300 && onClick) {
        e.preventDefault()
        e.stopPropagation()
        onClick(id)
        touchStartRef.current = null
        return
      }
    }
    
    if (!touchStart || !touchEnd || !images || images.length <= 1) {
      touchStartRef.current = null
      return
    }
    
    const distance = touchStart.y - touchEnd
    const isUpSwipe = distance > minSwipeDistance
    const isDownSwipe = distance < -minSwipeDistance

    if (isUpSwipe) {
      isManualChangeRef.current = true
      const nextIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
      currentImageIndexRef.current = nextIndex
      changeImageWithFade(nextIndex)
    }
    if (isDownSwipe) {
      isManualChangeRef.current = true
      const nextIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
      currentImageIndexRef.current = nextIndex
      changeImageWithFade(nextIndex)
    }
    
    touchStartRef.current = null
  }

  // تولید offset تصادفی برای هر کارت (بر اساس id) تا کاروسل‌ها همزمان شروع نشوند
  const randomOffset = useMemo(() => {
    // استفاده از id برای ایجاد offset یکتا برای هر کارت
    // این باعث میشه هر کارت در زمان متفاوتی شروع کنه
    // offset بین 0 تا 2000 میلی‌ثانیه برای جلوگیری از رد سریع تصاویر
    return (id % 5) * 400 + Math.random() * 300 // بین 0 تا 2300 میلی‌ثانیه
  }, [id])

  // مدت زمان نمایش هر تصویر (5 ثانیه برای فرصت کافی به کاربر)
  const CAROUSEL_INTERVAL = 5000 // 5 ثانیه

  // تابع برای تغییر نرم تصویر با fade effect
  const changeImageWithFade = useCallback((nextIndex: number) => {
    // Fade out
    setImageOpacity(0)
    
    // بعد از fade out، تصویر را تغییر می‌دهیم و fade in می‌کنیم
    setTimeout(() => {
      setCurrentImageIndex(nextIndex)
      currentImageIndexRef.current = nextIndex
      setImageOpacity(1)
    }, 300) // نصف زمان transition
  }, [])

  // تابع برای شروع کاروسل خودکار
  const startCarousel = useCallback(() => {
    // پاک کردن interval و timeout قبلی
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (!images || images.length <= 1) return

    // شروع interval بعد از delay تصادفی
    timeoutRef.current = setTimeout(() => {
      // بعد از delay اولیه، interval را شروع می‌کنیم
      intervalRef.current = setInterval(() => {
        const nextIndex = currentImageIndexRef.current === images.length - 1 ? 0 : currentImageIndexRef.current + 1
        // استفاده از changeImageWithFade برای fade effect
        changeImageWithFade(nextIndex)
      }, CAROUSEL_INTERVAL) // هر 5 ثانیه یک بار
    }, randomOffset)
  }, [images, randomOffset, CAROUSEL_INTERVAL, changeImageWithFade])

  // مقداردهی اولیه ref
  useEffect(() => {
    currentImageIndexRef.current = currentImageIndex
  }, [])

  // کاروسل خودکار با offset تصادفی
  useEffect(() => {
    startCarousel()

    // اگر component unmount شد، timeout و interval را cancel کن
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [images, randomOffset, startCarousel])

  // وقتی تصویر تغییر می‌کند (از طریق swipe یا کلیک)، interval را reset می‌کنیم
  useEffect(() => {
    // به‌روزرسانی ref
    currentImageIndexRef.current = currentImageIndex
    
    // اگر کاربر دستی تصویر را عوض کرد، interval را reset کن
    if (images && images.length > 1 && isManualChangeRef.current) {
      isManualChangeRef.current = false // reset flag
      startCarousel()
    }
  }, [currentImageIndex, startCarousel, images])

  const currentImage = images && images.length > 0 ? images[currentImageIndex] : null
  const safeImageIndex = images && images.length > 0 ? Math.min(currentImageIndex, images.length - 1) : 0

  return (
    <div 
      className="ad-card" 
      onClick={() => onClick && onClick(id)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="ad-card-image-wrapper">
        <div 
          className="ad-card-image"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ position: 'relative' }}
        >
          {currentImage ? (
            <img 
              src={currentImage} 
              alt={title}
              style={{ 
                opacity: imageOpacity,
                transition: 'opacity 0.6s ease-in-out'
              }}
            />
          ) : (
            <div className="ad-card-image-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
          )}
          {/* دکمه overlay روی تصویر */}
          {overlayButton && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 10
            }}>
              {overlayButton}
            </div>
          )}
        </div>
        {/* نقطه‌های نشانگر عمودی - کنار تصویر داخل کارت */}
        {images && images.length > 1 && (
          <div className="ad-card-carousel-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`ad-card-carousel-dot ${index === safeImageIndex ? 'active' : ''}`}
                onClick={() => {
                  isManualChangeRef.current = true
                  currentImageIndexRef.current = index
                  changeImageWithFade(index)
                  // interval خودکار بعد از تغییر تصویر reset می‌شود
                }}
                aria-label={`تصویر ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="ad-card-content">
        <h3 className="ad-card-title">{title}</h3>
        <div className="ad-card-info-vertical">
          <div className="ad-card-price">
            {formatPrice(price)} تومان
          </div>
          <div className="ad-card-info-divider"></div>
          <div
            className="ad-card-status"
            style={{ color: getStatusColor(status) }}
          >
            {getStatusText(status)}
          </div>
        </div>
      </div>
    </div>
  )
}


