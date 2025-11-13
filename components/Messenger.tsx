'use client'

import { useEffect, useMemo, useState, useRef, useCallback, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'

type Presence = 'online' | 'offline' | 'away'
type MessageDirection = 'incoming' | 'outgoing'

interface Conversation {
  id: number
  name: string
  status: Presence
  subtitle: string
  lastMessageAt: string
  unread: number
  avatarColor: string
  conversationId?: number // ID from database
  otherUserId?: number
}

interface Message {
  id: string | number
  direction: MessageDirection
  text: string
  time: string
  status?: 'sent' | 'delivered' | 'seen'
}

// Helper function to parse date string and convert to Tehran timezone (UTC+3:30)
// SQLite stores dates as UTC, but JavaScript may interpret them as local time
function parseUTCDateToTehran(dateString: string): Date {
  try {
    let dateStr = dateString.trim()
    
    // Handle ISO string with 'Z' (explicit UTC)
    if (dateStr.endsWith('Z')) {
      const utcDate = new Date(dateStr)
      // Add Tehran offset: UTC+3:30 = 3 hours 30 minutes = 12,600,000 ms
      const tehranOffset = (3 * 60 + 30) * 60 * 1000
      return new Date(utcDate.getTime() + tehranOffset)
    }
    
    // Handle date string with timezone offset (e.g., +03:30, -05:00)
    if (dateStr.match(/[+-]\d{2}:\d{2}$/)) {
      const date = new Date(dateStr)
      // Convert to UTC first
      const utcTime = date.getTime() - (date.getTimezoneOffset() * 60 * 1000)
      // Add Tehran offset
      const tehranOffset = (3 * 60 + 30) * 60 * 1000
      return new Date(utcTime + tehranOffset)
    }
    
    // Parse SQLite date format: 'YYYY-MM-DD HH:MM:SS' (stored as UTC in database)
    // Replace space with 'T' for ISO format, then parse as UTC explicitly
    const isoStr = dateStr.replace(' ', 'T')
    const parts = isoStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?/)
    
    if (parts) {
      const year = parseInt(parts[1], 10)
      const month = parseInt(parts[2], 10) - 1 // JavaScript months are 0-indexed
      const day = parseInt(parts[3], 10)
      const hour = parseInt(parts[4], 10)
      const minute = parseInt(parts[5], 10)
      const second = parseInt(parts[6], 10)
      
      // Create UTC date using Date.UTC (this creates a date in UTC timezone)
      const utcTimestamp = Date.UTC(year, month, day, hour, minute, second)
      
      // Add Tehran timezone offset: UTC+3:30
      // 3 hours = 3 * 60 * 60 * 1000 = 10,800,000 ms
      // 30 minutes = 30 * 60 * 1000 = 1,800,000 ms
      // Total = 12,600,000 ms
      const tehranOffset = (3 * 60 + 30) * 60 * 1000
      
      return new Date(utcTimestamp + tehranOffset)
    }
    
    // Fallback: try to parse and add 'Z' to force UTC interpretation
    // Then add Tehran offset
    try {
      const utcDate = new Date(dateStr + 'Z')
      if (!isNaN(utcDate.getTime())) {
        const tehranOffset = (3 * 60 + 30) * 60 * 1000
        return new Date(utcDate.getTime() + tehranOffset)
      }
    } catch (e) {
      // Continue to final fallback
    }
    
    // Final fallback: parse as local and try to correct
    const localDate = new Date(dateStr)
    if (!isNaN(localDate.getTime())) {
      // Get local timezone offset in minutes
      const localOffset = localDate.getTimezoneOffset() * 60 * 1000
      // Convert to UTC
      const utcTime = localDate.getTime() + localOffset
      // Add Tehran offset
      const tehranOffset = (3 * 60 + 30) * 60 * 1000
      return new Date(utcTime + tehranOffset)
    }
    
    // If all else fails, return current date
    console.warn('Could not parse date string:', dateString)
    return new Date()
  } catch (error) {
    console.error('Error parsing date:', dateString, error)
    return new Date()
  }
}

// Helper function to format date to Persian time
function formatPersianTime(dateString: string): string {
  try {
    // Parse UTC date string and convert to Tehran timezone
    const date = parseUTCDateToTehran(dateString)
    // Current time in Tehran timezone
    const now = parseUTCDateToTehran(new Date().toISOString())
    
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    // برای پیام‌های خیلی جدید
    if (minutes < 1) return 'اکنون'
    if (minutes < 60) return `${minutes} دقیقه پیش`
    
    // برای پیام‌های امروز - نمایش ساعت
    if (hours < 24 && date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      const hours12 = date.getHours() % 12 || 12
      const minutesFormatted = date.getMinutes().toString().padStart(2, '0')
      const ampm = date.getHours() >= 12 ? 'ب.ظ' : 'ق.ظ'
      return `${hours12}:${minutesFormatted} ${ampm}`
    }
    
    // برای پیام‌های دیروز
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
      const hours12 = date.getHours() % 12 || 12
      const minutesFormatted = date.getMinutes().toString().padStart(2, '0')
      const ampm = date.getHours() >= 12 ? 'ب.ظ' : 'ق.ظ'
      return `دیروز ${hours12}:${minutesFormatted} ${ampm}`
    }
    
    // برای پیام‌های این هفته
    if (days < 7) {
      const weekDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
      const dayName = weekDays[date.getDay()]
      const hours12 = date.getHours() % 12 || 12
      const minutesFormatted = date.getMinutes().toString().padStart(2, '0')
      const ampm = date.getHours() >= 12 ? 'ب.ظ' : 'ق.ظ'
      return `${dayName} ${hours12}:${minutesFormatted} ${ampm}`
    }
    
    // برای پیام‌های قدیمی‌تر - نمایش تاریخ کامل
    const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    const day = date.getDate()
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    const hours12 = date.getHours() % 12 || 12
    const minutesFormatted = date.getMinutes().toString().padStart(2, '0')
    const ampm = date.getHours() >= 12 ? 'ب.ظ' : 'ق.ظ'
    
    return `${day} ${month} ${year}، ${hours12}:${minutesFormatted} ${ampm}`
  } catch {
    return 'نامشخص'
  }
}

// Helper function to format date for conversation list (shorter format)
function formatConversationTime(dateString: string): string {
  try {
    // Parse UTC date string and convert to Tehran timezone
    const date = parseUTCDateToTehran(dateString)
    // Current time in Tehran timezone
    const now = parseUTCDateToTehran(new Date().toISOString())
    
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'اکنون'
    if (minutes < 60) return `${minutes} دقیقه پیش`
    
    // برای پیام‌های امروز - فقط ساعت
    if (hours < 24 && date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      const hours12 = date.getHours() % 12 || 12
      const minutesFormatted = date.getMinutes().toString().padStart(2, '0')
      const ampm = date.getHours() >= 12 ? 'ب.ظ' : 'ق.ظ'
      return `${hours12}:${minutesFormatted} ${ampm}`
    }
    
    // برای پیام‌های دیروز
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
      return 'دیروز'
    }
    
    // برای پیام‌های این هفته
    if (days < 7) {
      const weekDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
      return weekDays[date.getDay()]
    }
    
    // برای پیام‌های قدیمی‌تر - فقط تاریخ
    const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    const day = date.getDate()
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    
    return `${day} ${month} ${year}`
  } catch {
    return 'نامشخص'
  }
}

// Helper function to generate avatar color from user ID
function getAvatarColor(userId: number): string {
  const colors = ['#0dc152', '#4f46e5', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
  return colors[userId % colors.length]
}

type ViewMode = 'list' | 'chat' | 'notifications' | 'channels' | 'new-chat'

interface NotificationItem {
  id: number
  title: string
  excerpt: string
  time: string
  category: 'news' | 'alert' | 'update'
  badge: string
}

interface ChannelItem {
  id: number
  name: string
  description: string
  members: string
  lastPost: string
  category: 'official' | 'community'
}

export interface MessengerProps {
  onClose?: () => void
  onOpenProfile?: () => void
  initialChatUserId?: number // userId برای شروع گفتگو به صورت خودکار
}

export default function Messenger({ onClose, onOpenProfile, initialChatUserId }: MessengerProps) {
  const [userId, setUserId] = useState<number | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [activeConversationDbId, setActiveConversationDbId] = useState<number | null>(null)
  const [messagesByConversation, setMessagesByConversation] =
    useState<Record<number, Message[]>>({})
  const [messageInput, setMessageInput] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const initialChatHandledRef = useRef(false)
  
  // Get userId from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserId = localStorage.getItem('userId')
      if (savedUserId) {
        setUserId(parseInt(savedUserId))
      }
    }
  }, [])
  
  // Fetch conversations when userId is available
  useEffect(() => {
    if (!userId) return
    
    let isInitialLoad = true
    
    const fetchConversations = async (silent: boolean = false) => {
      // Only show loading on initial load
      if (isInitialLoad && !silent) {
        setIsLoadingConversations(true)
        isInitialLoad = false
      }
      
      try {
        const response = await fetch(`/api/conversations?userId=${userId}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          // Transform database conversations to UI format
          const formattedConversations: Conversation[] = data.data.map((conv: any) => {
            const otherUser = conv.other_user || {}
            const lastMessageText = conv.last_message_text || 'هیچ پیامی وجود ندارد'
            const lastMessageTime = formatConversationTime(conv.last_message_time || conv.created_at)
            
            return {
              id: conv.id, // Database conversation ID
              conversationId: conv.id,
              otherUserId: conv.other_user_id,
              name: otherUser.username || `کاربر ${otherUser.id}`,
              status: 'offline' as Presence, // TODO: implement presence tracking
              subtitle: lastMessageText,
              lastMessageAt: lastMessageTime,
              unread: conv.unread_count || 0,
              avatarColor: getAvatarColor(otherUser.id || conv.id)
            }
          })
          
          // Smart update: only update if there are actual changes
          setConversations((prev) => {
            // Compare conversations to avoid unnecessary updates
            const prevIds = prev.map(c => `${c.id}-${c.unread}-${c.lastMessageAt}`).join('|')
            const newIds = formattedConversations.map(c => `${c.id}-${c.unread}-${c.lastMessageAt}`).join('|')
            
            if (prevIds !== newIds) {
              return formattedConversations
            }
            return prev
          })
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        if (!silent) {
          setIsLoadingConversations(false)
        }
      }
    }
    
    // Initial load
    fetchConversations(false)
    
    // Silent refresh every 60 seconds (increased interval, silent updates)
    // Only refresh when page is visible
    let interval: NodeJS.Timeout | null = null
    
    const startInterval = () => {
      if (interval) clearInterval(interval)
      interval = setInterval(() => {
        // Only refresh if page is visible
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchConversations(true)
        }
      }, 60000)
    }
    
    startInterval()
    
    // Pause refresh when page is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined') {
        if (document.visibilityState === 'visible') {
          startInterval()
          // Refresh once when page becomes visible
          fetchConversations(true)
        } else {
          if (interval) {
            clearInterval(interval)
            interval = null
          }
        }
      }
    }
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    
    return () => {
      if (interval) clearInterval(interval)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      isInitialLoad = true
    }
  }, [userId])
  
  // شروع گفتگو با کاربر مشخص شده (از AdDetails)
  useEffect(() => {
    if (
      initialChatUserId && 
      userId && 
      userId !== initialChatUserId && 
      !isLoadingConversations && 
      !initialChatHandledRef.current &&
      conversations.length >= 0 // اطمینان از اینکه conversations لود شده (حتی اگر خالی باشد)
    ) {
      initialChatHandledRef.current = true
      
      // بررسی وجود گفتگوی موجود
      const existingConv = conversations.find(c => c.otherUserId === initialChatUserId)
      
      if (existingConv) {
        // اگر گفتگو از قبل وجود دارد، آن را باز کن
        setActiveConversationId(existingConv.id)
        setActiveConversationDbId(existingConv.conversationId || existingConv.id)
        setViewMode('chat')
      } else {
        // ایجاد گفتگوی جدید
        const startChat = async () => {
          try {
            // ایجاد یا دریافت گفتگو
            const response = await fetch('/api/conversations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user1Id: userId,
                user2Id: initialChatUserId
              })
            })

            const data = await response.json()
            
            if (data.success && data.data) {
              // به‌روزرسانی لیست گفتگوها
              const refreshResponse = await fetch(`/api/conversations?userId=${userId}`)
              const refreshData = await refreshResponse.json()
              
              if (refreshData.success && refreshData.data) {
                const formattedConversations: Conversation[] = refreshData.data.map((conv: any) => {
                  const otherUser = conv.other_user || {}
                  const lastMessageText = conv.last_message_text || 'هیچ پیامی وجود ندارد'
                  const lastMessageTime = formatConversationTime(conv.last_message_time || conv.created_at)
                  
                  return {
                    id: conv.id,
                    conversationId: conv.id,
                    otherUserId: conv.other_user_id,
                    name: otherUser.username || `کاربر ${otherUser.id}`,
                    status: 'offline' as Presence,
                    subtitle: lastMessageText,
                    lastMessageAt: lastMessageTime,
                    unread: conv.unread_count || 0,
                    avatarColor: getAvatarColor(otherUser.id || conv.id)
                  }
                })
                
                setConversations(formattedConversations)
                
                // باز کردن گفتگوی جدید
                const newConversation = formattedConversations.find(
                  c => c.conversationId === data.data.id || c.otherUserId === initialChatUserId
                )
                
                if (newConversation) {
                  setActiveConversationId(newConversation.id)
                  setActiveConversationDbId(newConversation.conversationId || newConversation.id)
                  setViewMode('chat')
                }
              }
            }
          } catch (error) {
            console.error('Error starting conversation:', error)
            initialChatHandledRef.current = false // Reset on error to retry
          }
        }
        startChat()
      }
    }
  }, [initialChatUserId, userId, conversations, isLoadingConversations])
  
  // Reset flag when initialChatUserId changes
  useEffect(() => {
    if (initialChatUserId) {
      initialChatHandledRef.current = false
    }
  }, [initialChatUserId])
  
  const notifications: NotificationItem[] = useMemo(
    () => [
      {
        id: 1,
        title: 'نسخه ۱.۵ پلتفرم منتشر شد',
        excerpt: 'طراحی نقشه‌ های جدید و بهینه‌سازی تجربه کاربری پروفایل‌ها اضافه شد.',
        time: '۵ دقیقه پیش',
        category: 'update',
        badge: 'به‌روزرسانی'
      },
      {
        id: 2,
        title: 'رویداد آفلاین White Hills',
        excerpt: 'همه‌ کاربران دعوت هستند جمعه ساعت ۱۸ برای رونمایی از آگهی‌های منتخب.',
        time: 'امروز',
        category: 'news',
        badge: 'رویداد'
      },
      {
        id: 3,
        title: 'هشدار امنیتی',
        excerpt: 'برای حفظ امنیت حساب، تأیید دومرحله‌ای را فعال کنید.',
        time: 'دیروز',
        category: 'alert',
        badge: 'امنیتی'
      }
    ],
    []
  )
  const channels: ChannelItem[] = useMemo(
    () => [
      {
        id: 1,
        name: 'کانال رسمی White Hills',
        description: 'آخرین کمپین‌ها، راهنمایی‌ها و بروزرسانی‌های تیم طراحی.',
        members: '۱۲٬۳۴۵ عضو',
        lastPost: '۱ ساعت پیش',
        category: 'official'
      },
      {
        id: 2,
        name: 'Community Creators',
        description: 'به اشتراک‌گذاری آگهی‌های برتر کاربران و نقد و بررسی طراحی.',
        members: '۶٬۷۸۹ عضو',
        lastPost: 'دیروز',
        category: 'community'
      },
      {
        id: 3,
        name: 'نقشه‌سازان منطقه‌ای',
        description: 'اخبار محلی، پروژه‌های فعال و فرصت‌های موقعیت‌محور.',
        members: '۳٬۴۵۰ عضو',
        lastPost: '۳ روز پیش',
        category: 'community'
      }
    ],
    []
  )

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  )

  const activeMessages = activeConversationId
    ? messagesByConversation[activeConversationId] ?? []
    : []

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!activeConversationDbId || !userId) return
    
    let isInitialLoad = true
    let lastMessageIds: string = ''
    
    const fetchMessages = async (silent: boolean = false) => {
      // Only show loading on initial load
      if (isInitialLoad && !silent) {
        setIsLoadingMessages(true)
        isInitialLoad = false
      }
      
      try {
        const response = await fetch(
          `/api/messages/${activeConversationDbId}?userId=${userId}&markAsRead=${!silent}`
        )
        const data = await response.json()
        
        if (data.success && data.data) {
          // Transform database messages to UI format
          const formattedMessages: Message[] = data.data.map((msg: any) => {
            const isOutgoing = msg.sender_id === userId
            const time = formatPersianTime(msg.created_at)
            
            return {
              id: msg.id,
              direction: isOutgoing ? 'outgoing' : 'incoming',
              text: msg.text,
              time: time,
              status: msg.status === 'seen' ? 'seen' : msg.status === 'delivered' ? 'delivered' : 'sent'
            }
          })
          
          // Check if messages actually changed (compare message IDs)
          const currentMessageIds = formattedMessages.map(m => m.id).join(',')
          const hasChanges = currentMessageIds !== lastMessageIds
          lastMessageIds = currentMessageIds
          
          // Only update if there are changes (avoid unnecessary re-renders)
          if (hasChanges || !silent) {
            setMessagesByConversation((prev) => {
              const current = prev[activeConversationId!] || []
              const currentIds = current.map(m => m.id).join(',')
              
              // Only update if actually different
              if (currentIds !== currentMessageIds) {
                return {
                  ...prev,
                  [activeConversationId!]: formattedMessages
                }
              }
              return prev
            })
            
            // Mark conversation as read in the list (only when not silent)
            if (!silent) {
              setConversations((prev) =>
                prev.map((conversation) =>
                  conversation.id === activeConversationId
                    ? { ...conversation, unread: 0 }
                    : conversation
                )
              )
            }
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        if (!silent) {
          setIsLoadingMessages(false)
        }
      }
    }
    
    // Initial load
    fetchMessages(false)
    
    // Silent refresh every 20 seconds (increased interval, silent updates)
    // Only refresh when page is visible and chat is active
    let interval: NodeJS.Timeout | null = null
    
    const startInterval = () => {
      if (interval) clearInterval(interval)
      interval = setInterval(() => {
        // Only refresh if page is visible
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchMessages(true)
        }
      }, 20000)
    }
    
    startInterval()
    
    // Pause refresh when page is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined') {
        if (document.visibilityState === 'visible') {
          startInterval()
          // Refresh once when page becomes visible (if chat is still open)
          if (activeConversationDbId) {
            fetchMessages(true)
          }
        } else {
          if (interval) {
            clearInterval(interval)
            interval = null
          }
        }
      }
    }
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    
    return () => {
      if (interval) clearInterval(interval)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      isInitialLoad = true
      lastMessageIds = ''
    }
  }, [activeConversationDbId, userId, activeConversationId])
  
  // Helper function to refresh conversations list
  const refreshConversationsList = useCallback(async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const formattedConversations: Conversation[] = data.data.map((conv: any) => {
          const otherUser = conv.other_user || {}
          const lastMessageText = conv.last_message_text || 'هیچ پیامی وجود ندارد'
          const lastMessageTime = formatConversationTime(conv.last_message_time || conv.created_at)
          
          return {
            id: conv.id,
            conversationId: conv.id,
            otherUserId: conv.other_user_id,
            name: otherUser.username || `کاربر ${otherUser.id}`,
            status: 'offline' as Presence,
            subtitle: lastMessageText,
            lastMessageAt: lastMessageTime,
            unread: conv.unread_count || 0,
            avatarColor: getAvatarColor(otherUser.id || conv.id)
          }
        })
        
        // Smart update: only update if there are actual changes
        setConversations((prev) => {
          // Compare to avoid unnecessary re-renders
          const prevIds = prev.map(c => `${c.id}-${c.unread}-${c.lastMessageAt}-${c.subtitle}`).join('|')
          const newIds = formattedConversations.map(c => `${c.id}-${c.unread}-${c.lastMessageAt}-${c.subtitle}`).join('|')
          
          if (prevIds !== newIds) {
            return formattedConversations
          }
          return prev
        })
        
        // Update active conversation reference if it changed
        if (activeConversationDbId) {
          const updatedConv = formattedConversations.find(c => c.conversationId === activeConversationDbId)
          if (updatedConv && updatedConv.id !== activeConversationId) {
            setActiveConversationId(updatedConv.id)
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error)
    }
  }, [userId, activeConversationDbId, activeConversationId])
  
  // Scroll to bottom when messages change (only if user is near bottom)
  useEffect(() => {
    if (messagesContainerRef.current && activeMessages.length > 0) {
      const container = messagesContainerRef.current
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      
      // Only auto-scroll if user is near bottom (hasn't scrolled up to read old messages)
      if (isNearBottom || activeMessages.length === 1) {
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      }
    }
  }, [activeMessages])
  
  useEffect(() => {
    setMessageInput('')
  }, [activeConversationId])

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }
  
  // Filter conversations based on search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations
    const normalized = searchTerm.replace(/\s+/g, '').toLowerCase()
    return conversations.filter((conversation) =>
      conversation.name.replace(/\s+/g, '').toLowerCase().includes(normalized)
    )
  }, [conversations, searchTerm])

  const handleSelectConversation = (conversationId: number) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setActiveConversationId(conversationId)
      setActiveConversationDbId(conversation.conversationId || conversationId)
      setViewMode('chat')
    }
  }

  const handleBackToList = () => {
    setViewMode('list')
    setActiveConversationId(null)
    setActiveConversationDbId(null)
    setMessageInput('')
    setUserSearchTerm('')
  }

  const handleOpenNotifications = () => {
    setViewMode('notifications')
    setActiveConversationId(null)
  }

  const handleOpenChannels = () => {
    setViewMode('channels')
    setActiveConversationId(null)
  }

  const handleOpenNewChat = async () => {
    if (!userId) return
    setViewMode('new-chat')
    setIsLoadingUsers(true)
    try {
      const response = await fetch(`/api/users/chat?currentUserId=${userId}`)
      const data = await response.json()
      if (data.success && data.data) {
        setAvailableUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleStartConversation = async (otherUserId: number) => {
    if (!userId) return
    
    try {
      // بررسی وجود گفتگوی موجود
      const existingConv = conversations.find(c => c.otherUserId === otherUserId)
      if (existingConv) {
        // اگر گفتگو از قبل وجود دارد، آن را باز کن
        setActiveConversationId(existingConv.id)
        setActiveConversationDbId(existingConv.conversationId || existingConv.id)
        setViewMode('chat')
        setUserSearchTerm('')
        return
      }
      
      // ایجاد یا دریافت گفتگو
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user1Id: userId,
          user2Id: otherUserId
        })
      })

      const data = await response.json()
      
      if (data.success && data.data) {
        // به‌روزرسانی لیست گفتگوها
        const refreshResponse = await fetch(`/api/conversations?userId=${userId}`)
        const refreshData = await refreshResponse.json()
        
        if (refreshData.success && refreshData.data) {
          const formattedConversations: Conversation[] = refreshData.data.map((conv: any) => {
            const otherUser = conv.other_user || {}
            const lastMessageText = conv.last_message_text || 'هیچ پیامی وجود ندارد'
            const lastMessageTime = formatConversationTime(conv.last_message_time || conv.created_at)
            
            return {
              id: conv.id,
              conversationId: conv.id,
              otherUserId: conv.other_user_id,
              name: otherUser.username || `کاربر ${otherUser.id}`,
              status: 'offline' as Presence,
              subtitle: lastMessageText,
              lastMessageAt: lastMessageTime,
              unread: conv.unread_count || 0,
              avatarColor: getAvatarColor(otherUser.id || conv.id)
            }
          })
          
          setConversations(formattedConversations)
          
          // باز کردن گفتگوی جدید
          const newConversation = formattedConversations.find(
            c => c.conversationId === data.data.id || c.otherUserId === otherUserId
          )
          
          if (newConversation) {
            setActiveConversationId(newConversation.id)
            setActiveConversationDbId(newConversation.conversationId || newConversation.id)
            setViewMode('chat')
            setUserSearchTerm('')
          }
        }
      } else {
        alert('خطا در ایجاد گفتگو: ' + (data.error || 'خطای نامشخص'))
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('خطا در شروع گفتگو')
    }
  }

  // Filter available users based on search
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return availableUsers
    const normalized = userSearchTerm.replace(/\s+/g, '').toLowerCase()
    return availableUsers.filter((user: any) =>
      (user.username || '').replace(/\s+/g, '').toLowerCase().includes(normalized) ||
      (user.phone || '').replace(/\s+/g, '').includes(normalized)
    )
  }, [availableUsers, userSearchTerm])

  const handleSendMessage = async () => {
    if (!activeConversationDbId || !userId || !activeConversationId) return
    const trimmed = messageInput.trim()
    if (!trimmed || isSendingMessage) return

    const conversation = conversations.find(c => c.id === activeConversationId)
    if (!conversation || !conversation.otherUserId) return

    setIsSendingMessage(true)

    // Optimistically add message to UI
    const now = new Date()
    const tempId = `temp-${now.getTime()}`
    const time = formatPersianTime(now.toISOString())

    setMessagesByConversation((prev) => {
      const currentMessages = prev[activeConversationId] ?? []
      return {
        ...prev,
        [activeConversationId]: [
          ...currentMessages,
          { id: tempId, direction: 'outgoing', text: trimmed, time, status: 'sent' }
        ]
      }
    })

    setMessageInput('')

    try {
      // Send message to API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: activeConversationDbId,
          senderId: userId,
          receiverId: conversation.otherUserId,
          text: trimmed
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        // Replace temporary message with real message from server
        const realMessage: Message = {
          id: data.data.id,
          direction: 'outgoing',
          text: data.data.text,
          time: formatPersianTime(data.data.created_at),
          status: data.data.status
        }

        setMessagesByConversation((prev) => {
          const currentMessages = prev[activeConversationId] ?? []
          const filtered = currentMessages.filter(m => m.id !== tempId)
          return {
            ...prev,
            [activeConversationId]: [...filtered, realMessage]
          }
        })

        // Update conversation list
        await refreshConversationsList()
      } else {
        // Remove optimistic message on error
        setMessagesByConversation((prev) => {
          const currentMessages = prev[activeConversationId] ?? []
          return {
            ...prev,
            [activeConversationId]: currentMessages.filter(m => m.id !== tempId)
          }
        })
        alert('خطا در ارسال پیام: ' + (data.error || 'خطای نامشخص'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message on error
      setMessagesByConversation((prev) => {
        const currentMessages = prev[activeConversationId] ?? []
        return {
          ...prev,
          [activeConversationId]: currentMessages.filter(m => m.id !== tempId)
        }
      })
      alert('خطا در ارسال پیام')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  // Show login message if user is not logged in
  if (!userId) {
    return (
      <section className="messenger-mobile">
        <div className="messenger-mobile__view messenger-mobile__view--list">
          <header className="messenger-mobile__list-header messenger-mobile__list-header--search">
            <button type="button" className="messenger-mobile__icon-button" onClick={() => onClose?.()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83l-.06.06a2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0l-.06-.06a2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83l.06-.06a2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0l.06.06a2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <div className="messenger-mobile__search messenger-mobile__search--header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input placeholder="جستجو در گفتگوها..." disabled />
            </div>
            <button type="button" className="messenger-mobile__icon-button" title="گفتگوی جدید" disabled>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </header>
          <div className="messenger-mobile__chat-list">
            <div className="messenger-mobile__empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '10px' }}>برای استفاده از پیام‌رسان لطفاً وارد شوید</p>
              <button 
                onClick={() => onOpenProfile?.()} 
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                رفتن به پروفایل
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="messenger-mobile">
      {viewMode === 'list' && (
        <div className="messenger-mobile__view messenger-mobile__view--list">
          <header className="messenger-mobile__list-header messenger-mobile__list-header--search">
            <button type="button" className="messenger-mobile__icon-button" onClick={() => onClose?.()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83l-.06.06a2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0l-.06-.06a2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83l.06-.06a2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0l.06.06a2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <div className="messenger-mobile__search messenger-mobile__search--header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input 
                placeholder="جستجو در گفتگوها..." 
                value={searchTerm}
                onChange={handleSearchChange} 
              />
            </div>
            <button 
              type="button" 
              className="messenger-mobile__icon-button" 
              title="گفتگوی جدید"
              onClick={handleOpenNewChat}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </header>

          <div className="messenger-mobile__chat-list">
            <button
              type="button"
              className="messenger-mobile__notification-entry"
              onClick={handleOpenNotifications}
            >
              <div className="messenger-mobile__notification-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="messenger-mobile__notification-copy">
                <strong>اخبار و اعلان‌ها</strong>
                <span>آخرین تغییرات و اطلاعیه‌های پلتفرم</span>
              </div>
              <span className="messenger-mobile__notification-meta">
                <span className="messenger-mobile__badge messenger-mobile__badge--inverse">
                  {notifications.length}
                </span>
              </span>
            </button>

            <button
              type="button"
              className="messenger-mobile__channel-entry"
              onClick={handleOpenChannels}
            >
              <div className="messenger-mobile__channel-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5h12" />
                  <path d="M7 5v14" />
                  <rect x="13" y="5" width="8" height="14" rx="2" />
                  <path d="M17 9h-2" />
                </svg>
              </div>
              <div className="messenger-mobile__channel-copy">
                <strong>کانال‌ها</strong>
                <span>کانال‌های رسمی و جامعه کاربری</span>
              </div>
              <span className="messenger-mobile__channel-meta">
                <span className="messenger-mobile__badge messenger-mobile__badge--inverse">
                  {channels.length}
                </span>
              </span>
            </button>

            {isLoadingConversations && conversations.length === 0 ? (
              <div className="messenger-mobile__empty">در حال بارگذاری...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="messenger-mobile__empty">گفتگویی یافت نشد.</div>
            ) : (
              filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`messenger-mobile__chat-item ${
                  conversation.id === activeConversationId ? 'is-active' : ''
                }`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <span
                  className="messenger-mobile__avatar"
                  style={{ backgroundColor: conversation.avatarColor }}
                >
                  {conversation.name.charAt(0)}
                  <span className={`messenger-mobile__presence messenger-mobile__presence--${conversation.status}`} />
                </span>
                <span className="messenger-mobile__chat-copy">
                  <strong>{conversation.name}</strong>
                  <span>{conversation.subtitle}</span>
                </span>
                <span className="messenger-mobile__chat-meta">
                  <time>{conversation.lastMessageAt}</time>
                  {conversation.unread > 0 && (
                    <span className="messenger-mobile__badge">{conversation.unread}</span>
                  )}
                </span>
              </button>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'channels' && (
        <div className="messenger-mobile__view messenger-mobile__view--channels">
          <header className="messenger-mobile__chat-header">
            <button type="button" className="messenger-mobile__icon-button" onClick={handleBackToList}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="messenger-mobile__chat-heading">
              <span className="messenger-mobile__chat-name">کانال‌های پلتفرم</span>
              <span className="messenger-mobile__chat-status">کانال‌های رسمی و منتخب جامعه</span>
            </span>
            <span className="messenger-mobile__chat-actions">
              <button type="button" className="messenger-mobile__icon-button" title="ساخت کانال جدید">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </span>
          </header>

          <div className="messenger-mobile__channels">
            {channels.map((channel) => (
              <article key={channel.id} className={`messenger-mobile__channel-card messenger-mobile__channel-card--${channel.category}`}>
                <header>
                  <h3>{channel.name}</h3>
                  <span className="messenger-mobile__badge messenger-mobile__badge--ghost">
                    {channel.category === 'official' ? 'رسمی' : 'جامعه'}
                  </span>
                </header>
                <p>{channel.description}</p>
                <div className="messenger-mobile__channel-stats">
                  <span>{channel.members}</span>
                  <span>{channel.lastPost}</span>
                </div>
                <footer>
                  <button type="button" className="messenger-mobile__pill-button">مشاهده کانال</button>
                  <button type="button" className="messenger-mobile__pill-button messenger-mobile__pill-button--subtle">
                    اشتراک‌گذاری
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'new-chat' && (
        <div className="messenger-mobile__view messenger-mobile__view--list">
          <header className="messenger-mobile__chat-header">
            <button type="button" className="messenger-mobile__icon-button" onClick={handleBackToList}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="messenger-mobile__chat-heading">
              <span className="messenger-mobile__chat-name">شروع گفتگوی جدید</span>
              <span className="messenger-mobile__chat-status">کاربر مورد نظر را انتخاب کنید</span>
            </span>
            <span className="messenger-mobile__chat-actions"></span>
          </header>

          <div className="messenger-mobile__search" style={{ margin: '10px', marginBottom: '0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              placeholder="جستجو کاربر..." 
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
            />
          </div>

          <div className="messenger-mobile__chat-list">
            {isLoadingUsers ? (
              <div className="messenger-mobile__empty">در حال بارگذاری کاربران...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="messenger-mobile__empty">کاربری یافت نشد.</div>
            ) : (
              filteredUsers.map((user: any) => {
                // Check if conversation already exists
                const existingConversation = conversations.find(
                  c => c.otherUserId === user.id
                )
                
                return (
                  <button
                    key={user.id}
                    type="button"
                    className="messenger-mobile__chat-item"
                    onClick={() => {
                      if (existingConversation) {
                        // Open existing conversation
                        setActiveConversationId(existingConversation.id)
                        setActiveConversationDbId(existingConversation.conversationId || existingConversation.id)
                        setViewMode('chat')
                        setUserSearchTerm('')
                      } else {
                        // Start new conversation
                        handleStartConversation(user.id)
                      }
                    }}
                  >
                    <span
                      className="messenger-mobile__avatar"
                      style={{ backgroundColor: getAvatarColor(user.id) }}
                    >
                      {(user.username || `کاربر ${user.id}`).charAt(0)}
                    </span>
                    <span className="messenger-mobile__chat-copy">
                      <strong>{user.username || `کاربر ${user.id}`}</strong>
                      <span>{user.phone || ''}</span>
                    </span>
                    {existingConversation && (
                      <span className="messenger-mobile__chat-meta">
                        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                          گفتگوی موجود
                        </span>
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {viewMode === 'notifications' && (
        <div className="messenger-mobile__view messenger-mobile__view--notifications">
          <header className="messenger-mobile__chat-header">
            <button type="button" className="messenger-mobile__icon-button" onClick={handleBackToList}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="messenger-mobile__chat-heading">
              <span className="messenger-mobile__chat-name">اخبار و اعلان‌ها</span>
              <span className="messenger-mobile__chat-status">مرتب‌سازی از جدید به قدیم</span>
            </span>
            <span className="messenger-mobile__chat-actions">
              <button type="button" className="messenger-mobile__icon-button" title="تنظیمات اعلان‌ها">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83l-.06.06a2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0l-.06-.06a2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83l.06-.06a2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0l.06.06a2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </span>
          </header>

          <div className="messenger-mobile__notifications">
            {notifications.map((item) => (
              <article key={item.id} className={`messenger-mobile__notification-card messenger-mobile__notification-card--${item.category}`}>
                <header>
                  <span className="messenger-mobile__badge messenger-mobile__badge--ghost">{item.badge}</span>
                  <time>{item.time}</time>
                </header>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
                <footer>
                  <button type="button" className="messenger-mobile__pill-button">مشاهده جزئیات</button>
                  <button type="button" className="messenger-mobile__pill-button messenger-mobile__pill-button--subtle">
                    بایگانی
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'chat' && activeConversation && (
        <div className="messenger-mobile__view messenger-mobile__view--chat">
          <header className="messenger-mobile__chat-header">
            <button type="button" className="messenger-mobile__icon-button" onClick={handleBackToList}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="messenger-mobile__chat-heading">
              <span className="messenger-mobile__chat-name">{activeConversation.name}</span>
              <span className="messenger-mobile__chat-status">
                {activeConversation.status === 'online'
                  ? 'آنلاین'
                  : activeConversation.status === 'away'
                  ? 'آخرین بازدید اخیراً'
                  : 'آخرین بازدید نامشخص'}
              </span>
            </span>
            <span className="messenger-mobile__chat-actions">
              <button type="button" className="messenger-mobile__icon-button" title="تماس صوتی">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2 4.18 2 2 0 0 1 4 2h2.09a2 2 0 0 1 2 1.72c.12.86.37 1.7.72 2.5a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.58-1.42a2 2 0 0 1 2.11-.45 11.36 11.36 0 0 0 2.5.72A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>
              <button type="button" className="messenger-mobile__icon-button" title="پروفایل">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </span>
          </header>

          <div 
            className="messenger-mobile__messages"
            ref={messagesContainerRef}
          >
            {isLoadingMessages ? (
              <div className="messenger-mobile__empty messenger-mobile__empty--chat">
                در حال بارگذاری پیام‌ها...
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="messenger-mobile__empty messenger-mobile__empty--chat">
                هنوز پیامی رد و بدل نشده، اولین پیام را بفرست!
              </div>
            ) : (
              <>
                {activeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`messenger-mobile__bubble messenger-mobile__bubble--${message.direction}`}
                  >
                    <span>{message.text}</span>
                    <footer>
                      <time>{message.time}</time>
                      {message.direction === 'outgoing' && message.status && (
                        <span className={`messenger-mobile__send-status messenger-mobile__send-status--${message.status}`}>
                          {message.status === 'seen'
                            ? '✔✔'
                            : message.status === 'delivered'
                            ? '✔✔'
                            : '✔'}
                        </span>
                      )}
                    </footer>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="messenger-mobile__composer">
            <button type="button" className="messenger-mobile__icon-button" title="پیوست">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.2-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.48-8.48" />
              </svg>
            </button>
            <input
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="پیام خود را بنویسید..."
              disabled={isSendingMessage}
            />
            <button 
              type="button" 
              className="messenger-mobile__send-button" 
              onClick={handleSendMessage}
              disabled={isSendingMessage || !messageInput.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

