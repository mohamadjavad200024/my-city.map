'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { createRoot } from 'react-dom/client'
import AdCard from '@/components/AdCard'
import StoreCard from '@/components/StoreCard'

declare global {
  interface Window {
    L: any
  }
}

interface CityMapProps {
  whiteHillsRadius?: number
  onAdMarkerClick?: (position: { lat: number; lng: number }) => void
  onAdCardClick?: (productId: number) => void
  onStoreClick?: (userId: number) => void
  products?: Array<{
    id: number
    title: string
    price: number
    lat?: number | null
    lng?: number | null
    images?: string[]
    user_id?: number
    created_at?: string
    status?: string
    description?: string
    is_store?: number | boolean
    store_name?: string | null
  }>
  userHasLocation?: boolean
  userLocation?: { lat: number; lng: number } | null
  onLocationSet?: (position: { lat: number; lng: number }) => void
  onChangeLocation?: () => void
  isChangingLocation?: boolean
}

export default function CityMap({ whiteHillsRadius = 1000, onAdMarkerClick, onAdCardClick, onStoreClick, products = [], userHasLocation = false, userLocation: propUserLocation = null, onLocationSet, onChangeLocation, isChangingLocation = false }: CityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const observerRef = useRef<MutationObserver | null>(null)
  const locationMarkerRef = useRef<any>(null)
  const whiteHillsCircleRef = useRef<any>(null)
  const clickPopupRef = useRef<any>(null)
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const productMarkersRef = useRef<any[]>([])
  const userHasLocationRef = useRef<boolean>(userHasLocation)
  const onAdCardClickRef = useRef(onAdCardClick)
  const onStoreClickRef = useRef(onStoreClick)
  
  // به‌روزرسانی ref وقتی callback تغییر می‌کند
  useEffect(() => {
    onAdCardClickRef.current = onAdCardClick
  }, [onAdCardClick])
  
  useEffect(() => {
    onStoreClickRef.current = onStoreClick
  }, [onStoreClick])
  
  // استفاده مستقیم از prop به جای state داخلی برای اطمینان از به‌روزرسانی فوری
  const userLocation = propUserLocation
  
  // به‌روزرسانی ref وقتی userHasLocation تغییر می‌کند
  useEffect(() => {
    userHasLocationRef.current = userHasLocation
  }, [userHasLocation])

  // بارگذاری Leaflet CSS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // بررسی اینکه آیا CSS قبلاً اضافه شده یا نه
      const existingLink = document.querySelector('link[href*="leaflet.css"]')
      if (!existingLink) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      }
    }
  }, [])

  useEffect(() => {
    if (isLeafletLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap()
    }
  }, [isLeafletLoaded, propUserLocation, userHasLocation])

  useEffect(() => {
    // به‌روزرسانی شعاع دایره وقتی whiteHillsRadius تغییر می‌کند - فقط اگر لوکیشن ثبت شده باشد
    if (mapInstanceRef.current && whiteHillsCircleRef.current && userHasLocation) {
      const updateRadius = (mapInstanceRef.current as any).updateWhiteHillsRadius
      if (updateRadius) {
        updateRadius(whiteHillsRadius)
      }
    }
  }, [whiteHillsRadius, userHasLocation])

  useEffect(() => {
    return () => {
      // تمیز کردن observer
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      
      // تمیز کردن marker موقعیت
      if (locationMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(locationMarkerRef.current)
        locationMarkerRef.current = null
      }
      
      // تمیز کردن دایره White Hills
      if (whiteHillsCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(whiteHillsCircleRef.current)
        whiteHillsCircleRef.current = null
      }
      
      // تمیز کردن مارکرهای محصولات
      if (productMarkersRef.current && mapInstanceRef.current) {
        productMarkersRef.current.forEach(marker => {
          mapInstanceRef.current.removeLayer(marker)
        })
        productMarkersRef.current = []
      }
      
      // تمیز کردن نقشه هنگام unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isLeafletLoaded])
  
  // به‌روزرسانی دایره شعاع جستجو - فقط وقتی لوکیشن ثبت شده باشد و موقعیت کاربر مشخص باشد
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return
    
    const map = mapInstanceRef.current
    
    // اگر لوکیشن ثبت نشده یا موقعیت کاربر مشخص نیست، دایره را حذف کن
    if (!userHasLocation || !userLocation) {
      if (whiteHillsCircleRef.current) {
        map.removeLayer(whiteHillsCircleRef.current)
        whiteHillsCircleRef.current = null
      }
      return
    }
    
    // اگر لوکیشن ثبت شده و موقعیت کاربر مشخص است و دایره وجود ندارد، آن را ایجاد کن
    if (userHasLocation && userLocation && !whiteHillsCircleRef.current) {
      const whiteHillsCircle = window.L.circle([userLocation.lat, userLocation.lng], {
        color: '#8b5cf6',
        fillColor: '#8b5cf6',
        fillOpacity: 0.2,
        radius: whiteHillsRadius,
        weight: 2,
        interactive: false,
      }).addTo(map)
      
      whiteHillsCircle.bindPopup(`<div style="color: #ffffff;"><b>محدوده جستجو</b><br/>محدوده شعاع: ${whiteHillsRadius >= 1000 ? `${(whiteHillsRadius / 1000).toFixed(whiteHillsRadius % 1000 === 0 ? 0 : 1)} کیلومتر` : `${whiteHillsRadius} متر`}</div>`)
      whiteHillsCircleRef.current = whiteHillsCircle
      
      const updateCircleRadius = (newRadius: number) => {
        if (whiteHillsCircleRef.current) {
          whiteHillsCircleRef.current.setRadius(newRadius)
          whiteHillsCircleRef.current.setPopupContent(`<div style="color: #ffffff;"><b>محدوده جستجو</b><br/>محدوده شعاع: ${newRadius >= 1000 ? `${(newRadius / 1000).toFixed(newRadius % 1000 === 0 ? 0 : 1)} کیلومتر` : `${newRadius} متر`}</div>`)
        }
      }
      
      ;(map as any).updateWhiteHillsRadius = updateCircleRadius
    }
    
    // اگر دایره وجود دارد و موقعیت کاربر تغییر کرده، آن را به‌روزرسانی کن
    if (userHasLocation && userLocation && whiteHillsCircleRef.current) {
      const currentCenter = whiteHillsCircleRef.current.getLatLng()
      // استفاده از tolerance برای مقایسه موقعیت (برای جلوگیری از خطاهای floating point)
      const latDiff = Math.abs(currentCenter.lat - userLocation.lat)
      const lngDiff = Math.abs(currentCenter.lng - userLocation.lng)
      
      if (latDiff > 0.000001 || lngDiff > 0.000001) {
        console.log('موقعیت کاربر تغییر کرده، به‌روزرسانی circle:', {
          old: { lat: currentCenter.lat, lng: currentCenter.lng },
          new: { lat: userLocation.lat, lng: userLocation.lng }
        })
        
        const currentRadius = whiteHillsCircleRef.current.getRadius()
        map.removeLayer(whiteHillsCircleRef.current)
        whiteHillsCircleRef.current = null
        
        const newCircle = window.L.circle([userLocation.lat, userLocation.lng], {
          color: '#8b5cf6',
          fillColor: '#8b5cf6',
          fillOpacity: 0.2,
          radius: currentRadius,
          weight: 2,
          interactive: false,
        }).addTo(map)
        
        newCircle.bindPopup(`<div style="color: #ffffff;"><b>محدوده جستجو</b><br/>محدوده شعاع: ${currentRadius >= 1000 ? `${(currentRadius / 1000).toFixed(currentRadius % 1000 === 0 ? 0 : 1)} کیلومتر` : `${currentRadius} متر`}</div>`)
        whiteHillsCircleRef.current = newCircle
        
        const updateCircleRadius = (newRadius: number) => {
          if (whiteHillsCircleRef.current) {
            whiteHillsCircleRef.current.setRadius(newRadius)
            whiteHillsCircleRef.current.setPopupContent(`<div style="color: #ffffff;"><b>محدوده جستجو</b><br/>محدوده شعاع: ${newRadius >= 1000 ? `${(newRadius / 1000).toFixed(newRadius % 1000 === 0 ? 0 : 1)} کیلومتر` : `${newRadius} متر`}</div>`)
          }
        }
        
        ;(map as any).updateWhiteHillsRadius = updateCircleRadius
      }
    }
  }, [userHasLocation, userLocation, whiteHillsRadius])
  
  // به‌روزرسانی مارکر موقعیت کاربر و متمرکز کردن نقشه
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return
    
    const map = mapInstanceRef.current
    
    // اگر موقعیت کاربر مشخص است، مارکر را ایجاد یا به‌روزرسانی کن
    if (userLocation && userHasLocation) {
      console.log('به‌روزرسانی marker موقعیت کاربر:', userLocation)
      
      // بررسی اینکه آیا marker قبلی وجود دارد و موقعیت آن تغییر کرده
      let shouldUpdate = false
      if (locationMarkerRef.current) {
        const currentPos = locationMarkerRef.current.getLatLng()
        const latDiff = Math.abs(currentPos.lat - userLocation.lat)
        const lngDiff = Math.abs(currentPos.lng - userLocation.lng)
        
        if (latDiff > 0.000001 || lngDiff > 0.000001) {
          console.log('موقعیت marker تغییر کرده، به‌روزرسانی:', {
            old: { lat: currentPos.lat, lng: currentPos.lng },
            new: { lat: userLocation.lat, lng: userLocation.lng }
          })
          shouldUpdate = true
          map.removeLayer(locationMarkerRef.current)
          locationMarkerRef.current = null
        }
      } else {
        shouldUpdate = true
      }
      
      // فقط اگر marker وجود ندارد یا باید به‌روزرسانی شود، marker جدید بساز
      if (shouldUpdate) {
      
      // ایجاد آیکون مارکر موقعیت کاربر
      const userLocationIcon = window.L.divIcon({
        className: 'custom-pin-marker user-location-marker',
        html: `
          <div style="position: relative; width: 36px; height: 46px; display: flex; align-items: center; justify-content: center;">
            <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="userLocationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#60a5fa;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
                </linearGradient>
                <filter id="userLocationShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                  <feOffset dx="0" dy="2" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.5"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <circle cx="18" cy="18" r="12" fill="url(#userLocationGradient)" filter="url(#userLocationShadow)"/>
              <circle cx="18" cy="18" r="11.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
              <circle cx="18" cy="18" r="8" fill="white" opacity="0.95"/>
              <circle cx="18" cy="18" r="7" fill="#3b82f6"/>
              <circle cx="18" cy="18" r="6.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/>
              <g transform="translate(18, 18) scale(0.7)" fill="white" stroke="white" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <circle cx="12" cy="10" r="3.5" fill="currentColor"/>
              </g>
              <circle cx="18" cy="36" r="3" fill="url(#userLocationGradient)" filter="url(#userLocationShadow)"/>
              <circle cx="18" cy="36" r="2.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.4"/>
              <rect x="17.5" y="29" width="1" height="6" fill="url(#userLocationGradient)" opacity="0.6" rx="0.5"/>
            </svg>
          </div>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
        popupAnchor: [0, -46]
      })
      
      // ایجاد مارکر موقعیت کاربر
      const userMarker = window.L.marker([userLocation.lat, userLocation.lng], { icon: userLocationIcon })
        .addTo(map)
      
      // ایجاد popup با دکمه تغییر موقعیت
      const popupContent = `
        <div style="
          color: #ffffff; 
          text-align: center; 
          padding: 16px;
          min-width: 200px;
          background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%);
          border-radius: 12px;
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            font-size: 32px;
          ">📍</div>
          <b style="
            display: block; 
            margin-bottom: 8px;
            font-size: 16px;
            font-weight: 600;
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">موقعیت شما</b>
          <div style="
            font-size: 11px; 
            margin-bottom: 16px; 
            opacity: 0.7;
            font-family: 'Courier New', monospace;
            padding: 6px 10px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(59, 130, 246, 0.2);
          ">
            ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}
          </div>
          <button 
            id="change-location-btn" 
            style="
              background: linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%);
              border: none;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              width: 100%;
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            "
            onmouseover="this.style.background='linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.4)'"
            onmouseout="this.style.background='linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)'"
          >
            🔄 تغییر موقعیت
          </button>
        </div>
      `
      
      userMarker.bindPopup(popupContent)
      
      // اضافه کردن event listener برای دکمه تغییر موقعیت
      userMarker.on('popupopen', () => {
        const btn = document.getElementById('change-location-btn')
        if (btn && onChangeLocation) {
          btn.addEventListener('click', () => {
            onChangeLocation()
            map.closePopup()
          })
        }
      })
      
      userMarker.on('click', () => {
        map.setView([userLocation.lat, userLocation.lng], 15, {
          animate: true,
          duration: 0.5
        })
      })
      
        locationMarkerRef.current = userMarker
        
        // متمرکز کردن نقشه روی موقعیت کاربر و زوم کردن
        // همیشه نقشه را به موقعیت کاربر متمرکز کن و زوم کن
        console.log('متمرکز کردن نقشه روی موقعیت کاربر و زوم:', userLocation)
        map.setView([userLocation.lat, userLocation.lng], 15, {
          animate: true,
          duration: 0.5
        })
      }
    } else {
      // اگر موقعیت کاربر مشخص نیست، مارکر را حذف کن
      if (locationMarkerRef.current) {
        console.log('حذف marker موقعیت کاربر')
        map.removeLayer(locationMarkerRef.current)
        locationMarkerRef.current = null
      }
    }
  }, [userLocation, userHasLocation])
  
  // به‌روزرسانی مارکرهای محصولات وقتی products تغییر می‌کند
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || products.length === 0) return
    
    // دریافت userId فعلی کاربر (اگر لاگین کرده باشد)
    const currentUserId = typeof window !== 'undefined' 
      ? parseInt(localStorage.getItem('userId') || '0') 
      : 0
    
    // حذف مارکرهای قبلی
    productMarkersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker)
    })
    productMarkersRef.current = []
    
    // گروه‌بندی آگهی‌ها بر اساس user_id - یک marker برای هر کاربر
    const productsByUser = new Map<number, any[]>()
    
    products.forEach(product => {
      if (product.lat && product.lng && product.user_id) {
        // اگر این آگهی متعلق به کاربر فعلی است، marker ایجاد نکن
        if (product.user_id === currentUserId && currentUserId > 0) {
          return
        }
        
        if (!productsByUser.has(product.user_id)) {
          productsByUser.set(product.user_id, [])
        }
        productsByUser.get(product.user_id)!.push(product)
      }
    })
    
    // ایجاد یک marker برای هر کاربر (آخرین آگهی)
    productsByUser.forEach((userProducts, userId) => {
      // مرتب‌سازی بر اساس created_at (جدیدترین اول)
      const sortedProducts = userProducts.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      
      // آخرین آگهی کاربر
      const latestProduct = sortedProducts[0]
      
      if (!latestProduct.lat || !latestProduct.lng) return
      
      // بررسی اینکه آیا این کاربر فروشگاه است یا نه
      const isStore = latestProduct.is_store === 1 || latestProduct.is_store === true
      
      // رنگ marker: مشکی-قرمز برای فروشگاه‌ها، نارنجی برای آگهی‌های عادی
      const markerColor = isStore ? '#8b0000' : '#ff6b35'
      const gradient = isStore 
        ? ['#8b0000', '#dc2626', '#8b0000']  // مشکی-قرمز برای فروشگاه
        : ['#ff6b35', '#ff8c55', '#ff6b35']  // نارنجی برای آگهی
      
      // آیکون: فروشگاه برای فروشگاه‌ها، + برای آگهی‌ها
      const iconSvg = isStore 
        ? `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
        : `<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
      
      // ایجاد آیکون مارکر برای آگهی (مشابه marker create-ad)
        const productIcon = window.L.divIcon({
          className: 'custom-pin-marker product-marker',
          html: `
            <div style="position: relative; width: 36px; height: 46px; display: flex; align-items: center; justify-content: center;">
              <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                <linearGradient id="productGradient-${userId}" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:${gradient[0]};stop-opacity:1" />
                  <stop offset="50%" style="stop-color:${gradient[1]};stop-opacity:1" />
                  <stop offset="100%" style="stop-color:${gradient[2]};stop-opacity:1" />
                  </linearGradient>
                <filter id="productShadow-${userId}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                    <feOffset dx="0" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.5"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
              <!-- سایه دایره بزرگ -->
              <circle cx="18" cy="18" r="12" fill="black" opacity="0.15" transform="translate(0.5, 0.5)"/>
              <!-- دایره بزرگ در بالا -->
              <circle cx="18" cy="18" r="12" fill="url(#productGradient-${userId})" filter="url(#productShadow-${userId})"/>
              <!-- حاشیه داخلی دایره -->
                <circle cx="18" cy="18" r="11.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
              <!-- دایره مرکزی سفید -->
                <circle cx="18" cy="18" r="8" fill="white" opacity="0.95"/>
              <circle cx="18" cy="18" r="7" fill="${markerColor}"/>
              <!-- حلقه داخلی برای عمق -->
                <circle cx="18" cy="18" r="6.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/>
              <!-- آیکون SVG در مرکز دایره (➕) -->
                <g transform="translate(18, 18) scale(0.7)" fill="white" stroke="white" stroke-width="2">
                ${iconSvg}
              </g>
              <!-- نقطه کوچک در پایین (مثل سوزن) -->
              <circle cx="18" cy="36" r="3" fill="url(#productGradient-${userId})" filter="url(#productShadow-${userId})"/>
              <!-- سایه نقطه -->
              <circle cx="18" cy="36" r="3" fill="black" opacity="0.1" transform="translate(0.3, 0.3)"/>
              <!-- حاشیه نقطه -->
                <circle cx="18" cy="36" r="2.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.4"/>
              <!-- خط اتصال بین دایره و نقطه -->
              <rect x="17.5" y="29" width="1" height="6" fill="url(#productGradient-${userId})" opacity="0.6" rx="0.5"/>
              </svg>
            </div>
          `,
          iconSize: [36, 46],
          iconAnchor: [18, 46],
          popupAnchor: [0, -46]
        })
      
      // ایجاد marker قبل از استفاده در popup
      const marker = window.L.marker([latestProduct.lat, latestProduct.lng], { icon: productIcon })
        .addTo(mapInstanceRef.current)
        
      // ایجاد popup با استفاده از کامپوننت AdCard یا StoreCard
      const popupContainer = document.createElement('div')
      popupContainer.className = 'ad-card-popup-container'
      popupContainer.style.width = '100%'
      
      // Render کامپوننت AdCard یا StoreCard به container
      const root = createRoot(popupContainer)
      if (isStore && latestProduct.user_id) {
        // اگر فروشگاه است، StoreCard را نمایش بده
        root.render(
          <StoreCard
            userId={latestProduct.user_id}
            storeName={latestProduct.store_name || null}
            profileImage={null} // می‌توانیم بعداً از API بگیریم
            storePosterImage={null}
            onClick={(userId) => {
              // بستن popup
              marker.closePopup()
              // باز کردن StoreView
              if (onStoreClickRef.current) {
                onStoreClickRef.current(userId)
              }
            }}
          />
        )
      } else {
        // اگر آگهی عادی است، AdCard را نمایش بده
        root.render(
          <AdCard
            id={latestProduct.id}
            title={latestProduct.title}
            price={latestProduct.price}
            status={latestProduct.status || 'new'}
            images={latestProduct.images || []}
          />
        )
      }
      
      // تنظیم popup اما بدون باز شدن خودکار با کلیک
      marker.bindPopup(popupContainer, {
        className: 'ad-card-popup',
        maxWidth: 350,
        minWidth: 350,
        autoClose: false,
        closeOnClick: false
      })
      
      // اضافه کردن event listener برای کلیک روی کارت آگهی (فقط برای آگهی‌های عادی)
      if (!isStore) {
        setTimeout(() => {
          const adCardElement = popupContainer.querySelector('.ad-card')
          if (adCardElement) {
            adCardElement.addEventListener('click', () => {
              // بستن popup
              marker.closePopup()
              
              // اگر آگهی عادی است، AdDetails را باز کن
              if (onAdCardClickRef.current) {
                onAdCardClickRef.current(latestProduct.id)
              }
            })
            // تغییر cursor به pointer
            ;(adCardElement as HTMLElement).style.cursor = 'pointer'
          }
        }, 100)
      } else {
        // برای StoreCard، onClick از طریق prop مدیریت می‌شود
        setTimeout(() => {
          const storeCardElement = popupContainer.querySelector('.store-card')
          if (storeCardElement) {
            // تغییر cursor به pointer
            ;(storeCardElement as HTMLElement).style.cursor = 'pointer'
          }
        }, 100)
      }
      
      // اضافه کردن اطلاعات تعداد آگهی‌ها اگر بیشتر از یکی باشد
      if (sortedProducts.length > 1) {
        // استفاده از setTimeout برای اطمینان از render شدن AdCard
        setTimeout(() => {
          const userInfo = document.createElement('div')
          userInfo.className = 'ad-card-user-info'
          userInfo.style.marginTop = '8px'
          userInfo.style.paddingTop = '8px'
          userInfo.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)'
          userInfo.style.display = 'flex'
          userInfo.style.alignItems = 'center'
          userInfo.style.gap = '6px'
          userInfo.style.fontSize = '11px'
          userInfo.style.color = 'rgba(255, 255, 255, 0.6)'
          userInfo.style.direction = 'rtl'
          userInfo.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.6;">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>${sortedProducts.length} آگهی از این کاربر</span>
          `
          popupContainer.appendChild(userInfo)
        }, 50)
      }
          
          // تنظیم استایل popup
          marker.on('popupopen', () => {
            // اعمال استایل popup
            setTimeout(() => {
              const popup = marker.getPopup()
              if (popup) {
                const popupElement = popup.getElement()
                if (popupElement) {
                  const wrapper = popupElement.querySelector('.leaflet-popup-content-wrapper') as HTMLElement
                  const tip = popupElement.querySelector('.leaflet-popup-tip') as HTMLElement
                  const content = popupElement.querySelector('.leaflet-popup-content') as HTMLElement
                  
                  if (wrapper) {
                    wrapper.style.setProperty('background', '#0f0f14', 'important')
                    wrapper.style.setProperty('background-color', '#0f0f14', 'important')
                    wrapper.style.setProperty('background-image', 'none', 'important')
                    wrapper.style.setProperty('color', '#ffffff', 'important')
                    wrapper.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.15)', 'important')
                    wrapper.style.setProperty('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.8)', 'important')
                  }
                  
                  if (tip) {
                    tip.style.setProperty('background', '#0f0f14', 'important')
                    tip.style.setProperty('background-color', '#0f0f14', 'important')
                    tip.style.setProperty('background-image', 'none', 'important')
                    tip.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.15)', 'important')
                    tip.style.setProperty('border-top', 'none', 'important')
                  }
                  
                  if (content) {
                    content.style.setProperty('background', 'transparent', 'important')
                    content.style.setProperty('background-color', 'transparent', 'important')
                    content.style.setProperty('color', '#ffffff', 'important')
                    content.style.setProperty('padding', '0', 'important')
                    content.style.setProperty('margin', '0', 'important')
                    content.style.setProperty('width', '350px', 'important')
                    content.style.setProperty('min-width', '350px', 'important')
                    content.style.setProperty('max-width', '350px', 'important')
                    content.style.setProperty('box-sizing', 'border-box', 'important')
                    content.style.setProperty('overflow', 'hidden', 'important')
                  }
                  
                  // حذف padding از wrapper و ثابت کردن عرض
                  if (wrapper) {
                    wrapper.style.setProperty('padding', '0', 'important')
                    wrapper.style.setProperty('margin', '0', 'important')
                    wrapper.style.setProperty('width', '350px', 'important')
                    wrapper.style.setProperty('min-width', '350px', 'important')
                    wrapper.style.setProperty('max-width', '350px', 'important')
                    wrapper.style.setProperty('box-sizing', 'border-box', 'important')
                    wrapper.style.setProperty('overflow', 'hidden', 'important')
                  }
                  
                  // ثابت کردن عرض popup container
                  const popupContainer = popupElement.querySelector('.ad-card-popup-container') as HTMLElement
                  if (popupContainer) {
                    popupContainer.style.setProperty('width', '350px', 'important')
                    popupContainer.style.setProperty('min-width', '350px', 'important')
                    popupContainer.style.setProperty('max-width', '350px', 'important')
                    popupContainer.style.setProperty('box-sizing', 'border-box', 'important')
                    popupContainer.style.setProperty('overflow', 'hidden', 'important')
                  }
                  
                  // ثابت کردن عرض کارت
                  const adCard = popupElement.querySelector('.ad-card') as HTMLElement
                  if (adCard) {
                    adCard.style.setProperty('width', '350px', 'important')
                    adCard.style.setProperty('min-width', '350px', 'important')
                    adCard.style.setProperty('max-width', '350px', 'important')
                    adCard.style.setProperty('box-sizing', 'border-box', 'important')
                    adCard.style.setProperty('overflow', 'hidden', 'important')
                  }
                }
              }
            }, 10)
          })
        
        // متغیر برای تشخیص اینکه popup با کلیک باز شده یا hover
        let popupOpenedByClick = false
        
        // باز کردن popup با hover (فقط در دسکتاپ)
        marker.on('mouseover', () => {
          // فقط اگر popup با کلیک باز نشده باشد، با hover باز کن
          if (!popupOpenedByClick) {
            marker.openPopup()
          }
        })
        
        // بستن popup با mouseout (فقط در دسکتاپ و فقط اگر با hover باز شده باشد)
        marker.on('mouseout', () => {
          // فقط اگر popup با کلیک باز نشده باشد، با mouseout ببند
          if (!popupOpenedByClick) {
            marker.closePopup()
          }
        })
        
        // باز کردن popup با کلیک (برای موبایل و دسکتاپ)
        marker.on('click', (e: any) => {
          // جلوگیری از propagation به نقشه
          if (e.originalEvent) {
            e.originalEvent.stopPropagation()
          }
          
          // علامت‌گذاری که popup با کلیک باز شده
          popupOpenedByClick = true
          
          // باز کردن popup
          marker.openPopup()
          
          // بعد از بسته شدن popup، flag را reset کن
          marker.once('popupclose', () => {
            popupOpenedByClick = false
          })
        })
        
        productMarkersRef.current.push(marker)
    })
  }, [products])

    function initializeMap() {
    if (!mapRef.current || !window.L || mapInstanceRef.current) {
      console.log('Map initialization skipped:', {
        hasRef: !!mapRef.current,
        hasL: !!window.L,
        hasInstance: !!mapInstanceRef.current
      })
      return
    }

    console.log('Initializing map...', {
      width: mapRef.current.clientWidth,
      height: mapRef.current.clientHeight
    })

    // بررسی ابعاد کانتینر
    if (mapRef.current.clientWidth === 0 || mapRef.current.clientHeight === 0) {
      console.warn('Map container has no dimensions, retrying...')
      setTimeout(() => initializeMap(), 500)
      return
    }

    try {
      // تابع برای تنظیم ویژگی‌های نقشه
      const setupMapFeatures = (map: any) => {
      console.log('Map created successfully')

      // اطمینان از اینکه نقشه بعد از بارگذاری tiles به‌روزرسانی شود
      map.whenReady(() => {
        console.log('Map is ready')
        map.invalidateSize()
        
        // پنهان کردن هر متن عددی اضافی روی نقشه
        const hideTileNumbers = () => {
          const tilePane = mapRef.current?.querySelector('.leaflet-tile-pane')
          if (tilePane) {
            // پیدا کردن و پنهان کردن تمام text nodes و div های اضافی
            const allElements = tilePane.querySelectorAll('*')
            allElements.forEach((el: any) => {
              // اگر عنصر فقط عدد است یا شامل عدد است و داخل tile container است
              const text = el.textContent || el.innerText
              if (text && /^\d{2,3}$/.test(text.trim()) && el.tagName !== 'IMG') {
                // پنهان کردن اگر فقط عدد دو یا سه رقمی باشد
                el.style.display = 'none'
                el.style.visibility = 'hidden'
                el.style.opacity = '0'
                el.style.position = 'absolute'
                el.style.left = '-9999px'
              }
            })
            
            // همچنین بررسی text nodes
            const walker = document.createTreeWalker(tilePane, NodeFilter.SHOW_TEXT, null)
            let node
            while (node = walker.nextNode()) {
              if (node.textContent && /^\d{2,3}$/.test(node.textContent.trim())) {
                const parent = node.parentElement
                if (parent && parent.tagName !== 'IMG') {
                  parent.style.display = 'none'
                  parent.style.visibility = 'hidden'
                }
              }
            }
          }
        }
        
        // استفاده از MutationObserver برای پنهان کردن اعداد جدید
        const tilePane = mapRef.current?.querySelector('.leaflet-tile-pane')
        if (tilePane) {
          const observer = new MutationObserver(() => {
            hideTileNumbers()
          })
          
          observer.observe(tilePane, {
            childList: true,
            subtree: true,
            characterData: true
          })
          
          // ذخیره observer برای cleanup
          observerRef.current = observer
        }
        
        // بررسی tiles
        map.on('tileload', () => {
          console.log('Tile loaded successfully')
          // بعد از بارگذاری tile، اعداد را پنهان کن
          setTimeout(hideTileNumbers, 100)
        })
        
        map.on('tileerror', (error: any) => {
          console.error('Tile error:', error)
        })
        
        // یک بار دیگر بعد از آماده شدن کامل نقشه
        setTimeout(hideTileNumbers, 500)
      })

      // افزودن لایه نقشه دارک مود - استفاده از چند منبع
      const tileSources = [
        {
          url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
          subdomains: 'abcd'
        },
        {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd'
        },
        {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abc'
        }
      ]

      // استفاده از اولین منبع (Stadia Maps)
      const tileLayer = window.L.tileLayer(tileSources[0].url, {
        attribution: tileSources[0].attribution,
        subdomains: tileSources[0].subdomains,
        maxZoom: 19,
        minZoom: 1,
        tileSize: 256,
        zoomOffset: 0,
      })
      
      tileLayer.addTo(map)
      
      // در صورت خطا، از منبع جایگزین استفاده کن
      tileLayer.on('tileerror', () => {
        console.warn('Primary tile source failed, trying alternative...')
        map.removeLayer(tileLayer)
        const fallbackLayer = window.L.tileLayer(tileSources[1].url, {
          attribution: tileSources[1].attribution,
          subdomains: tileSources[1].subdomains,
          maxZoom: 19,
        })
        fallbackLayer.addTo(map)
      })

      // موقعیت کاربر را به صورت خودکار دریافت نمی‌کنیم - فقط زمانی که کاربر موقعیت را مشخص کرده باشد

      // اضافه کردن event listener برای کلیک روی نقشه
      const handleMapClick = async (e: any) => {
        // بررسی اینکه آیا کلیک روی marker بوده یا نه
        // اگر کلیک روی marker بود، نباید popup منو را باز کنیم
        const originalEvent = e.originalEvent
        if (originalEvent) {
          const target = originalEvent.target as HTMLElement
          // بررسی اینکه آیا کلیک روی marker یا popup بوده یا نه
          if (target && (
            target.closest('.leaflet-marker-icon') || 
            target.closest('.leaflet-popup') ||
            target.closest('.custom-pin-marker') ||
            target.closest('.product-marker')
          )) {
            // اگر کلیک روی marker بود، return کنیم
            return
          }
        }
        
        const { lat, lng } = e.latlng
        
        // اگر در حال تغییر موقعیت است، فقط اجازه انتخاب موقعیت را بده
        if (isChangingLocation) {
          // فقط منوی موقعیت را نمایش بده
          const locationMenuContent = `
            <div style="
              text-align: center; 
              padding: 20px;
              background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%);
              border-radius: 12px;
              min-width: 250px;
            ">
              <div style="
                font-size: 40px;
                margin-bottom: 12px;
                animation: pulse 2s ease-in-out infinite;
              ">📍</div>
              <div style="
                color: #ffffff; 
                font-size: 16px; 
                font-weight: 700; 
                margin-bottom: 8px;
                background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              ">
                انتخاب موقعیت جدید
              </div>
              <div style="
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                margin-bottom: 20px;
              ">
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
              </div>
              <button 
                class="marker-menu-item"
                data-type="location"
                style="
                  background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%);
                  border: none;
                  color: white;
                  padding: 14px 28px;
                  border-radius: 10px;
                  cursor: pointer;
                  font-size: 15px;
                  font-weight: 600;
                  width: 100%;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                "
                onmouseover="this.style.background='linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.5)'"
                onmouseout="this.style.background='linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(59, 130, 246, 0.4)'"
              >
                <span>✓</span>
                <span>انتخاب این موقعیت</span>
              </button>
            </div>
          `
          
          const popup = window.L.popup()
            .setLatLng([lat, lng])
            .setContent(locationMenuContent)
            .openOn(map)
          
          clickPopupRef.current = popup
          
          // اضافه کردن event listener برای دکمه
          setTimeout(() => {
            const btn = document.querySelector('.marker-menu-item[data-type="location"]')
            if (btn) {
              console.log('دکمه انتخاب موقعیت پیدا شد:', btn)
              
              // حذف event listener قبلی
              const newBtn = btn.cloneNode(true) as HTMLElement
              btn.parentNode?.replaceChild(newBtn, btn)
              
              // اضافه کردن event listener جدید
              newBtn.addEventListener('click', async (e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('دکمه انتخاب موقعیت کلیک شد:', { lat, lng })
                
                if (onLocationSet) {
                  console.log('فراخوانی onLocationSet با:', { lat, lng })
                  try {
                    await onLocationSet({ lat, lng })
                    console.log('onLocationSet با موفقیت اجرا شد')
                  } catch (error) {
                    console.error('خطا در اجرای onLocationSet:', error)
                  }
                } else {
                  console.error('onLocationSet تعریف نشده است!')
                }
                
                map.closePopup()
              }, { once: true })
      } else {
              console.error('دکمه انتخاب موقعیت پیدا نشد!')
            }
          }, 300)
          
          return
        }
        
        // بستن popup قبلی اگر وجود داشته باشد
        if (clickPopupRef.current) {
          map.closePopup(clickPopupRef.current)
        }
        
        // دریافت مقدار به‌روز userHasLocation - استفاده مستقیم از prop که همیشه به‌روز است
        
        // محتوای منوی marker ها
        // تابع برای گرفتن gradient colors
        const getGradientColors = (baseColor: string) => {
          const gradients: Record<string, string[]> = {
            '#ff6b35': ['#ff6b35', '#ff8c55', '#ff6b35'],
            '#3b82f6': ['#3b82f6', '#60a5fa', '#3b82f6'],
            '#8b5cf6': ['#8b5cf6', '#a78bfa', '#8b5cf6'],
            '#10b981': ['#10b981', '#34d399', '#10b981']
          }
          return gradients[baseColor] || ['#3b82f6', '#60a5fa', '#3b82f6']
        }

        // تابع برای ساخت marker کوچک برای منو
        const createMenuMarker = (type: string, title: string, color: string, iconSvg: string, disabled: boolean = false) => {
          const gradient = getGradientColors(color)
          const isDisabled = disabled
          const opacity = isDisabled ? 0.4 : 0.9
          const cursor = isDisabled ? 'not-allowed' : 'pointer'
          const filter = isDisabled ? 'grayscale(100%)' : 'none'
          
          return `
            <button
              class="marker-menu-item ${isDisabled ? 'disabled' : ''}"
              data-type="${type}"
              ${isDisabled ? 'disabled' : ''}
              style="background: transparent; border: none; cursor: ${cursor}; padding: 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all 0.2s; opacity: ${opacity}; filter: ${filter}; pointer-events: ${isDisabled ? 'none' : 'auto'};"
              onmouseover="${isDisabled ? '' : "this.style.opacity='1'; this.style.transform='scale(1.15)'"}"
              onmouseout="${isDisabled ? '' : "this.style.opacity='0.9'; this.style.transform='scale(1)'"}"
            >
              <svg width="32" height="40" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));">
                <defs>
                  <linearGradient id="menuGradient-${type}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${gradient[0]};stop-opacity:1" />
                    <stop offset="50%" style="stop-color:${gradient[1]};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${gradient[2]};stop-opacity:1" />
                  </linearGradient>
                  <filter id="menuShadow-${type}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
                    <feOffset dx="0" dy="1.5" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.4"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="18" cy="18" r="11" fill="url(#menuGradient-${type})" filter="url(#menuShadow-${type})"/>
                <circle cx="18" cy="18" r="10.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.4"/>
                <circle cx="18" cy="18" r="7" fill="white" opacity="0.95"/>
                <circle cx="18" cy="18" r="6" fill="${color}"/>
                <circle cx="18" cy="18" r="5.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.4"/>
                <g transform="translate(18, 18) scale(0.6)" fill="white" stroke="white" stroke-width="2">
                  ${iconSvg}
                </g>
                <circle cx="18" cy="35" r="2.5" fill="url(#menuGradient-${type})" filter="url(#menuShadow-${type})"/>
                <circle cx="18" cy="35" r="2" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.3"/>
                <rect x="17.5" y="28" width="1" height="5" fill="url(#menuGradient-${type})" opacity="0.6" rx="0.5"/>
              </svg>
              <span style="font-size: 10px; color: ${isDisabled ? 'rgba(255, 255, 255, 0.5)' : '#ffffff'}; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.5); white-space: nowrap;">${title}${isDisabled ? ' (غیرفعال)' : ''}</span>
            </button>
          `
        }

        const markerConfigs = {
          'create-ad': { color: '#ff6b35', iconSvg: `<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`, title: 'ایجاد آگهی' },
          'location': { color: '#3b82f6', iconSvg: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="12" cy="10" r="3.5" fill="currentColor"/>`, title: 'موقعیت' },
          'event': { color: '#8b5cf6', iconSvg: `<rect x="3" y="5" width="18" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="11" x2="21" y2="11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/><circle cx="16" cy="15" r="1.5" fill="currentColor"/>`, title: 'رویداد' },
          'service': { color: '#10b981', iconSvg: `<path d="M12 2l3.09 6.26L22 9.27l-4 3.89L18.18 21 12 17.77 5.82 21 7 13.16l-4-3.89 6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`, title: 'سرویس' }
        }

        // دکمه "نزدیک شدن به موقعیت من" حذف شد - کاربر نباید به موقعیت واقعی (geolocation) برود
        // فقط موقعیت انتخابی اهمیت دارد

        const markerMenuContent = `
          <div style="padding: 8px; min-width: auto;">
            <div style="display: flex; flex-direction: row; gap: 12px; align-items: center; justify-content: center;">
              ${createMenuMarker('location', markerConfigs['location'].title, markerConfigs['location'].color, markerConfigs['location'].iconSvg, false)}
              ${createMenuMarker('event', markerConfigs['event'].title, markerConfigs['event'].color, markerConfigs['event'].iconSvg, false)}
              ${createMenuMarker('service', markerConfigs['service'].title, markerConfigs['service'].color, markerConfigs['service'].iconSvg, false)}
            </div>
          </div>
        `
        
        // ایجاد popup با محتوای منو
        const popup = window.L.popup({
          closeButton: true,
          className: 'marker-menu-popup',
          maxWidth: 400,
          autoPan: true,
        })
          .setLatLng([lat, lng])
          .setContent(markerMenuContent)
          .openOn(map)
        
        clickPopupRef.current = popup
        
        // اعمال استایل‌های شیشه‌ای مستقیم به popup
        setTimeout(() => {
          const popupElement = popup.getElement()
          if (popupElement) {
            const contentWrapper = popupElement.querySelector('.leaflet-popup-content-wrapper')
            const tip = popupElement.querySelector('.leaflet-popup-tip')
            
            if (contentWrapper) {
              const wrapperEl = contentWrapper as HTMLElement
              wrapperEl.style.background = 'transparent'
              wrapperEl.style.backgroundColor = 'transparent'
              wrapperEl.style.backdropFilter = 'blur(25px) saturate(150%)'
              wrapperEl.style.setProperty('-webkit-backdrop-filter', 'blur(25px) saturate(150%)')
              wrapperEl.style.border = '1px solid rgba(255, 255, 255, 0.3)'
              wrapperEl.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)'
            }
            
            if (tip) {
              const tipEl = tip as HTMLElement
              tipEl.style.background = 'transparent'
              tipEl.style.backgroundColor = 'transparent'
              tipEl.style.backdropFilter = 'blur(25px) saturate(150%)'
              tipEl.style.setProperty('-webkit-backdrop-filter', 'blur(25px) saturate(150%)')
              tipEl.style.border = '1px solid rgba(255, 255, 255, 0.3)'
              tipEl.style.borderTop = 'none'
            }
          }
        }, 10)
        
        // اضافه کردن event listener به دکمه‌ها بعد از اینکه popup رندر شد
        setTimeout(() => {
          const menuItems = document.querySelectorAll('.marker-menu-item')
          menuItems.forEach((item) => {
            // بررسی اینکه آیا marker غیرفعال است
            const isDisabled = item.classList.contains('disabled') || item.hasAttribute('disabled')
            
            if (!isDisabled) {
            item.addEventListener('click', (e: any) => {
              const markerType = e.currentTarget.getAttribute('data-type')
              console.log('Selected marker type:', markerType)
              
              // بستن popup
              map.closePopup(popup)
              
              // ایجاد marker زیبا مشابه پونز در موقعیت کلیک
              createPinMarker(map, lat, lng, markerType)
            })
            }
            
            // اضافه کردن hover effect فقط برای marker های فعال
            if (!isDisabled) {
            item.addEventListener('mouseenter', (e: any) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)'
            })
            
            item.addEventListener('mouseleave', (e: any) => {
              e.currentTarget.style.transform = 'scale(1)'
              const bg = window.getComputedStyle(e.currentTarget).background
              if (bg.includes('ff6b35')) {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3)'
              } else if (bg.includes('3b82f6')) {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
              } else if (bg.includes('8b5cf6')) {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
              } else {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
              }
            })
            }
          })
        }, 100)
      }
      
      // اتصال event listener به نقشه برای کلیک (خارج از setTimeout)
      map.on('click', handleMapClick)
      
      // تابع برای ایجاد marker زیبا مشابه پونز
      const createPinMarker = (map: any, lat: number, lng: number, type: string) => {
        const markerConfigs: Record<string, { color: string; iconSvg: string; title: string }> = {
          'create-ad': {
        color: '#ff6b35',
            iconSvg: `
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            `,
            title: 'ایجاد آگهی'
          },
          'location': {
            color: '#3b82f6',
            iconSvg: `
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <circle cx="12" cy="10" r="3.5" fill="currentColor"/>
            `,
            title: 'موقعیت'
          },
          'event': {
            color: '#8b5cf6',
            iconSvg: `
              <rect x="3" y="5" width="18" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="3" y1="11" x2="21" y2="11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
              <circle cx="16" cy="15" r="1.5" fill="currentColor"/>
            `,
            title: 'رویداد'
          },
          'service': {
            color: '#10b981',
            iconSvg: `
              <path d="M12 2l3.09 6.26L22 9.27l-4 3.89L18.18 21 12 17.77 5.82 21 7 13.16l-4-3.89 6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            `,
            title: 'سرویس'
          }
        }
        
        const config = markerConfigs[type] || markerConfigs['location']
        
        // ایجاد آیکون پونز سفارشی زیبا با طراحی بهتر
        const getGradientColors = (baseColor: string) => {
          const gradients: Record<string, string[]> = {
            '#ff6b35': ['#ff6b35', '#ff8c55', '#ff6b35'],
            '#3b82f6': ['#3b82f6', '#60a5fa', '#3b82f6'],
            '#8b5cf6': ['#8b5cf6', '#a78bfa', '#8b5cf6'],
            '#10b981': ['#10b981', '#34d399', '#10b981']
          }
          return gradients[baseColor] || ['#3b82f6', '#60a5fa', '#3b82f6']
        }
        
        const gradient = getGradientColors(config.color)
        
        const pinIcon = window.L.divIcon({
          className: 'custom-pin-marker',
          html: `
            <div style="position: relative; width: 36px; height: 46px; display: flex; align-items: center; justify-content: center;">
              <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="pinGradient-${type}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${gradient[0]};stop-opacity:1" />
                    <stop offset="50%" style="stop-color:${gradient[1]};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${gradient[2]};stop-opacity:1" />
                  </linearGradient>
                  <filter id="pinShadow-${type}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                    <feOffset dx="0" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.5"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <!-- سایه دایره بزرگ -->
                <circle cx="18" cy="18" r="12" fill="black" opacity="0.15" transform="translate(0.5, 0.5)"/>
                <!-- دایره بزرگ در بالا (مثل علامت تعجب) -->
                <circle cx="18" cy="18" r="12" fill="url(#pinGradient-${type})" filter="url(#pinShadow-${type})"/>
                <!-- حاشیه داخلی دایره -->
                <circle cx="18" cy="18" r="11.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
                <!-- دایره مرکزی سفید -->
                <circle cx="18" cy="18" r="8" fill="white" opacity="0.95"/>
                <circle cx="18" cy="18" r="7" fill="${config.color}"/>
                <!-- حلقه داخلی برای عمق -->
                <circle cx="18" cy="18" r="6.5" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/>
                <!-- آیکون SVG در مرکز دایره -->
                <g transform="translate(18, 18) scale(0.7)" fill="white" stroke="white" stroke-width="2">
                  ${config.iconSvg}
                </g>
                <!-- نقطه کوچک در پایین (مثل سوزن) -->
                <circle cx="18" cy="36" r="3" fill="url(#pinGradient-${type})" filter="url(#pinShadow-${type})"/>
                <!-- سایه نقطه -->
                <circle cx="18" cy="36" r="3" fill="black" opacity="0.1" transform="translate(0.3, 0.3)"/>
                <!-- حاشیه نقطه -->
                <circle cx="18" cy="36" r="2.5" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.4"/>
                <!-- خط اتصال بین دایره و نقطه (اختیاری) -->
                <rect x="17.5" y="29" width="1" height="6" fill="url(#pinGradient-${type})" opacity="0.6" rx="0.5"/>
              </svg>
            </div>
          `,
          iconSize: [36, 46],
          iconAnchor: [18, 46],
          popupAnchor: [0, -46]
        })
        
        const marker = window.L.marker([lat, lng], { icon: pinIcon })
          .addTo(map)
          .bindPopup(`<div style="color: #ffffff;"><b>${config.title}</b><br/>${lat.toFixed(6)}, ${lng.toFixed(6)}</div>`)
        
        // اگر marker از نوع location باشد:
        // 1. marker موقعیت کاربر را به این نقطه منتقل می‌کنیم (با همان ظاهر marker پونز)
        // 2. مرکز دایره شعاع را به این نقطه منتقل می‌کنیم
        // 3. نقشه را به این نقطه می‌بریم
        if (type === 'location') {
          // حذف مارکر قبلی اگر وجود داشته باشد
          if (locationMarkerRef.current) {
            map.removeLayer(locationMarkerRef.current)
          }
          
          // ذخیره مارکر در ref
          locationMarkerRef.current = marker
          marker.setPopupContent(`<div style="color: #ffffff;"><b>موقعیت شما</b><br/>${lat.toFixed(6)}, ${lng.toFixed(6)}</div>`)
          marker.on('click', () => {
            map.setView([lat, lng], 15, {
              animate: true,
              duration: 0.5
            })
          })
          
          // به‌روزرسانی مرکز دایره شعاع - فقط اگر لوکیشن قبلاً ثبت شده باشد
          if (userHasLocation && whiteHillsCircleRef.current) {
            const currentRadius = whiteHillsCircleRef.current.getRadius()
            map.removeLayer(whiteHillsCircleRef.current)
            
            const newCircle = window.L.circle([lat, lng], {
              color: '#8b5cf6',
              fillColor: '#8b5cf6',
              fillOpacity: 0.2,
              radius: currentRadius,
              weight: 2,
              interactive: false,
      }).addTo(map)

            newCircle.bindPopup(`<div style="color: #ffffff;"><b>محدوده جستجو</b><br/>محدوده شعاع: ${currentRadius >= 1000 ? `${(currentRadius / 1000).toFixed(currentRadius % 1000 === 0 ? 0 : 1)} کیلومتر` : `${currentRadius} متر`}</div>`)
            whiteHillsCircleRef.current = newCircle
            
            // به‌روزرسانی تابع update
            const updateCircleRadius = (newRadius: number) => {
              if (whiteHillsCircleRef.current) {
                whiteHillsCircleRef.current.setRadius(newRadius)
                whiteHillsCircleRef.current.setPopupContent(`<div style="color: #ffffff;"><b>محدوده جستجو</b><br/>محدوده شعاع: ${newRadius >= 1000 ? `${(newRadius / 1000).toFixed(newRadius % 1000 === 0 ? 0 : 1)} کیلومتر` : `${newRadius} متر`}</div>`)
              }
            }
            ;(map as any).updateWhiteHillsRadius = updateCircleRadius
          }
          
          // اطلاع‌رسانی به کامپوننت والد (موقعیت از prop به‌روزرسانی می‌شود)
          if (onLocationSet) {
            onLocationSet({ lat, lng })
          }
          
          // حرکت نقشه به نقطه جدید
          map.setView([lat, lng], 15, {
            animate: true,
            duration: 0.5
          })
        } else {
          // marker "create-ad" حذف شد - دیگر marker نارنجی برای لوکیشن کاربر ایجاد نمی‌شود
          // برای سایر marker ها، فقط با کلیک نقشه به آن نقطه می‌رود
          marker.on('click', () => {
            map.setView([lat, lng], 15, {
              animate: true,
              duration: 0.5
            })
          })
        }
        
        // انیمیشن ورود marker
        const markerElement = marker.getElement()
        if (markerElement) {
          markerElement.style.animation = 'pinDrop 0.5s ease-out'
        }
      }

      console.log('Map initialization complete')
      }
      
      // ایجاد نقشه - بدون انیمیشن فرود
      let map: any
      
      // اگر کاربر موقعیت انتخابی ثبت کرده باشد
      if (userHasLocation && propUserLocation) {
        console.log('📍 استفاده از موقعیت انتخابی:', propUserLocation)
        
        map = window.L.map(mapRef.current, {
          center: [propUserLocation.lat, propUserLocation.lng],
          zoom: 15,
          zoomControl: false,
          attributionControl: true,
        })
        
        setupMapFeatures(map)
        mapInstanceRef.current = map
        return
      }
      
      // اگر موقعیت انتخابی وجود ندارد، از geolocation استفاده کن
      console.log('🌍 موقعیت انتخابی وجود ندارد، استفاده از geolocation...')
      
      // View کلی از ایران به عنوان fallback
      const generalViewCenter: [number, number] = [32.4279, 53.6880]
      const generalViewZoom = 6
      
      map = window.L.map(mapRef.current, {
        center: generalViewCenter,
        zoom: generalViewZoom,
        zoomControl: false,
        attributionControl: true,
      })
      
      setupMapFeatures(map)
      mapInstanceRef.current = map
      
      // تلاش برای دریافت موقعیت واقعی از geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            
            console.log('✅ موقعیت واقعی دریافت شد:', { lat, lng })
            map.setView([lat, lng], 12, { animate: false })
          },
          (error) => {
            console.warn('❌ خطا در دریافت موقعیت واقعی:', error)
            // نقشه روی view کلی ایران باقی می‌ماند
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        )
      } else {
        console.warn('⚠️ Geolocation در این مرورگر پشتیبانی نمی‌شود')
      }
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  return (
    <>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Leaflet script loaded')
          setIsLeafletLoaded(true)
        }}
        onError={(e) => {
          console.error('Failed to load Leaflet script:', e)
        }}
      />
      <div ref={mapRef} className="city-map" style={{ width: '100%', height: '100%' }}></div>
    </>
  )
}

