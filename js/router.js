/**
 * Router Module
 * Simple hash-based SPA router
 */
window.Router = (function() {
  'use strict';
  
  const routes = {};
  let currentRoute = null;
  let currentCleanup = null;
  
  // ============================================
  // Route Registration
  // ============================================
  
  /**
   * Register a route
   * @param {string} path - Route path (e.g. '/dashboard')
   * @param {object} config - { title, view, onEnter, onExit, hideNav }
   */
  function register(path, config) {
    routes[path] = config;
  }
  
  // ============================================
  // Navigation
  // ============================================
  
  /**
   * Navigate to a route
   * @param {string} path - Route path
   * @param {object} params - Optional params
   */
  function navigate(path, params = {}) {
    // Add params to hash if any
    let hash = '#' + path;
    if (Object.keys(params).length > 0) {
      const query = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      hash += '?' + query;
    }
    window.location.hash = hash;
  }
  
  /**
   * Parse hash into path and params
   */
  function parseHash() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const [path, queryString] = hash.split('?');
    const params = {};
    
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }
    
    return { path, params };
  }
  
  /**
   * Handle route change
   */
  async function handleRouteChange() {
    const { path, params } = parseHash();
    const route = routes[path];
    
    if (!route) {
      console.warn('Route not found:', path);
      navigate('/dashboard');
      return;
    }
    
    // Cleanup previous route
    if (currentCleanup) {
      try {
        currentCleanup();
      } catch (err) {
        console.error('Route cleanup error:', err);
      }
      currentCleanup = null;
    }
    
    // Update state
    State.set('currentRoute', path.slice(1)); // remove leading /
    
    // Update header
    const titleEl = document.getElementById('page-title');
    const backBtn = document.getElementById('btn-back');
    const bottomNav = document.getElementById('bottom-nav');
    
    if (titleEl) titleEl.textContent = route.title || 'مدیریت مرسولات';
    
    // Show/hide back button
    const isMainRoute = ['/dashboard', '/shipments', '/suppliers', '/settings', '/scan'].includes(path);
    if (backBtn) {
      backBtn.style.display = isMainRoute ? 'none' : 'flex';
    }
    
    // Show/hide bottom nav
    if (bottomNav) {
      if (route.hideNav) {
        bottomNav.classList.add('hidden');
      } else {
        bottomNav.classList.remove('hidden');
      }
      
      // Update active nav item
      bottomNav.querySelectorAll('.nav-item').forEach(item => {
        const routeName = item.getAttribute('data-route');
        const pathRoute = path.slice(1);
        if (routeName === pathRoute || 
            (pathRoute.startsWith('shipment-') && routeName === 'shipments')) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
    
    // Render view
    const viewRoot = document.getElementById('view-root');
    if (viewRoot && route.view) {
      try {
        viewRoot.innerHTML = '';
        const cleanup = await route.view(viewRoot, params);
        if (typeof cleanup === 'function') {
          currentCleanup = cleanup;
        }
      } catch (err) {
        console.error('Route render error:', err);
        viewRoot.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">خطا در نمایش صفحه</div></div>';
      }
    }
    
    // Scroll to top
    if (viewRoot) viewRoot.scrollTop = 0;
    
    // Call onEnter hook
    if (route.onEnter) {
      try {
        route.onEnter(params);
      } catch (err) {
        console.error('Route onEnter error:', err);
      }
    }
  }
  
  // ============================================
  // Initialization
  // ============================================
  
  function start() {
    // Listen to hash changes
    window.addEventListener('hashchange', handleRouteChange);
    
    // Handle initial route
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    } else {
      handleRouteChange();
    }
  }
  
  function stop() {
    window.removeEventListener('hashchange', handleRouteChange);
  }
  
  // ============================================
  // Public API
  // ============================================
  
  return {
    register,
    navigate,
    start,
    stop,
    parseHash
  };
  
})();