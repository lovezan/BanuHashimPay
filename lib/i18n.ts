'use client'

export const translations = {
    en: {
      monthlyPayment: 'Monthly Payment Requirement',
      amountDue: '₹20 per month',
      societyName: 'Banuhashim Society',
      description: 'Track all society payments and contributions. Every member is required to contribute ₹20 monthly along with any additional donations or payments.',
      navigation: {
        home: 'Home',
        transactions: 'Transactions',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
      },
      members: {
        allMembers: 'All Members',
        noMembers: 'No members yet',
        president: 'President',
        vicePresident: 'Vice President',
        member: 'Member',
        organizationHead: 'Organization Head',
        assistantLead: 'Assistant Lead',
        noPresident: 'No president assigned',
        noVicePresident: 'No vice president assigned',
      },
      payment: {
        totalThisMonth: 'Total This Month',
        addPayment: 'Add Payment',
        reason: 'Reason',
        amount: 'Amount',
        submit: 'Submit',
        cancel: 'Cancel',
      },
      settings: {
        language: 'Language',
        theme: 'Theme',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        english: 'English',
        urdu: 'اردو',
        arabic: 'العربية',
      },
    },
    ur: {
      monthlyPayment: 'ماہانہ ادائیگی کی ضرورت',
      amountDue: '20 روپے ہر مہینہ',
      societyName: 'بنو ہاشم سوسائٹی',
      description: 'تمام سوسائٹی کی ادائیگیوں اور شراکت کو ٹریک کریں۔ ہر ممبر کو ہر مہینہ 20 روپے کی شراکت کے ساتھ ساتھ کوئی بھی اضافی عطیہ یا ادائیگی کرنی ہے۔',
      navigation: {
        home: 'ہوم',
        transactions: 'لین دین',
        profile: 'پروفائل',
        settings: 'ترتیبات',
        logout: 'لاگ آؤٹ',
      },
      members: {
        allMembers: 'تمام ممبر',
        noMembers: 'ابھی کوئی ممبر نہیں',
        president: 'صدر',
        vicePresident: 'نائب صدر',
        member: 'ممبر',
        organizationHead: 'تنظیم کے سربراہ',
        assistantLead: 'معاون لیڈ',
        noPresident: 'کوئی صدر منتخب نہیں',
        noVicePresident: 'کوئی نائب صدر منتخب نہیں',
      },
      payment: {
        totalThisMonth: 'اس مہینے کل',
        addPayment: 'ادائیگی شامل کریں',
        reason: 'وجہ',
        amount: 'رقم',
        submit: 'جمع کریں',
        cancel: 'منسوخ کریں',
      },
      settings: {
        language: 'زبان',
        theme: 'تھیم',
        darkMode: 'ڈارک موڈ',
        lightMode: 'لائٹ موڈ',
        english: 'English',
        urdu: 'اردو',
        arabic: 'العربية',
      },
    },
    ar: {
      monthlyPayment: 'متطلب الدفع الشهري',
      amountDue: '٢٠ روبية شهريا',
      societyName: 'جمعية بني هاشم',
      description: 'تتبع جميع الدفعات والمساهمات في المجتمع. يجب على كل عضو أن يساهم بـ ٢٠ روبية شهريا بالإضافة إلى أي تبرعات أو دفعات إضافية.',
      navigation: {
        home: 'الرئيسية',
        transactions: 'المعاملات',
        profile: 'الملف الشخصي',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج',
      },
      members: {
        allMembers: 'جميع الأعضاء',
        noMembers: 'لا توجد أعضاء حتى الآن',
        president: 'الرئيس',
        vicePresident: 'نائب الرئيس',
        member: 'عضو',
        organizationHead: 'رئيس المنظمة',
        assistantLead: 'المساعد',
        noPresident: 'لم يتم تعيين رئيس',
        noVicePresident: 'لم يتم تعيين نائب رئيس',
      },
      payment: {
        totalThisMonth: 'الإجمالي هذا الشهر',
        addPayment: 'إضافة دفعة',
        reason: 'السبب',
        amount: 'المبلغ',
        submit: 'إرسال',
        cancel: 'إلغاء',
      },
      settings: {
        language: 'اللغة',
        theme: 'المظهر',
        darkMode: 'الوضع الداكن',
        lightMode: 'الوضع الفاتح',
        english: 'English',
        urdu: 'اردو',
        arabic: 'العربية',
      },
    },
  }
  
  export type Language = 'en' | 'ur' | 'ar'
  
  export function getTranslations(language: Language) {
    return translations[language] || translations.en
  }
  