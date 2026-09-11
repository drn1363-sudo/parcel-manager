/**
 * App Module
 */
(function() {
  'use strict';
  
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
  
  function registerRoutes() {
    Router.register('/dashboard', {
      title: 'مدیریت مرسولات',
      view: Views.Dashboard.render
    });
    
    Router.register('/shipments', {
      title: 'مرسولات',
      view: Views.ShipmentsList.render
    });
    
    Router.register('/scan', {
      title: 'اسکن بارکد',
      view: Views.Scan.render
    });
    
    Router.register('/suppliers', {
      title: 'فروشگاه‌ها',
      view: Views.Suppliers.render
    });
    
    Router.register('/supplier-new', {
      title: 'افزودن فروشگاه',
      view: Views.SupplierForm.render
    });
    
    Router.register('/supplier-edit', {
      title: 'ویرایش فروشگاه',
      view: Views.SupplierForm.render
    });
    
    Router.register('/supplier-detail', {
      title: 'جزئیات فروشگاه',
      view: Views.SupplierDetail.render
    });
    
    Router.register('/settings', {
      title: 'تنظیمات',
      view: Views.Settings.render
    });
    
    Router.register('/reports', {
      title: 'گزارش‌ها',
      view: placeholderView('گزارش‌ها', '📊')
    });
    
    Router.register('/shipment-new', {
      title: 'ثبت مرسوله جدید',
      view: Views.ShipmentForm.render
    });
    
    Router.register('/shipment-edit', {
      title: 'ویرایش مرسوله',
      view: Views.ShipmentForm.render
    });
    
    Router.register('/shipment-detail', {
      title: 'جزئیات مرسوله',
      view: Views.ShipmentDetail.render
    });
  }
  
  async function applyTheme(theme) {
    if (!theme) theme = 'light';
    document.documentElement.setAttribute('data-theme', theme);
    State.set('theme', theme);
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      const isDark = theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      metaTheme.setAttribute('content', isDark ? '#0f172a' : '#0ea5e9');
    }
  }
  
  async function registerServiceWorker() {
    console.log('Service Worker disabled for testing');
    return;
  }
  
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
  
  async function init() {
    try {
      console.log('🚀 Initializing Parcel Manager...');
      
      await DB.init();
      console.log('✅ Database initialized');
      
      const settings = await State.loadSettings();
      console.log('✅ Settings loaded');
      
      await applyTheme(settings.theme || 'light');
      
      await State.loadShipments();
      await State.loadSuppliers();
      console.log('✅ Data loaded');
      
      registerRoutes();
      setupHeaderButtons();
      Router.start();
      registerServiceWorker();
      
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
      alert('خطا: ' + err.message + '\n\nStack: ' + err.stack);
      const loadingText = document.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = 'خطا: ' + err.message;
        loadingText.style.color = 'var(--color-danger)';
      }
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
