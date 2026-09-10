/**
 * App Module
 * Bootstrap and initialization
 */
(function() {
  'use strict';
  
  // ============================================
  // Placeholder Views (will be implemented in Phase 2+)
  // ============================================
  
  function placeholderView(title, icon) {
    return function(root) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${icon}</div>
          <div class="empty-state-title">${title}</div>
          <div class="empty-state-text">این بخش در مراحل بعدی پیاده‌سازی می‌شود.</div>
        </div>
      `;
    };
  }
  
  // ============================================
  // Register Routes
  // ============================================
  
  function registerRoutes() {
  // Dashboard
  Router.register('/dashboard', {
    title: 'مدیریت مرسولات',
    view: Views.Dashboard.render  
    });
    
    // Shipments list
    Router.register('/shipments', {
      title: 'مرسولات',
      view: placeholderView('لیست مرسولات', '📦')
    });
    
    // Scan
    Router.register('/scan', {
      title: 'اسکن بارکد',
      view: Views.Scan.render
    });
    // Shipment Form (New)
  Router.register('/shipment-new', {
    title: 'ثبت مرسوله جدید',
    view: Views.ShipmentForm.render
    });

  // Shipment Form (Edit)
  Router.register('/shipment-edit', {
    title: 'ویرایش مرسوله',
    view: Views.ShipmentForm.render
    });
    
    // Suppliers
    Router.register('/suppliers', {
      title: 'فروشگاه‌ها',
      view: placeholderView('فروشگاه‌ها و تأمین‌کنندگان', '🏪')
    });
    
    // Settings
    Router.register('/settings', {
      title: 'تنظیمات',
      view: placeholderView('تنظیمات', '⚙️')
    });
    
    // Reports
    Router.register('/reports', {
      title: 'گزارش‌ها',
      view: placeholderView('گزارش‌ها', '📊')
    });
  }
  
  // ============================================
  // Theme Management
  // ============================================
  
  async function applyTheme(theme) {
    if (!theme) theme = 'light';
    document.documentElement.setAttribute('data-theme', theme);
    State.set('theme', theme);
    
    // Update theme color meta
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      const isDark = theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      metaTheme.setAttribute('content', isDark ? '#0f172a' : '#0ea5e9');
    }
  }
  
  // ============================================
  // Service Worker Registration
  // ============================================
  
async function registerServiceWorker() {
  // موقتاً غیرفعال شده
  console.log('Service Worker disabled for testing');
  return;
}
  
  // ============================================
  // Header Button Handlers
  // ============================================
  
  function setupHeaderButtons() {
    const backBtn = document.getElementById('btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          Router.navigate('/dashboard');
        }
      });
    }
    
    const menuBtn = document.getElementById('btn-menu');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        Components.toast('منو به‌زودی اضافه می‌شود', 'info');
      });
    }
  }
  
  // ============================================
  // Initialization
  // ============================================
  
  async function init() {
    try {
      console.log('🚀 Initializing Parcel Manager...');
      
      // 1. Initialize database
      await DB.init();
      console.log('✅ Database initialized');
      
      // 2. Load settings
      const settings = await State.loadSettings();
      console.log('✅ Settings loaded');
      
      // 3. Apply theme
      await applyTheme(settings.theme || 'light');
      
      // 4. Load data
      await State.loadShipments();
      await State.loadSuppliers();
      console.log('✅ Data loaded');
      
      // 5. Register routes
      registerRoutes();
      
      // 6. Setup UI
      setupHeaderButtons();
      
      // 7. Start router
      Router.start();
      
      // 8. Register service worker
      registerServiceWorker();
      
      // 9. Hide loading screen, show app
      const loadingScreen = document.getElementById('loading-screen');
      const app = document.getElementById('app');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 300);
      }
      if (app) {
        app.style.display = 'flex';
      }
      
      State.set('initialized', true);
      console.log('✅ App ready');
      
    } catch (err) {
      console.error('❌ Initialization failed:', err);
      const loadingText = document.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = 'خطا در بارگذاری برنامه';
        loadingText.style.color = 'var(--color-danger)';
      }
    }
  }
  
  // ============================================
  // Start when DOM is ready
  // ============================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
