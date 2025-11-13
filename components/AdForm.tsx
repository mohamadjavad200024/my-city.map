'use client'

import { useState } from 'react'

interface AdFormProps {
  onClose: () => void
  position?: { lat: number; lng: number } | null
  onSuccess?: (userId: number) => void
}

export default function AdForm({ onClose, position, onSuccess }: AdFormProps) {
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: ''
  })
  const [errors, setErrors] = useState({
    username: '',
    phone: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // پاک کردن خطا هنگام تایپ
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {
      username: '',
      phone: '',
      password: ''
    }
    let isValid = true

    // اگر در حالت لاگین نیستیم، نام کاربری الزامی است
    if (!isLoginMode && !formData.username.trim()) {
      newErrors.username = 'نام کاربری الزامی است'
      isValid = false
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'شماره تماس الزامی است'
      isValid = false
    } else if (!/^09\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'شماره تماس باید با 09 شروع شود و 11 رقم باشد'
      isValid = false
    }

    if (!formData.password.trim()) {
      newErrors.password = 'رمز الزامی است'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'رمز باید حداقل 6 کاراکتر باشد'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    
    if (!validateForm()) {
      return
    }
    
    // اگر position وجود ندارد، از موقعیت پیش‌فرض استفاده کن (برای ثبت‌نام بدون موقعیت)
    const finalPosition = position || { lat: 0, lng: 0 }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: isLoginMode ? '' : formData.username.trim(), // اگر در حالت لاگین است، نام کاربری ارسال نمی‌شود
          phone: formData.phone.trim(),
          password: formData.password.trim(),
          lat: finalPosition.lat,
          lng: finalPosition.lng,
          forceRegister: !isLoginMode // اگر در حالت لاگین است، forceRegister = false
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        // اگر خطای مربوط به شماره تماس یا نام کاربری است، نمایش بده
        const errorMessage = data.error || 'خطا در ثبت آگهی'
        throw new Error(errorMessage)
      }
      
      // موفقیت
      setSubmitSuccess(true)
      
      // اگر onSuccess callback وجود دارد، userId را بفرست
      if (onSuccess && data.data?.id) {
        setTimeout(() => {
          onSuccess(data.data.id)
        }, 1000)
      } else {
        // بعد از 1.5 ثانیه drawer را ببند
        setTimeout(() => {
          onClose()
          // ریست فرم
          setFormData({ username: '', phone: '', password: '' })
          setSubmitSuccess(false)
        }, 1500)
      }
      
    } catch (error: any) {
      console.error('Error submitting form:', error)
      setSubmitError(error.message || 'خطا در ثبت آگهی. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="ad-form-container">
      <form onSubmit={handleSubmit} className="ad-form">
        {!isLoginMode && (
          <div className="ad-form-group">
            <div className="ad-form-input-wrapper">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`ad-form-input ${errors.username ? 'ad-form-input-error' : ''}`}
                placeholder="نام کاربری خود را وارد کنید"
                autoComplete="username"
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
                position: 'absolute', 
                right: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#ffffff',
                pointerEvents: 'none'
              }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            {errors.username && (
              <span className="ad-form-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {errors.username}
              </span>
            )}
          </div>
        )}

        <div className="ad-form-group">
          <div className="ad-form-input-wrapper">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`ad-form-input ${errors.phone ? 'ad-form-input-error' : ''}`}
              placeholder="09123456789"
              autoComplete="tel"
              dir="ltr"
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
              position: 'absolute', 
              right: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none'
            }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          {errors.phone && (
            <span className="ad-form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errors.phone}
            </span>
          )}
        </div>

        <div className="ad-form-group">
          <div className="ad-form-input-wrapper">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`ad-form-input ${errors.password ? 'ad-form-input-error' : ''}`}
              placeholder="رمز خود را وارد کنید"
              autoComplete="new-password"
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ 
              position: 'absolute', 
              right: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none'
            }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          {errors.password && (
            <span className="ad-form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errors.password}
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
            <span>{isLoginMode ? 'ورود با موفقیت انجام شد' : 'ثبت‌نام با موفقیت انجام شد'}</span>
          </div>
        )}

        {/* متن جابه‌جایی بین ثبت‌نام و ورود */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          marginBottom: '80px',
          paddingTop: '20px',
          paddingBottom: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode)
              setErrors({ username: '', phone: '', password: '' })
              setSubmitError('')
              setSubmitSuccess(false)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            {isLoginMode 
              ? 'حساب کاربری ندارید؟ ثبت‌نام کنید' 
              : 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید'}
          </button>
        </div>

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

