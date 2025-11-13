'use client'

import { useState, useEffect } from 'react'

interface StoreCardProps {
  userId: number
  storeName: string | null
  profileImage?: string | null
  storePosterImage?: string | null
  rating?: number // امتیاز از 0 تا 5
  onClick?: (userId: number) => void
}

export default function StoreCard({ userId, storeName, profileImage, storePosterImage, rating = 0, onClick }: StoreCardProps) {
  const [storeData, setStoreData] = useState<{
    profile_image?: string | null
    store_name?: string | null
    store_poster_image?: string | null
    followers_count?: number
    rating?: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // دریافت اطلاعات فروشگاه از API
    const fetchStoreData = async () => {
      try {
        const response = await fetch(`/api/ads/${userId}`)
        const data = await response.json()
        if (data.success && data.data) {
          setStoreData({
            profile_image: data.data.profile_image,
            store_name: data.data.store_name,
            store_poster_image: data.data.store_poster_image,
            followers_count: data.data.followers_count,
            rating: data.data.rating || rating
          })
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchStoreData()
    }
  }, [userId])

  const displayProfileImage = storeData?.profile_image || profileImage
  const displayStoreName = storeData?.store_name || storeName
  const displayRating = storeData?.rating ?? rating
  const imageSize = 100

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
          width="14"
          height="14"
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
          width="14"
          height="14"
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
            <linearGradient id={`half-fill-${userId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={`url(#half-fill-${userId})`}
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
          width="14"
          height="14"
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

  return (
    <div 
      className="ad-card store-card" 
      onClick={() => onClick && onClick(userId)}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '12px',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '350px',
        boxSizing: 'border-box',
        minHeight: '100px',
        direction: 'rtl',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateY(0)',
        filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
        e.currentTarget.style.filter = 'drop-shadow(0 8px 16px rgba(139, 0, 0, 0.3))'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.filter = 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))'
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .store-card {
            backface-visibility: hidden;
            perspective: 1000px;
          }
          
          .store-card:hover {
            animation: cardPulse-${userId} 2s ease-in-out infinite;
          }
          
          @keyframes cardPulse-${userId} {
            0%, 100% {
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(139, 0, 0, 0.4);
            }
            50% {
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(139, 0, 0, 0.1);
            }
          }
        `
      }} />
      {/* Profile Image - سمت چپ */}
      <div style={{
        width: `${imageSize}px`,
        height: `${imageSize}px`,
        flexShrink: 0,
        borderRadius: '12px',
        overflow: 'hidden',
        background: displayProfileImage ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
        border: displayProfileImage ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(139, 0, 0, 0.3)',
        transform: 'scale(1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(139, 0, 0, 0.4)'
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(139, 0, 0, 0.3)'
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
      }}
      >
        {displayProfileImage ? (
          <img 
            src={displayProfileImage} 
            alt={displayStoreName || 'فروشگاه'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease',
              transform: 'scale(1)',
              filter: 'brightness(1) contrast(1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.filter = 'brightness(1.1) contrast(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.filter = 'brightness(1) contrast(1)'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.05)'
          }}>
            <svg width={imageSize * 0.4} height={imageSize * 0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        )}
      </div>

      {/* Content - سمت راست */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
        zIndex: 2,
        transition: 'opacity 0.3s ease, transform 0.3s ease'
      }}>
          {/* نمایش ستاره‌ها - div جداگانه با فضای ثابت */}
          <div style={{
            width: '100%',
            height: '18px',
            minHeight: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '3px',
            marginBottom: '4px',
            flexShrink: 0,
            pointerEvents: 'none'
          }}>
            {renderStars(displayRating)}
            {displayRating > 0 && (
              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginRight: '4px',
                lineHeight: '1'
              }}>
                {displayRating.toFixed(1)}
              </span>
            )}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflow: 'hidden',
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'flex-end'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ 
                opacity: 0.7,
                color: 'rgba(255, 255, 255, 0.6)',
                flexShrink: 0
              }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                margin: 0,
                color: '#ffffff',
                lineHeight: '1.3',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                textAlign: 'right',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(139, 0, 0, 0.2)',
                transition: 'text-shadow 0.3s ease, transform 0.3s ease',
                transform: 'translateX(0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textShadow = '0 2px 6px rgba(0, 0, 0, 0.4), 0 0 12px rgba(139, 0, 0, 0.4)'
                e.currentTarget.style.transform = 'translateX(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(139, 0, 0, 0.2)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
              >
                {displayStoreName || 'فروشگاه'}
              </h3>
            </div>
            {storeData?.followers_count !== undefined && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                whiteSpace: 'nowrap',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: '2px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6, flexShrink: 0 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>{storeData.followers_count || 0}</span>
                <span>دنبال‌کننده</span>
              </div>
            )}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: '1.3',
            textAlign: 'right',
            width: '100%',
            marginTop: 'auto',
            paddingTop: '4px'
          }}>
            برای مشاهده بیشتر کلیک کنید
          </div>
      </div>
    </div>
  )
}

