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

interface AdPreviewEditProps {
  productId?: number
  product?: Product
  onClose: () => void
  onUpdate?: () => void
}

export default function AdPreviewEdit({ productId, product: initialProduct, onClose, onUpdate }: AdPreviewEditProps) {
  const [product, setProduct] = useState<Product | null>(initialProduct || null)
  const [isLoading, setIsLoading] = useState(!initialProduct)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    title?: string
    price?: string
    description?: string
    status?: string
  }>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // لیست نهایی تصاویر که در حال ویرایش هستند (قبل از ذخیره)
  const [editedImages, setEditedImages] = useState<Array<{ type: 'existing' | 'new'; path: string; file?: File; preview?: string }>>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [showImageMenu, setShowImageMenu] = useState(false)
  const [replacingImageIndex, setReplacingImageIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [carouselProgress, setCarouselProgress] = useState(0)
  const addImageInputRef = useRef<HTMLInputElement>(null)
  const addImageInputEmptyRef = useRef<HTMLInputElement>(null)
  const replaceImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // اگر product اولیه پاس داده شده، از آن استفاده کن
    if (initialProduct) {
      setProduct(initialProduct)
        // مقداردهی اولیه editedImages با تصاویر موجود
        const initialImages = (initialProduct.images || []).map((path: string) => ({
          type: 'existing' as const,
          path
        }))
      setEditedImages(initialImages)
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
      setSaveMessage({ type: '', text: '' })
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
        // مقداردهی اولیه editedImages با تصاویر موجود
        const initialImages = (productData.images || []).map((path: string) => ({
          type: 'existing' as const,
          path
        }))
        setEditedImages(initialImages)
        setCurrentImageIndex(0)
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'خطا در بارگذاری آگهی' })
      }
    } catch (error: any) {
      console.error('Error fetching product:', error)
      setSaveMessage({ type: 'error', text: error.message || 'خطا در بارگذاری آگهی' })
    } finally {
      setIsLoading(false)
    }
  }
  
  // برای به‌روزرسانی product بعد از تغییرات
  const refreshProduct = async () => {
    if (!productId || productId <= 0) {
      return
    }
    
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const productData = {
            ...data.data,
            images: Array.isArray(data.data.images) ? data.data.images : (data.data.images ? JSON.parse(data.data.images) : [])
          }
          setProduct(productData)
          // مقداردهی اولیه editedImages با تصاویر موجود
          const initialImages = (productData.images || []).map((path: string) => ({
            type: 'existing' as const,
            path
          }))
          setEditedImages(initialImages)
          setCurrentImageIndex(0)
        }
      }
    } catch (error) {
      console.error('Error refreshing product:', error)
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

  const handleFieldClick = (field: string) => {
    setEditingField(field)
    if (product) {
      setEditValues({
        ...editValues,
        [field]: field === 'price' ? product.price.toString() : (product as any)[field]
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValues({})
  }

  const handleSaveField = async (field: string) => {
    if (!product) return

    const value = editValues[field as keyof typeof editValues]
    if (value === undefined || value === '') {
      setSaveMessage({ type: 'error', text: 'مقدار نمی‌تواند خالی باشد' })
      return
    }

    setIsSaving(true)
    setSaveMessage({ type: '', text: '' })

    try {
      const idToUse = productId || product?.id
      if (!idToUse) {
        setSaveMessage({ type: 'error', text: 'شناسه محصول یافت نشد' })
        setIsSaving(false)
        return
      }

      const formData = new FormData()
      
      if (field === 'price') {
        const priceValue = parseFloat(value as string)
        if (isNaN(priceValue) || priceValue <= 0) {
          setSaveMessage({ type: 'error', text: 'قیمت باید یک عدد معتبر باشد' })
          setIsSaving(false)
          return
        }
        formData.append('price', priceValue.toString())
      } else {
        formData.append(field, value as string)
      }

      const response = await fetch(`/api/products/${idToUse}`, {
        method: 'PUT',
        body: formData
      })

      const data = await response.json()

      if (data.success && data.data) {
        // اطمینان از اینکه images یک آرایه است
        const updatedProduct = {
          ...data.data,
          images: Array.isArray(data.data.images) ? data.data.images : (data.data.images ? JSON.parse(data.data.images) : [])
        }
        setProduct(updatedProduct)
        setEditingField(null)
        setEditValues({})
        setCurrentImageIndex(0)
        setSaveMessage({ type: 'success', text: 'با موفقیت به‌روزرسانی شد' })
        
        // به‌روزرسانی productId برای future updates
        if (data.data.id) {
          // productId را به‌روزرسانی کن اگر نیاز باشد
        }
        
        if (onUpdate) {
          onUpdate()
        }
        
        setTimeout(() => {
          setSaveMessage({ type: '', text: '' })
        }, 2000)
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'خطا در به‌روزرسانی' })
      }
    } catch (error) {
      console.error('Error updating product:', error)
      setSaveMessage({ type: 'error', text: 'خطا در به‌روزرسانی' })
    } finally {
      setIsSaving(false)
    }
  }

  // حذف تصویر از لیست ویرایش شده
  const handleDeleteImage = (index: number) => {
    setEditedImages(prev => prev.filter((_, i) => i !== index))
    // تنظیم index به تصویر معتبر بعدی
    if (editedImages.length > 1) {
      const newIndex = Math.min(index, editedImages.length - 2)
      setCurrentImageIndex(newIndex >= 0 ? newIndex : 0)
    } else {
      setCurrentImageIndex(0)
    }
  }

  // اضافه کردن تصاویر جدید به لیست ویرایش شده
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // بررسی محدودیت 4 تصویر
    const maxAllowed = 4
    const remainingSlots = maxAllowed - editedImages.length
    
    if (remainingSlots <= 0) {
      setSaveMessage({ type: 'error', text: 'حداکثر 4 تصویر مجاز است' })
      e.target.value = ''
      return
    }

    const newFiles = Array.from(files).slice(0, remainingSlots)
    const validFiles: File[] = []
    const invalidFiles: File[] = []
    
    // بررسی اندازه فایل‌ها
    newFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        invalidFiles.push(file)
      } else {
        validFiles.push(file)
      }
    })
    
    if (invalidFiles.length > 0) {
      setSaveMessage({ type: 'error', text: 'هر تصویر باید کمتر از 5 مگابایت باشد' })
    }
    
    if (validFiles.length === 0) {
      e.target.value = ''
      return
    }

    const newImagesToAdd: Array<{ type: 'new'; path: string; file: File; preview: string }> = []
    let loadedCount = 0
    const totalFiles = validFiles.length

    validFiles.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const preview = event.target.result as string
          newImagesToAdd.push({
            type: 'new',
            path: `temp_${Date.now()}_${index}`,
            file,
            preview
          })
          
          loadedCount++
          // وقتی همه preview ها آماده شدند
          if (loadedCount === totalFiles) {
            setEditedImages(prev => {
              const updated = [...prev, ...newImagesToAdd]
              // رفتن به آخرین تصویر اضافه شده
              setCurrentImageIndex(updated.length - 1)
              return updated
            })
          }
        }
      }
      reader.onerror = () => {
        loadedCount++
        if (loadedCount === totalFiles && newImagesToAdd.length > 0) {
          // اگر همه فایل‌ها خوانده شدند (حتی با خطا)، state را به‌روزرسانی کن
          setEditedImages(prev => {
            const updated = [...prev, ...newImagesToAdd]
            setCurrentImageIndex(updated.length - 1)
            return updated
          })
        }
      }
      reader.readAsDataURL(file)
    })

    setSaveMessage({ type: '', text: '' })
    e.target.value = ''
  }

  // جایگزین کردن تصویر در لیست ویرایش شده
  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>, imageIndex: number) => {
    const files = e.target.files
    if (!files || !files[0]) return

    const file = files[0]
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'هر تصویر باید کمتر از 5 مگابایت باشد' })
      e.target.value = ''
      return
    }

    if (imageIndex >= editedImages.length || imageIndex < 0) {
      setSaveMessage({ type: 'error', text: 'تصویر یافت نشد' })
      e.target.value = ''
      return
    }

    // ایجاد preview برای تصویر جدید
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const preview = event.target.result as string
        // جایگزین کردن تصویر در همان index
        setEditedImages(prev => {
          const newImages = [...prev]
          newImages[imageIndex] = {
            type: 'new',
            path: `temp_${Date.now()}`,
            file,
            preview
          }
          return newImages
        })
        // نمایش تصویر جایگزین شده
        setCurrentImageIndex(imageIndex)
        setReplacingImageIndex(null)
      }
    }
    reader.onerror = () => {
      setSaveMessage({ type: 'error', text: 'خطا در خواندن فایل' })
      e.target.value = ''
    }
    reader.readAsDataURL(file)
    
    e.target.value = ''
  }

  // ذخیره همه تغییرات تصاویر (حذف، اضافه، جایگزین)
  const handleSaveAllImages = async () => {
    if (!product) return

    setIsUploadingImages(true)
    setSaveMessage({ type: '', text: '' })

    try {
      const idToUse = productId || product.id
      if (!idToUse) {
        setSaveMessage({ type: 'error', text: 'شناسه محصول یافت نشد' })
        setIsUploadingImages(false)
        return
      }

      const formDataToSend = new FormData()

      // پیدا کردن تصاویر حذف شده و جدید
      const originalImages = product.images || []
      const imagesToDelete: string[] = []
      const newImagesToUpload: Array<{ index: number; file: File }> = []
      
      // بررسی تصاویر موجود: کدام‌ها حذف شده‌اند و کدام‌ها جایگزین شده‌اند
      originalImages.forEach((originalPath, originalIndex) => {
        const editedImg = editedImages[originalIndex]
        
        if (!editedImg) {
          // تصویر در این index حذف شده است
          imagesToDelete.push(originalPath)
        } else if (editedImg.type === 'new') {
          // تصویر در این index جایگزین شده است - تصویر قدیمی باید حذف شود
          imagesToDelete.push(originalPath)
          // تصویر جدید را برای آپلود اضافه کن
          if (editedImg.file) {
            newImagesToUpload.push({ index: originalIndex, file: editedImg.file })
          }
        } else if (editedImg.type === 'existing' && editedImg.path !== originalPath) {
          // تصویر جابجا شده - باید حذف شود
          imagesToDelete.push(originalPath)
        }
        // اگر type='existing' و path همان originalPath باشد، تصویر حفظ شده است
      })
      
      // بررسی تصاویر جدید که فقط اضافه شده‌اند (در انتها)
      const originalImagesCount = originalImages.length
      editedImages.slice(originalImagesCount).forEach((editedImg) => {
        if (editedImg.type === 'new' && editedImg.file) {
          // این تصاویر فقط اضافه شده‌اند (نه جایگزین)
          newImagesToUpload.push({ index: -1, file: editedImg.file }) // index=-1 یعنی اضافه به انتها
        }
      })
      
      // اضافه کردن تصاویر جدید به FormData (با index مرتب)
      newImagesToUpload.sort((a, b) => {
        // تصاویر جایگزین (index >= 0) اول، سپس تصاویر اضافه شده (index = -1)
        if (a.index >= 0 && b.index >= 0) return a.index - b.index
        if (a.index >= 0) return -1
        if (b.index >= 0) return 1
        return 0
      })
      
      let imageIndex = 0
      newImagesToUpload.forEach(({ file }) => {
        formDataToSend.append(`image_${imageIndex}`, file)
        imageIndex++
      })
      
      // ارسال تصاویر حذف شده
      if (imagesToDelete.length > 0) {
        formDataToSend.append('deleteImages', JSON.stringify(imagesToDelete))
      }

      // اگر هیچ تغییری وجود ندارد، خروج
      if (imagesToDelete.length === 0 && imageIndex === 0) {
        setIsUploadingImages(false)
        return
      }

      const response = await fetch(`/api/products/${idToUse}`, {
        method: 'PUT',
        body: formDataToSend
      })

      const data = await response.json()

      if (data.success && data.data) {
        const updatedProduct = {
          ...data.data,
          images: Array.isArray(data.data.images) ? data.data.images : (data.data.images ? JSON.parse(data.data.images) : [])
        }
        setProduct(updatedProduct)
        
        // به‌روزرسانی editedImages با تصاویر نهایی از سرور
        const finalImagesFromServer = (updatedProduct.images || []).map((path: string) => ({
          type: 'existing' as const,
          path
        }))
        setEditedImages(finalImagesFromServer)
        
        // تنظیم index به تصویر معتبر
        if (finalImagesFromServer.length > 0) {
          setCurrentImageIndex(Math.min(currentImageIndex, finalImagesFromServer.length - 1))
        } else {
          setCurrentImageIndex(0)
        }
        
        setSaveMessage({ type: 'success', text: 'تصاویر با موفقیت به‌روزرسانی شدند' })
        
        if (onUpdate) {
          onUpdate()
        }
        
        setTimeout(() => {
          setSaveMessage({ type: '', text: '' })
        }, 2000)
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'خطا در به‌روزرسانی تصاویر' })
      }
    } catch (error) {
      console.error('Error saving images:', error)
      setSaveMessage({ type: 'error', text: 'خطا در به‌روزرسانی تصاویر' })
    } finally {
      setIsUploadingImages(false)
    }
  }

  if (isLoading) {
    return (
      <div className="ad-preview-container">
        <div className="ad-preview-loading">در حال بارگذاری...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="ad-preview-container">
        <div className="ad-preview-error">خطا در بارگذاری آگهی</div>
      </div>
    )
  }

  const statusColor = getStatusColor(product.status)
  
  // استفاده از editedImages برای نمایش - تصاویر موجود و جدید
  const imagesToDisplay = editedImages.map(img => {
    if (img.type === 'existing') {
      return img.path
    } else {
      return img.preview || ''
    }
  }).filter(path => path)
  
  // اطمینان از اینکه currentImageIndex معتبر است
  const safeImageIndex = imagesToDisplay.length > 0 
    ? Math.min(currentImageIndex, imagesToDisplay.length - 1) 
    : 0

  // بستن منو هنگام کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showImageMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('.ad-preview-main-image')) {
          setShowImageMenu(false)
        }
      }
    }

    if (showImageMenu) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showImageMenu])

  // تایمر خودکار برای کاروسل
  useEffect(() => {
    // اگر فقط یک تصویر داریم یا منو باز است، timer را متوقف کن
    if (imagesToDisplay.length <= 1 || showImageMenu) {
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
          if (imagesToDisplay.length > 1) {
            setCurrentImageIndex((prevIndex) => 
              prevIndex === imagesToDisplay.length - 1 ? 0 : prevIndex + 1
            )
          }
        }, 50) // یک delay کوچک برای نمایش کامل progress
      }
    }, intervalDuration)

    return () => {
      clearInterval(interval)
    }
  }, [currentImageIndex, imagesToDisplay.length, showImageMenu])

  // توابع کاروسل - استفاده از imagesToDisplay که قبلاً تعریف شده
  const goToPreviousImage = () => {
    if (imagesToDisplay.length <= 1) return
    setCarouselProgress(0) // Reset progress هنگام تغییر دستی
    setCurrentImageIndex((prev) => (prev === 0 ? imagesToDisplay.length - 1 : prev - 1))
  }

  const goToNextImage = () => {
    if (imagesToDisplay.length <= 1) return
    setCarouselProgress(0) // Reset progress هنگام تغییر دستی
    setCurrentImageIndex((prev) => (prev === imagesToDisplay.length - 1 ? 0 : prev + 1))
  }

  // توابع swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNextImage()
    }
    if (isRightSwipe) {
      goToPreviousImage()
    }
  }

  return (
    <div className="ad-preview-container">
      {saveMessage.text && (
        <div className={`ad-preview-message ${saveMessage.type === 'success' ? 'ad-preview-message-success' : 'ad-preview-message-error'}`}>
          {saveMessage.text}
        </div>
      )}

      <div className="ad-preview-content">
        {/* تصاویر */}
        <div className="ad-preview-images-section">
          {imagesToDisplay.length > 0 ? (
            <>
              <div 
                className="ad-preview-main-image"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img src={imagesToDisplay[safeImageIndex] || ''} alt={product.title} />
                
                {/* نمایش شماره تصویر با progress bar */}
                {imagesToDisplay.length > 1 && (
                  <div className="ad-preview-image-counter-wrapper">
                    <svg className="ad-preview-image-counter-progress" viewBox="0 0 100 100">
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
                    <div className="ad-preview-image-counter">
                      {safeImageIndex + 1} / {imagesToDisplay.length}
                    </div>
                  </div>
                )}
                
                {/* آیکن ادیت روی تصویر */}
                <button
                  className="ad-preview-image-edit-btn"
                  onClick={() => setShowImageMenu(!showImageMenu)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                
                {/* منوی تصویر */}
                {showImageMenu && (
                  <div className="ad-preview-image-menu">
                    <button
                      className="ad-preview-image-menu-item"
                      onClick={() => {
                        handleDeleteImage(safeImageIndex)
                        setShowImageMenu(false)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      <span>حذف تصویر فعلی</span>
                    </button>
                    <label
                      htmlFor="ad-preview-replace-image"
                      className="ad-preview-image-menu-item"
                    >
                      <input
                        ref={replaceImageInputRef}
                        type="file"
                        id="ad-preview-replace-image"
                        accept="image/*"
                        onChange={(e) => {
                          handleReplaceImage(e, safeImageIndex)
                          setShowImageMenu(false)
                        }}
                        style={{ display: 'none' }}
                      />
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <span>جایگزین کردن</span>
                    </label>
                    <label
                      htmlFor="ad-preview-add-image-inline"
                      className="ad-preview-image-menu-item"
                    >
                      <input
                        ref={addImageInputRef}
                        type="file"
                        id="ad-preview-add-image-inline"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          handleImageChange(e)
                          setShowImageMenu(false)
                        }}
                        style={{ display: 'none' }}
                      />
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>اضافه کردن به تصاویر ({editedImages.length}/4)</span>
                    </label>
                  </div>
                )}
                
                {/* نمایش دکمه ذخیره اگر تغییری وجود دارد */}
                {(() => {
                  // بررسی تغییرات: مقایسه editedImages با product.images
                  const originalImages = product?.images || []
                  const hasChanges = editedImages.length !== originalImages.length ||
                    editedImages.some((img, index) => {
                      if (img.type === 'existing') {
                        return img.path !== originalImages[index]
                      }
                      return true // تصاویر جدید تغییر محسوب می‌شوند
                    }) ||
                    originalImages.some((path, index) => {
                      const editedImg = editedImages[index]
                      return !editedImg || (editedImg.type === 'existing' && editedImg.path !== path)
                    })
                  
                  return hasChanges && (
                    <div className="ad-preview-image-actions">
                      <button
                        className="ad-preview-image-action-cancel"
                        onClick={() => {
                          // بازگرداندن به حالت اولیه
                          const initialImages = (product?.images || []).map((path: string) => ({
                            type: 'existing' as const,
                            path
                          }))
                          setEditedImages(initialImages)
                          setCurrentImageIndex(0)
                        }}
                        disabled={isSaving || isUploadingImages}
                      >
                        انصراف
                      </button>
                      <button
                        className="ad-preview-image-action-save"
                        onClick={handleSaveAllImages}
                        disabled={isSaving || isUploadingImages}
                      >
                        {isSaving || isUploadingImages ? 'ذخیره...' : 'ذخیره تغییرات'}
                      </button>
                    </div>
                  )
                })()}
              </div>
            </>
          ) : (
            <div className="ad-preview-no-image">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>تصویری موجود نیست</p>
              <input
                type="file"
                id="ad-preview-image-upload-empty"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="ad-preview-image-input"
                style={{ display: 'none' }}
              />
              {/* آیکن ادیت و منو برای حالت بدون تصویر */}
              <div className="ad-preview-main-image">
                <div className="ad-preview-no-image-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <button
                  className="ad-preview-image-edit-btn"
                  onClick={() => setShowImageMenu(!showImageMenu)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                
                {showImageMenu && (
                  <div className="ad-preview-image-menu">
                    <label
                      htmlFor="ad-preview-add-image-empty"
                      className="ad-preview-image-menu-item"
                    >
                      <input
                        ref={addImageInputEmptyRef}
                        type="file"
                        id="ad-preview-add-image-empty"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          handleImageChange(e)
                          setShowImageMenu(false)
                        }}
                        style={{ display: 'none' }}
                      />
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>اضافه کردن تصاویر ({editedImages.length}/4)</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* عنوان */}
        <div className="ad-preview-field">
          <label className="ad-preview-field-label">عنوان</label>
          {editingField === 'title' ? (
            <div className="ad-preview-field-edit">
              <input
                type="text"
                value={editValues.title || ''}
                onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                className="ad-preview-field-input"
                autoFocus
              />
              <div className="ad-preview-field-actions">
                <button
                  className="ad-preview-field-save"
                  onClick={() => handleSaveField('title')}
                  disabled={isSaving}
                >
                  ذخیره
                </button>
                <button
                  className="ad-preview-field-cancel"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <div
              className="ad-preview-field-value clickable"
              onClick={() => handleFieldClick('title')}
            >
              {product.title}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* قیمت */}
        <div className="ad-preview-field">
          <label className="ad-preview-field-label">قیمت</label>
          {editingField === 'price' ? (
            <div className="ad-preview-field-edit">
              <input
                type="number"
                value={editValues.price || ''}
                onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                className="ad-preview-field-input"
                autoFocus
                min="0"
                step="1000"
              />
              <div className="ad-preview-field-actions">
                <button
                  className="ad-preview-field-save"
                  onClick={() => handleSaveField('price')}
                  disabled={isSaving}
                >
                  ذخیره
                </button>
                <button
                  className="ad-preview-field-cancel"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <div
              className="ad-preview-field-value clickable"
              onClick={() => handleFieldClick('price')}
            >
              {formatPrice(product.price)} تومان
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* وضعیت */}
        <div className="ad-preview-field">
          <label className="ad-preview-field-label">وضعیت</label>
          {editingField === 'status' ? (
            <div className="ad-preview-field-edit">
              <select
                value={editValues.status || product.status}
                onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                className="ad-preview-field-input"
                autoFocus
              >
                <option value="new">نو</option>
                <option value="used">دست دوم</option>
                <option value="damaged">نیاز به تعمیر</option>
                <option value="needs_repair">نیاز به تعمیر</option>
              </select>
              <div className="ad-preview-field-actions">
                <button
                  className="ad-preview-field-save"
                  onClick={() => handleSaveField('status')}
                  disabled={isSaving}
                >
                  ذخیره
                </button>
                <button
                  className="ad-preview-field-cancel"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <div
              className="ad-preview-field-value clickable"
              onClick={() => handleFieldClick('status')}
            >
              <span
                className="ad-preview-status-badge"
                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
              >
                {getStatusText(product.status)}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* توضیحات */}
        <div className="ad-preview-field">
          <label className="ad-preview-field-label">توضیحات</label>
          {editingField === 'description' ? (
            <div className="ad-preview-field-edit">
              <textarea
                value={editValues.description || ''}
                onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                className="ad-preview-field-input ad-preview-field-textarea"
                autoFocus
                rows={6}
              />
              <div className="ad-preview-field-actions">
                <button
                  className="ad-preview-field-save"
                  onClick={() => handleSaveField('description')}
                  disabled={isSaving}
                >
                  ذخیره
                </button>
                <button
                  className="ad-preview-field-cancel"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <div
              className="ad-preview-field-value clickable ad-preview-description"
              onClick={() => handleFieldClick('description')}
            >
              {product.description || 'توضیحاتی ثبت نشده است'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* دکمه بستن شناور در پایین */}
      <button className="ad-preview-close-btn ad-preview-close-btn-floating" onClick={onClose}>
        <img 
          src="/thumbs-up-icon.png" 
          alt="Close" 
          style={{ 
            width: '42px', 
            height: '42px', 
            filter: 'drop-shadow(0 0 8px #00b4ff)',
            objectFit: 'contain',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} 
        />
      </button>

    </div>
  )
}

