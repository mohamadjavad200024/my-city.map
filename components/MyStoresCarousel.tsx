'use client'

import { useState, useEffect } from 'react'

interface Store {
  id: number
  store_name: string
  profile_image?: string | null
  rating?: number
}

interface MyStoresCarouselProps {
  userId?: number | null
}

export default function MyStoresCarousel({ userId }: MyStoresCarouselProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchMyStores()
    } else {
      setIsLoading(false)
    }
  }, [userId])

  const fetchMyStores = async () => {
    try {
      setIsLoading(true)
      // TODO: جایگزین کردن با API واقعی برای دریافت فروشگاه‌های متصل کاربر
      // فعلاً داده‌های نمونه
      const mockStores: Store[] = [
        {
          id: 1,
          store_name: 'فروشگاه نمونه ۱',
          profile_image: null,
          rating: 4.5
        },
        {
          id: 2,
          store_name: 'فروشگاه نمونه ۲',
          profile_image: null,
          rating: 4.8
        },
        {
          id: 3,
          store_name: 'فروشگاه نمونه ۳',
          profile_image: null,
          rating: 5.0
        },
        {
          id: 4,
          store_name: 'فروشگاه نمونه ۴',
          profile_image: null,
          rating: 4.2
        },
        {
          id: 5,
          store_name: 'فروشگاه نمونه ۵',
          profile_image: null,
          rating: 4.9
        }
      ]
      
      // شبیه‌سازی تاخیر API
      setTimeout(() => {
        setStores(mockStores)
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error fetching stores:', error)
      setIsLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={`full-${i}`}
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="#fbbf24"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    }

    if (hasHalfStar) {
      stars.push(
        <svg
          key="half"
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <defs>
            <linearGradient id={`half-fill-${rating}`}>
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill={`url(#half-fill-${rating})`}
          />
        </svg>
      )
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    }

    return stars
  }

  const handleStoreClick = (storeId: number) => {
    // TODO: هدایت به صفحه فروشگاه
    console.log('Store clicked:', storeId)
  }

  const handleMenuClick = (e: React.MouseEvent, storeId: number) => {
    e.stopPropagation()
    // TODO: نمایش منوی فروشگاه
    console.log('Menu clicked for store:', storeId)
  }

  if (isLoading) {
    return (
      <div className="my-stores-carousel-loading">
        <span>در حال بارگذاری...</span>
      </div>
    )
  }

  if (stores.length === 0) {
    return null
  }

  return (
    <div className="my-stores-carousel">
      <div className="my-stores-carousel-wrapper">
        <div 
          className="my-stores-carousel-container"
        >
          {stores.map((store) => (
            <div
              key={store.id}
              className="my-stores-carousel-item"
              onClick={() => handleStoreClick(store.id)}
            >
              <div className="my-stores-carousel-item-content">
                <div className="my-stores-carousel-item-avatar">
                  {store.profile_image ? (
                    <img src={store.profile_image} alt={store.store_name} />
                  ) : (
                    <div className="my-stores-carousel-item-avatar-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="my-stores-carousel-item-info">
                  <div className="my-stores-carousel-item-name">
                    {store.store_name}
                  </div>
                  <div className="my-stores-carousel-item-rating">
                    {renderStars(store.rating || 0)}
                  </div>
                </div>
                <div className="my-stores-carousel-item-spacer"></div>
                <button
                  className="my-stores-carousel-item-menu"
                  onClick={(e) => handleMenuClick(e, store.id)}
                  aria-label="منو"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
