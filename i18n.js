// Localization dictionary for Persian (FA) and English (EN)

const I18N = {
  currentLang: 'fa', // Default to Persian as requested by user

  translations: {
    fa: {
      appTitle: "GearForge 3D | طراحی و شبیه‌سازی مهندسی چرخ‌دنده",
      appName: "GearForge 3D",
      appSubName: "نرم‌افزار جامع طراحی انواع چرخ‌دنده",
      
      // Top Nav
      langSwitch: "English",
      themeDark: "حالت شب",
      themeLight: "حالت روز",
      exportBtn: "خروجی و اشتراک‌گذاری",
      sendBtn: "ارسال فایل",
      resetView: "بازنشانی دید",
      
      // Side tabs
      tabDesign: "طراحی چرخ‌دنده",
      tabKinematics: "شبیه‌سازی و دورسنج (RPM)",
      tabView: "محیط و نمایشگر",
      tabLibrary: "انواع چرخ‌دنده",
      
      // Gear Types
      gearTypeSpur: "چرخ‌دنده ساده (Spur Gear)",
      gearTypeHelical: "چرخ‌دنده مارپیچ (Helical Gear)",
      gearTypeRack: "شانه‌ای و پینیون (Rack & Pinion)",
      gearTypeBevel: "چرخ‌دنده مخروطی (Bevel Gear)",
      gearTypeInternal: "چرخ‌دنده داخلی (Internal Gear)",
      
      // Parameters
      paramModule: "مدول (Module - m)",
      paramModuleHelp: "اندازه دندانه بر حسب میلی‌متر",
      paramTeeth: "تعداد دندانه‌ها (Z)",
      paramPressureAngle: "زاویه فشار (درجه)",
      paramFaceWidth: "عرض چرخ‌دنده (ضخامت / mm)",
      paramBoreDiameter: "قطر شفت مرکزی (mm)",
      paramHelixAngle: "زاویه مارپیچ (Helix Angle)",
      paramRackTeeth: "تعداد دندانه‌های شانه (Rack)",
      paramBackingHeight: "ارتفاع تکیه‌گاه شانه (mm)",
      paramBevelAngle: "زاویه مخروط گام (Pitch Cone)",
      
      // Kinematics / Assembly
      kinematicsTitle: "قطار چرخ‌دنده‌ها و محاسبات دورسنج",
      addGearBtn: "افزودن چرخ‌دنده به مجموعه (+)",
      driverLabel: "چرخ‌دنده محرک اصلی (Driver):",
      driverRpm: "دور چرخ‌دنده محرک (RPM):",
      rpmUnit: "دور بر دقیقه (RPM)",
      runSim: "اجرای حرکت",
      stopSim: "توقف چرخش",
      simSpeed: "سرعت انیمیشن:",
      gearListTitle: "فهرست و مشخصات چرخ‌دنده‌ها:",
      gearItem: "چرخ‌دنده",
      isDriver: "محرک (Driver)",
      isDriven: "متحرک (Driven)",
      ratioLabel: "نسبت دور:",
      calculatedRPM: "دور محاسبه‌شده:",
      direction: "جهت:",
      clockwise: "ساعت‌گرد (CW)",
      counterClockwise: "پادساعت‌گرد (CCW)",
      removeGear: "حذف",
      
      // Engineering calculations box
      specPitchDiameter: "قطر دایره گام (d):",
      specTipDiameter: "قطر دایره سر (da):",
      specRootDiameter: "قطر دایره ریشه (df):",
      specCircularPitch: "گام محیطی (p):",
      specCenterDist: "فاصله بین محورها (a):",
      
      // Camera Views
      viewPreset: "نماهای مهندسی:",
      viewIsometric: "ایزومتریک (3D)",
      viewTop: "نمای بالا (Top / 2D)",
      viewFront: "نمای روبرو (Front)",
      viewSide: "نمای پهلو (Side)",
      materialMetal: "فولاد صنعتی",
      materialBrass: "برنج / برنز",
      materialAluminum: "آلومینیوم آنودایز",
      materialPlastic: "پلیمر 3D Print",
      materialWireframe: "مشبک (Wireframe)",
      showAxes: "نمایش محورهای مختصات",
      showGrid: "نمایش صفحه شطرنجی (Grid)",
      
      // Export Modal
      exportModalTitle: "خروجی و ارسال مستقیم فایل",
      exportDXF: "دریافت فایل DXF (دوبعدی استاندارد برای برش لیزر و CNC)",
      exportSTEP: "دریافت فایل STEP / STP (سه‌بعدی استاندارد صنعتی برای سالیدورکز و کتیا)",
      exportSTL: "دریافت فایل STL (برای پرینتر سه‌بعدی)",
      sendModalDesc: "شما می‌توانید فایل خروجی را مستقیماً از طریق ایمیل یا پیام‌رسان‌ها برای همکار، کارگاه یا مشتری ارسال کنید.",
      recipientEmail: "ایمیل یا گیرنده (اختیاری):",
      subjectInput: "موضوع پیام:",
      sendActionBtn: "ارسال مستقیم فایل",
      downloadActionBtn: "دانلود مستقیم در رایانه",
      closeBtn: "بستن",
      exportSuccess: "فایل با موفقیت صادر شد!",
      shareSuccess: "فایل با موفقیت برای ارسال آماده شد."
    },
    en: {
      appTitle: "GearForge 3D | Professional Gear Generator & Simulator",
      appName: "GearForge 3D",
      appSubName: "Precision Gear Design, Kinematics & 3D CAD Exporter",
      
      // Top Nav
      langSwitch: "فارسی",
      themeDark: "Dark Mode",
      themeLight: "Light Mode",
      exportBtn: "Export & Share",
      sendBtn: "Send File",
      resetView: "Reset Camera",
      
      // Side tabs
      tabDesign: "Gear Design",
      tabKinematics: "Kinematics & RPM",
      tabView: "Environment & View",
      tabLibrary: "Gear Types",
      
      // Gear Types
      gearTypeSpur: "Spur Gear",
      gearTypeHelical: "Helical Gear",
      gearTypeRack: "Rack & Pinion",
      gearTypeBevel: "Bevel Gear",
      gearTypeInternal: "Internal Ring Gear",
      
      // Parameters
      paramModule: "Module (m in mm)",
      paramModuleHelp: "Standard tooth size in millimeters",
      paramTeeth: "Number of Teeth (Z)",
      paramPressureAngle: "Pressure Angle (°)",
      paramFaceWidth: "Face Width / Thickness (mm)",
      paramBoreDiameter: "Center Shaft Bore (mm)",
      paramHelixAngle: "Helix Angle (°)",
      paramRackTeeth: "Rack Teeth Count",
      paramBackingHeight: "Rack Backing Height (mm)",
      paramBevelAngle: "Pitch Cone Angle (°)",
      
      // Kinematics / Assembly
      kinematicsTitle: "Gear Train & RPM Kinematics",
      addGearBtn: "Add Gear to Mesh (+)",
      driverLabel: "Primary Driver Gear:",
      driverRpm: "Driver Speed (RPM):",
      rpmUnit: "Revolutions Per Minute",
      runSim: "Start Rotation",
      stopSim: "Stop Rotation",
      simSpeed: "Animation Speed:",
      gearListTitle: "Configured Gears in Train:",
      gearItem: "Gear",
      isDriver: "Driver",
      isDriven: "Driven",
      ratioLabel: "Gear Ratio:",
      calculatedRPM: "Calculated RPM:",
      direction: "Rotation:",
      clockwise: "Clockwise (CW)",
      counterClockwise: "Counter-Clockwise (CCW)",
      removeGear: "Remove",
      
      // Engineering calculations box
      specPitchDiameter: "Pitch Diameter (d):",
      specTipDiameter: "Tip Diameter (da):",
      specRootDiameter: "Root Diameter (df):",
      specCircularPitch: "Circular Pitch (p):",
      specCenterDist: "Center Distance (a):",
      
      // Camera Views
      viewPreset: "Engineering Views:",
      viewIsometric: "Isometric 3D",
      viewTop: "Top (2D View)",
      viewFront: "Front View",
      viewSide: "Side View",
      materialMetal: "Industrial Steel",
      materialBrass: "Machined Brass",
      materialAluminum: "Anodized Aluminum",
      materialPlastic: "3D Print Polymer",
      materialWireframe: "Wireframe Mode",
      showAxes: "Show Axes (XYZ)",
      showGrid: "Show Precision Grid",
      
      // Export Modal
      exportModalTitle: "Export & Direct Share",
      exportDXF: "Download DXF (2D Standard for Laser / CNC Cutting)",
      exportSTEP: "Download STEP / STP (3D Standard for SolidWorks / CATIA)",
      exportSTL: "Download STL (for 3D Printing)",
      sendModalDesc: "Send CAD models directly to your client, machine shop or email.",
      recipientEmail: "Recipient Email (Optional):",
      subjectInput: "Message Subject:",
      sendActionBtn: "Send File Directly",
      downloadActionBtn: "Download File to PC",
      closeBtn: "Close",
      exportSuccess: "File successfully generated!",
      shareSuccess: "File ready for sharing."
    }
  },

  t: function(key) {
    const lang = this.currentLang || 'fa';
    return this.translations[lang][key] || key;
  },

  setLang: function(lang) {
    this.currentLang = lang;
    document.documentElement.dir = (lang === 'fa') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    this.updateDom();
  },

  updateDom: function() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && this.translations[this.currentLang][key]) {
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'email')) {
          el.placeholder = this.translations[this.currentLang][key];
        } else {
          el.textContent = this.translations[this.currentLang][key];
        }
      }
    });

    // Update document title
    document.title = this.t('appTitle');
  }
};

window.I18N = I18N;
