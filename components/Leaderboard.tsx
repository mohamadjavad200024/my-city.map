'use client'

import { useState, useEffect } from 'react'
import { 
  FaTrophy, 
  FaMedal, 
  FaStore, 
  FaChartBar, 
  FaSpinner,
  FaTimes,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaUser
} from 'react-icons/fa'

interface LeaderboardUser {
  id: number
  username: string
  store_name?: string | null
  profile_image?: string | null
  is_store?: number | boolean
  average_rating: number
  rating_count: number
}

interface LeaderboardProps {
  currentUserId: number | null
  onClose: () => void
}

export default function Leaderboard({ currentUserId, onClose }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/ratings/leaderboard?limit=100')
      const data = await response.json()
      if (data.success) {
        setLeaderboard(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[...Array(fullStars)].map((_, i) => (
          <FaStar 
            key={`full-${i}`} 
            size={14} 
            color="#ffd700" 
            style={{ filter: 'drop-shadow(0 1px 2px rgba(255, 215, 0, 0.5))' }}
          />
        ))}
        {hasHalfStar && (
          <FaStarHalfAlt 
            key="half" 
            size={14} 
            color="#ffd700" 
            style={{ filter: 'drop-shadow(0 1px 2px rgba(255, 215, 0, 0.5))' }}
          />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar 
            key={`empty-${i}`} 
            size={14} 
            color="rgba(255, 255, 255, 0.3)" 
            style={{ opacity: 0.5 }}
          />
        ))}
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <FaMedal size={24} color="#ffd700" style={{ filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))' }} />
    }
    if (rank === 2) {
      return <FaMedal size={24} color="#c0c0c0" style={{ filter: 'drop-shadow(0 2px 4px rgba(192, 192, 192, 0.5))' }} />
    }
    if (rank === 3) {
      return <FaMedal size={24} color="#cd7f32" style={{ filter: 'drop-shadow(0 2px 4px rgba(205, 127, 50, 0.5))' }} />
    }
    return <span style={{ fontSize: '14px', fontWeight: 700 }}>#{rank}</span>
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaTrophy size={28} color="#ffd700" style={{ filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))' }} />
            رتبه‌بندی کاربران
          </h2>
          <button
            onClick={onClose}
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
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <FaSpinner 
              size={48} 
              style={{ 
                marginBottom: '16px',
                animation: 'spin 1s linear infinite',
                display: 'block',
                margin: '0 auto 16px'
              }} 
            />
            <div style={{ fontSize: '18px' }}>در حال بارگذاری...</div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <FaChartBar 
              size={48} 
              style={{ 
                marginBottom: '16px',
                display: 'block',
                margin: '0 auto 16px',
                opacity: 0.6
              }} 
            />
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>هنوز امتیازی ثبت نشده است</div>
            <div style={{ fontSize: '14px' }}>اولین کسی باشید که امتیاز می‌دهد!</div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {leaderboard.map((user, index) => {
              const rank = index + 1
              const isCurrentUser = currentUserId === user.id
              
              return (
                <div
                  key={user.id}
                  style={{
                    position: 'relative',
                    background: isCurrentUser 
                      ? 'rgba(59, 130, 246, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: isCurrentUser
                      ? '2px solid rgba(59, 130, 246, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* رتبه */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: rank <= 3 
                        ? rank === 1 
                          ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                          : rank === 2
                          ? 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)'
                          : 'linear-gradient(135deg, #cd7f32 0%, #e6a857 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getRankIcon(rank)}
                    </div>

                    {/* تصویر پروفایل */}
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.store_name || user.username}
                        style={{
                          width: '56px',
                          height: '56px',
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
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FaUser size={28} color="rgba(255, 255, 255, 0.5)" />
                      </div>
                    )}

                    {/* اطلاعات کاربر */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#ffffff',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {user.store_name || user.username}
                        {isCurrentUser && (
                          <span style={{
                            fontSize: '12px',
                            color: 'rgba(59, 130, 246, 0.8)',
                            marginRight: '8px'
                          }}>(شما)</span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        {renderStars(user.average_rating)}
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#ffffff'
                        }}>
                          {user.average_rating.toFixed(1)}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          ({user.rating_count} امتیاز)
                        </span>
                      </div>
                      {user.is_store && (
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FaStore size={12} />
                          فروشگاه
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

