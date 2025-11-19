'use client'

import { useRef, useState } from 'react'
import { X, Download } from 'lucide-react'
import { useThemeLanguage } from '@/lib/use-theme-language'
import { getTranslations } from '@/lib/i18n'

interface QRModalProps {
  onClose: () => void
  user: any
}

export default function QRModal({ onClose, user }: QRModalProps) {
  const { language } = useThemeLanguage()
  const t = getTranslations(language)
  const qrImageRef = useRef<HTMLImageElement>(null)
  const [downloading, setDownloading] = useState(false)

  const downloadQRCode = async () => {
    if (!qrImageRef.current) return
    
    setDownloading(true)
    try {
      const link = document.createElement('a')
      link.href = qrImageRef.current.src
      link.download = `banuhashim-qr-code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">
            {language === 'ur' ? 'QR کوڈ' : language === 'ar' ? 'رمز QR' : 'Your QR Code'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all p-1.5 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 space-y-4">
          {/* QR Code Container */}
          <div className="bg-gradient-to-br from-background to-background/50 border-2 border-dashed border-border rounded-lg p-6 sm:p-8 flex items-center justify-center">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
              <img
                ref={qrImageRef}
                src="/qr-code.jpeg"
                alt="QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              />
            </div>
          </div>

          {/* UPI ID Info */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              {language === 'ur' ? 'UPI ID' : language === 'ar' ? 'معرف UPI' : 'UPI ID'}
            </p>
            <p className="text-sm sm:text-base font-medium text-foreground break-all">
              talibhassan1122@oksbi
            </p>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadQRCode}
            disabled={downloading}
            className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-accent-foreground font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>
              {downloading
                ? language === 'ur' ? 'ڈاؤن لوڈ ہو رہا ہے...' : language === 'ar' ? 'جاري التنزيل...' : 'Downloading...'
                : language === 'ur' ? 'QR ڈاؤن لوڈ کریں' : language === 'ar' ? 'تحميل رمز QR' : 'Download QR Code'}
            </span>
          </button>

          {/* Instructions */}
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">
              {language === 'ur' ? 'ہدایات:' : language === 'ar' ? 'تعليمات:' : 'Instructions:'}
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                {language === 'ur' ? 'اپنا QR کوڈ ڈاؤن لوڈ کریں' : language === 'ar' ? 'قم بتنزيل رمز QR الخاص بك' : 'Download your QR code'}
              </li>
              <li>
                {language === 'ur' ? 'اسے اپنے اکاؤنٹ میں شامل کریں' : language === 'ar' ? 'أضفه إلى حسابك' : 'Add it to your account'}
              </li>
              <li>
                {language === 'ur' ? 'دوسروں کو ادائیگی آسان بنائیں' : language === 'ar' ? 'اجعل الدفع أسهل للآخرين' : 'Make payments easier for others'}
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3 sm:p-4 bg-background/50">
          <button
            onClick={onClose}
            className="w-full text-muted-foreground hover:text-foreground hover:bg-accent/10 font-medium text-sm sm:text-base transition-colors py-2 px-3 rounded-lg"
          >
            {language === 'ur' ? 'بند کریں' : language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
