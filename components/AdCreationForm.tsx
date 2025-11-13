'use client'

import { useState } from 'react'

interface AdCreationFormProps {
  userId: number
  onClose: () => void
  onSuccess?: () => void
  userLocation?: { lat: number; lng: number } | null
}

export default function AdCreationForm({ userId, onClose, onSuccess, userLocation }: AdCreationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    status: 'new' // new, used, damaged
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [errors, setErrors] = useState({
    title: '',
    price: '',
    description: '',
    status: '',
    images: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const formatPrice = (value: string) => {
    // حذف همه کاراکترهای غیر عددی
    const numbers = value.replace(/\D/g, '')
    // اضافه کردن جداکننده هزارگان
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // اگر فیلد قیمت است، فرمت کن
    if (name === 'price') {
      const formattedValue = formatPrice(value)
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // پاک کردن خطا هنگام تایپ
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files).slice(0, 5 - images.length) // حداکثر 5 تصویر
    const newPreviews: string[] = []

    newFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrors(prev => ({
          ...prev,
          images: 'هر تصویر باید کمتر از 5 مگابایت باشد'
        }))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string)
          if (newPreviews.length === newFiles.length) {
            setImagePreviews(prev => [...prev, ...newPreviews])
          }
        }
      }
      reader.readAsDataURL(file)
    })

    setImages(prev => [...prev, ...newFiles])
    setErrors(prev => ({
      ...prev,
      images: ''
    }))
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors = {
      title: '',
      price: '',
      description: '',
      status: '',
      images: ''
    }
    let isValid = true

    if (!formData.title.trim()) {
      newErrors.title = 'عنوان الزامی است'
      isValid = false
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'عنوان باید حداقل 3 کاراکتر باشد'
      isValid = false
    }

    // حذف کاما از قیمت برای بررسی
    const priceWithoutComma = formData.price.replace(/,/g, '')
    if (!priceWithoutComma.trim()) {
      newErrors.price = 'قیمت الزامی است'
      isValid = false
    } else if (isNaN(Number(priceWithoutComma)) || Number(priceWithoutComma) <= 0) {
      newErrors.price = 'قیمت باید یک عدد معتبر باشد'
      isValid = false
    }

    if (!formData.description.trim()) {
      newErrors.description = 'توضیحات الزامی است'
      isValid = false
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'توضیحات باید حداقل 10 کاراکتر باشد'
      isValid = false
    }

    if (!formData.status) {
      newErrors.status = 'وضعیت محصول الزامی است'
      isValid = false
    }

    if (images.length === 0) {
      newErrors.images = 'حداقل یک تصویر الزامی است'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('userId', userId.toString())
      formDataToSend.append('title', formData.title.trim())
      // حذف کاما از قیمت قبل از ارسال
      const priceWithoutComma = formData.price.replace(/,/g, '')
      formDataToSend.append('price', priceWithoutComma.trim())
      formDataToSend.append('description', formData.description.trim())
      formDataToSend.append('status', formData.status)
      
      // ارسال لوکیشن کاربر (اگر موجود باشد)
      if (userLocation) {
        formDataToSend.append('lat', userLocation.lat.toString())
        formDataToSend.append('lng', userLocation.lng.toString())
      }
      
      images.forEach((image, index) => {
        formDataToSend.append(`image_${index}`, image)
      })

      const response = await fetch('/api/products', {
        method: 'POST',
        body: formDataToSend
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت آگهی')
      }
      
      // موفقیت
      setSubmitSuccess(true)
      
      // بعد از 1.5 ثانیه به پروفایل برگرد
      setTimeout(() => {
        // ریست فرم
        setFormData({ title: '', price: '', description: '', status: 'new' })
        setImages([])
        setImagePreviews([])
        setSubmitSuccess(false)
        // فراخوانی onSuccess برای برگشت به پروفایل
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)
      
    } catch (error: any) {
      console.error('Error submitting form:', error)
      setSubmitError(error.message || 'خطا در ثبت آگهی. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="ad-creation-form-container">
      <form onSubmit={handleSubmit} className="ad-creation-form" style={{ paddingBottom: '100px' }}>
        {/* فیلد تصاویر */}
        <div className="ad-form-group">
          {imagePreviews.length > 0 && (
            <div className="ad-creation-images-container">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="ad-creation-image-preview">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="ad-creation-image-remove"
                    onClick={() => removeImage(index)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length < 5 && (
            <>
              <label htmlFor="image-input" className="ad-creation-image-upload">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>افزودن تصویر</span>
              </label>
              <input
                type="file"
                id="image-input"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="ad-creation-form-input-file"
              />
            </>
          )}
          {errors.images && (
            <span className="ad-form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errors.images}
            </span>
          )}
        </div>

        {/* فیلد عنوان */}
        <div className="ad-form-group">
          <div className="ad-form-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ad-creation-input-icon">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`ad-form-input ${errors.title ? 'ad-form-input-error' : ''}`}
              placeholder="عنوان آگهی را وارد کنید"
            />
          </div>
          {errors.title && (
            <span className="ad-form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errors.title}
            </span>
          )}
        </div>

        {/* فیلد قیمت */}
        <div className="ad-form-group">
          <div className="ad-form-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ad-creation-input-icon">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <input
              type="text"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={`ad-form-input ${errors.price ? 'ad-form-input-error' : ''}`}
              placeholder="قیمت را وارد کنید"
              dir="ltr"
            />
          </div>
          {errors.price && (
            <span className="ad-form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errors.price}
            </span>
          )}
        </div>

        {/* فیلد توضیحات */}
        <div className="ad-form-group">
          <div className="ad-form-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ad-creation-input-icon ad-creation-input-icon-textarea">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`ad-form-input ${errors.description ? 'ad-form-input-error' : ''}`}
              placeholder="توضیحات آگهی را وارد کنید"
              rows={5}
            />
          </div>
          {errors.description && (
            <span className="ad-form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errors.description}
            </span>
          )}
        </div>

        {/* فیلد وضعیت محصول */}
        <div className="ad-form-group">
          <div className="ad-form-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ad-creation-input-icon">
              <path d="M12 2v20M2 12h20"></path>
            </svg>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`ad-form-input ${errors.status ? 'ad-form-input-error' : ''}`}
            >
              <option value="new">نو</option>
              <option value="used">دست دوم</option>
              <option value="damaged">نیاز به تعمیر</option>
            </select>
          </div>
          {errors.status && (
            <span className="ad-form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errors.status}
            </span>
          )}
        </div>

        {submitError && (
          <div className="ad-form-error-message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{submitError}</span>
          </div>
        )}
        
        {submitSuccess && (
          <div className="ad-form-success-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>آگهی با موفقیت ثبت شد</span>
          </div>
        )}
      </form>

      {/* دکمه تایید شناور */}
      <div className="ad-form-floating-action">
        <button 
          className="ad-details-like-btn ad-details-like-btn-floating" 
          onClick={(e) => {
            e.preventDefault()
            handleSubmit(e as any)
          }}
          disabled={isSubmitting || submitSuccess}
          type="button"
        >
          <img 
            src="/thumbs-up-icon.png" 
            alt="تایید" 
            className="ad-details-like-icon"
            style={{ 
              opacity: (isSubmitting || submitSuccess) ? 0.5 : 1
            }} 
          />
        </button>
      </div>
    </div>
  )
}

