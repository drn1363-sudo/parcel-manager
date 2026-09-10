/**
 * Components Module
 * Reusable UI components: Toast, Modal, Confirm
 */
window.Components = (function() {
  'use strict';
  
  // ============================================
  // Toast Notifications
  // ============================================
  
  /**
   * Show a toast message
   * @param {string} message
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - ms
   */
  function toast(message, type = 'info', duration = 3000) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    
    const toastEl = Utils.createElement('div', {
      class: `toast toast-${type}`,
      text: message
    });
    
    root.appendChild(toastEl);
    
    setTimeout(() => {
      toastEl.classList.add('toast-out');
      setTimeout(() => {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      }, 200);
    }, duration);
  }
  
  function toastSuccess(message) {
    toast(message, 'success');
  }
  
  function toastError(message) {
    toast(message, 'error', 4000);
  }
  
  function toastWarning(message) {
    toast(message, 'warning');
  }
  
  // ============================================
  // Modal
  // ============================================
  
  let activeModal = null;
  
  /**
   * Show a modal
   * @param {object} options - { title, content, footer, onClose }
   * @returns {object} - { close, element }
   */
  function modal(options = {}) {
    const root = document.getElementById('modal-root');
    if (!root) return null;
    
    // Close any existing modal
    if (activeModal) {
      activeModal.close();
    }
    
    const modalEl = Utils.createElement('div', { class: 'modal-root active' });
    
    const backdrop = Utils.createElement('div', {
      class: 'modal-backdrop',
      onClick: () => {
        if (options.closeOnBackdrop !== false) {
          close();
        }
      }
    });
    
    const content = Utils.createElement('div', { class: 'modal-content' });
    
    if (options.title) {
      const header = Utils.createElement('div', { class: 'modal-header' }, [
        Utils.createElement('h2', { class: 'modal-title', text: options.title }),
        Utils.createElement('button', {
          class: 'btn-icon',
          text: '✕',
          onClick: close
        })
      ]);
      content.appendChild(header);
    }
    
    const body = Utils.createElement('div', { class: 'modal-body' });
    if (typeof options.content === 'string') {
      body.innerHTML = options.content;
    } else if (options.content instanceof HTMLElement) {
      body.appendChild(options.content);
    }
    content.appendChild(body);
    
    if (options.footer) {
      const footer = Utils.createElement('div', { class: 'modal-footer' });
      if (typeof options.footer === 'string') {
        footer.innerHTML = options.footer;
      } else if (options.footer instanceof HTMLElement) {
        footer.appendChild(options.footer);
      }
      content.appendChild(footer);
    }
    
    modalEl.appendChild(backdrop);
    modalEl.appendChild(content);
    root.appendChild(modalEl);
    
    function close() {
      if (modalEl.parentNode) {
        modalEl.parentNode.removeChild(modalEl);
      }
      if (options.onClose) {
        try { options.onClose(); } catch (e) {}
      }
      if (activeModal && activeModal.element === modalEl) {
        activeModal = null;
      }
    }
    
    activeModal = { close, element: modalEl };
    
    return { close, element: modalEl };
  }
  
  /**
   * Show a confirm dialog
   * @param {object} options - { title, message, confirmText, cancelText, danger }
   * @returns {Promise<boolean>}
   */
  function confirm(options = {}) {
    return new Promise((resolve) => {
      const message = Utils.createElement('p', {
        text: options.message || 'آیا مطمئن هستید؟',
        style: { marginBottom: '16px', lineHeight: '1.6' }
      });
      
      const footer = Utils.createElement('div', {
        style: { display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }
      });
      
      const cancelBtn = Utils.createElement('button', {
        class: 'btn btn-secondary',
        text: options.cancelText || 'انصراف'
      });
      
      const confirmBtn = Utils.createElement('button', {
        class: options.danger ? 'btn btn-danger' : 'btn btn-primary',
        text: options.confirmText || 'تأیید'
      });
      
      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);
      
      const m = modal({
        title: options.title || 'تأیید',
        content: message,
        footer: footer
      });
      
      cancelBtn.addEventListener('click', () => {
        m.close();
        resolve(false);
      });
      
      confirmBtn.addEventListener('click', () => {
        m.close();
        resolve(true);
      });
    });
  }
  
  /**
   * Show an alert dialog
   */
  function alert(options = {}) {
    return new Promise((resolve) => {
      const message = Utils.createElement('p', {
        text: options.message || '',
        style: { marginBottom: '16px', lineHeight: '1.6' }
      });
      
      const footer = Utils.createElement('div', {
        style: { display: 'flex', justifyContent: 'flex-end', width: '100%' }
      });
      
      const okBtn = Utils.createElement('button', {
        class: 'btn btn-primary',
        text: options.buttonText || 'باشه'
      });
      
      footer.appendChild(okBtn);
      
      const m = modal({
        title: options.title || 'توجه',
        content: message,
        footer: footer
      });
      
      okBtn.addEventListener('click', () => {
        m.close();
        resolve();
      });
    });
  }
  
  // ============================================
  // Public API
  // ============================================
  
  return {
    toast,
    toastSuccess,
    toastError,
    toastWarning,
    modal,
    confirm,
    alert
  };
  
})();