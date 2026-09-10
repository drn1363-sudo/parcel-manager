/**
 * Utils Module
 * Helper functions: dates, UUID, debounce, etc.
 */
window.Utils = (function() {
  'use strict';
  
  // ============================================
  // UUID Generation
  // ============================================
  
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // ============================================
  // Date & Time (Persian/Jalali via Intl API)
  // ============================================
  
  // Persian date formatter (cached)
  const persianDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const persianDateTimeFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const persianTimeFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  /**
   * Format a Date object or ISO string to Persian date
   * @param {Date|string} date
   * @returns {string} e.g. "1405/06/19"
   */
  function formatDate(date) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    // Replace English digits with Persian and slashes
    return persianDateFormatter.format(d).replace(/[٬]/g, '');
  }
  
  /**
   * Format to Persian date + time
   * @param {Date|string} date
   * @returns {string} e.g. "1405/06/19 - 09:42"
   */
  function formatDateTime(date) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return persianDateTimeFormatter.format(d).replace(/[٬]/g, '');
  }
  
  /**
   * Format time only
   */
  function formatTime(date) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return persianTimeFormatter.format(d).replace(/[٬]/g, '');
  }
  
  /**
   * Get current time as ISO string
   */
  function nowISO() {
    return new Date().toISOString();
  }
  
  /**
   * Check if a date is today
   */
  function isToday(date) {
    if (!date) return false;
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  }
  
  /**
   * Check if date is within this month
   */
  function isThisMonth(date) {
    if (!date) return false;
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth();
  }
  
  /**
   * Get start of today as Date
   */
  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  /**
   * Get start of this month
   */
  function startOfMonth() {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  // ============================================
  // String Utilities
  // ============================================
  
  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  /**
   * Normalize barcode string (trim, remove spaces)
   */
  function normalizeBarcode(str) {
    if (!str) return '';
    return String(str).trim().replace(/\s+/g, '');
  }
  
  /**
   * Debounce function
   */
  function debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  
  /**
   * Throttle function
   */
  function throttle(fn, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  // ============================================
  // DOM Utilities
  // ============================================
  
  /**
   * Create element with attributes and children
   */
  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') el.className = value;
      else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      }
      else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      }
      else if (key === 'html') el.innerHTML = value;
      else if (key === 'text') el.textContent = value;
      else el.setAttribute(key, value);
    });
    children.forEach(child => {
      if (child) {
        if (typeof child === 'string') el.appendChild(document.createTextNode(child));
        else el.appendChild(child);
      }
    });
    return el;
  }
  
  /**
   * Vibrate device (if supported)
   */
  function vibrate(pattern = 100) {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }
  
  /**
   * Play a short beep sound (base64 embedded)
   */
  let beepAudio = null;
  function playBeep() {
    try {
      if (!beepAudio) {
        // Short beep sound (base64 encoded)
        beepAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgipW0lGQ5O2l9lcBvYEhwfI+1a2I6PWKIj7p1XzpAY3eLw3lqOjdgiZC9mGdCP2yDkcN6bDk1X4eOvJdpRUFuhZPEe205NV+GjbyUaUVBboWTxHttOTVfho28lGlFQW6Fk8R7bTk1X4aNvJRpRUFuhZPEe205NV+GjbyUaUVBboWTxHttOTVfho28lGlFQW6Fk8R7bTk1X4aNvJRpRUFuhQ==');
      }
      beepAudio.currentTime = 0;
      beepAudio.play().catch(() => {});
    } catch (e) {}
  }
  
  // ============================================
  // Status Helpers
  // ============================================
  
  const STATUS = {
    PENDING: 'pending',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    PROBLEM: 'problem',
    RETURNED: 'returned',
    CANCELLED: 'cancelled'
  };
  
  const STATUS_LABELS = {
    pending: 'در انتظار ارسال',
    shipping: 'در مسیر',
    delivered: 'تحویل شده',
    problem: 'مشکل‌دار',
    returned: 'برگشتی',
    cancelled: 'لغو شده'
  };
  
  const STATUS_ICONS = {
    pending: '⏳',
    shipping: '🚚',
    delivered: '✅',
    problem: '⚠️',
    returned: '↩️',
    cancelled: '❌'
  };
  
  function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
  }
  
  function getStatusIcon(status) {
    return STATUS_ICONS[status] || '📦';
  }
  
  // ============================================
  // Public API
  // ============================================
  
  return {
    generateId,
    formatDate,
    formatDateTime,
    formatTime,
    nowISO,
    isToday,
    isThisMonth,
    startOfToday,
    startOfMonth,
    escapeHtml,
    normalizeBarcode,
    debounce,
    throttle,
    createElement,
    vibrate,
    playBeep,
    STATUS,
    STATUS_LABELS,
    STATUS_ICONS,
    getStatusLabel,
    getStatusIcon
  };
  
})();