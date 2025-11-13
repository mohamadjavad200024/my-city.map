'use client'

import { useState, useEffect } from 'react'
import AdCard from './AdCard'

interface SavedItem {
  id: number
  item_type: 'product' | 'store'
  item_id: number
  created_at: string
  title?: string
  price?: number
  images?: string
  status?: string
  profile_image?: string
  store_poster_image?: string
  rating?: number
}

interface SavedItemsProps {
  userId: number
  onClose: () => void
  onProductClick: (productId: number) => void
  onStoreClick: (storeUserId: number) => void
}

export default function SavedItems({ userId, onClose, onProductClick, onStoreClick }: SavedItemsProps) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'products' | 'stores'>('stores')

  useEffect(() => {
    fetchSavedItems()
  }, [userId])

  const fetchSavedItems = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/saved-items?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setSavedItems(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching saved items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (item: SavedItem) => {
    try {
      setRemovingId(item.id)
      const response = await fetch(
        `/api/saved-items?userId=${userId}&itemType=${item.item_type}&itemId=${item.item_id}`,
        { method: 'DELETE' }
      )
      const data = await response.json()
      
      if (data.success) {
        setSavedItems(prev => prev.filter(i => i.id !== item.id))
      }
    } catch (error) {
      console.error('Error removing saved item:', error)
    } finally {
      setRemovingId(null)
    }
  }

  const parseImages = (imagesString: string | null | undefined): string[] => {
    if (!imagesString) return []
    try {
      return JSON.parse(imagesString)
    } catch {
      return []
    }
  }

  // تابع برای نمایش ستاره‌ها
  const renderStars = (ratingValue: number, itemId: number) => {
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
            <linearGradient id={`half-fill-saved-${itemId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={`url(#half-fill-saved-${itemId})`}
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

  const products = savedItems.filter(item => item.item_type === 'product')
  const stores = savedItems.filter(item => item.item_type === 'store')

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '0'
        }}>
          <button
            onClick={() => setActiveTab('stores')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === 'stores' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'stores' ? '2px solid #ffffff' : '2px solid transparent',
              color: activeTab === 'stores' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '16px',
              fontWeight: activeTab === 'stores' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: '8px 8px 0 0'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'stores') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'stores') {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
              }
            }}
          >
            فروشگاه‌ها {stores.length > 0 && `(${stores.length})`}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === 'products' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'products' ? '2px solid #ffffff' : '2px solid transparent',
              color: activeTab === 'products' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '16px',
              fontWeight: activeTab === 'products' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: '8px 8px 0 0'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'products') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'products') {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
              }
            }}
          >
            آگهی‌ها {products.length > 0 && `(${products.length})`}
          </button>
        </div>

        {savedItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📌</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>هیچ محتوایی ذخیره نشده است</div>
            <div style={{ fontSize: '14px' }}>محتوای مورد علاقه خود را ذخیره کنید تا بعداً بررسی کنید</div>
          </div>
        ) : (
          <div>
            {/* Stores Tab Content */}
            {activeTab === 'stores' && (
              <div>
                {stores.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>هیچ فروشگاهی ذخیره نشده است</div>
                    <div style={{ fontSize: '14px' }}>فروشگاه‌های مورد علاقه خود را ذخیره کنید</div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {stores.map((item) => (
                      <div
                      key={item.id}
                      onClick={() => onStoreClick(item.item_id)}
                      style={{
                        position: 'relative',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {item.profile_image ? (
                          <img
                            src={item.profile_image}
                            alt={item.title || 'Store'}
                            style={{
                              width: '96px',
                              height: '96px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                              <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#ffffff',
                            marginBottom: '4px'
                          }}>
                            {item.title || 'فروشگاه'}
                          </div>
                          {/* نمایش ستاره‌ها */}
                          {item.rating !== undefined && item.rating !== null && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginBottom: '4px'
                            }}>
                              {renderStars(item.rating, item.id)}
                              {item.rating > 0 && (
                                <span style={{
                                  fontSize: '12px',
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  marginRight: '4px'
                                }}>
                                  {item.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          )}
                          <div style={{
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            فروشگاه
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemove(item)
                          }}
                          disabled={removingId === item.id}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: removingId === item.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: removingId === item.id ? 0.6 : 1,
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            if (removingId !== item.id) {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (removingId !== item.id) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                            }
                          }}
                        >
                          {removingId === item.id ? (
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Products Tab Content */}
            {activeTab === 'products' && (
              <div>
                {products.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>هیچ آگهی‌ای ذخیره نشده است</div>
                    <div style={{ fontSize: '14px' }}>آگهی‌های مورد علاقه خود را ذخیره کنید</div>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {products.map((item) => (
                      <AdCard
                        key={item.id}
                        id={item.item_id}
                        title={item.title || ''}
                        price={item.price || 0}
                        status={item.status || 'active'}
                        images={parseImages(item.images)}
                        onClick={onProductClick}
                        overlayButton={
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemove(item)
                            }}
                            disabled={removingId === item.id}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: 'rgba(0, 0, 0, 0.7)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: removingId === item.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: removingId === item.id ? 0.6 : 1,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              if (removingId !== item.id) {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'
                                e.currentTarget.style.transform = 'scale(1.05)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (removingId !== item.id) {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
                                e.currentTarget.style.transform = 'scale(1)'
                              }
                            }}
                          >
                            {removingId === item.id ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
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
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                              </svg>
                            )}
                          </button>
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

