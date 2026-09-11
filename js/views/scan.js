/**
 * Scan View
 */
window.Views = window.Views || {};
Views.Scan = (function() {
  'use strict';
  
  let isScanning = false;
  let scanInterval = null;
  
  function render(root) {
    const supported = Scanner.isSupported();
    
    root.innerHTML = `
      <div class="scan-container">
        
        ${!supported ? `
          <div class="alert alert-warning">
            <div class="alert-icon">⚠️</div>
            <div class="alert-text">
              <strong>مرورگر شما از اسکن بارکد پشتیبانی نمی‌کند.</strong>
              <p>لطفاً iOS را به‌روزرسانی کنید یا بارکد را دستی وارد کنید.</p>
            </div>
          </div>
        ` : ''}
        
        <div class="scan-guide">
          <div class="scan-guide-icon">📷</div>
          <h2 class="scan-guide-title">اسکن بارکد</h2>
          <p class="scan-guide-text">بارکد روی بسته را جلوی دوربین بگیرید</p>
        </div>
        
        <div id="camera-container" class="camera-container">
          <div class="camera-placeholder">
            <div class="camera-placeholder-icon">📷</div>
            <div class="camera-placeholder-text">در حال آماده‌سازی دوربین...</div>
          </div>
        </div>
        
        <div class="scan-manual">
          <div class="divider-text">یا</div>
          <button id="btn-manual-entry" class="btn btn-secondary btn-block">
            ✍️ ورود دستی بارکد
          </button>
        </div>
        
      </div>
    `;
    
    if (supported) {
      startScanning();
    }
    
    document.getElementById('btn-manual-entry').addEventListener('click', showManualEntry);
    
    return () => {
      stopScanning();
      Scanner.stopCamera();
    };
  }
  
  function startScanning() {
    const container = document.getElementById('camera-container');
    if (!container) return;
    
    Scanner.startScan(container, handleBarcodeScanned)
      .then(() => {
        isScanning = true;
      })
      .catch(err => {
        container.innerHTML = `
          <div class="camera-error">
            <div class="camera-error-icon">⚠️</div>
            <div class="camera-error-text">${Utils.escapeHtml(err.message)}</div>
            <button id="btn-retry-camera" class="btn btn-primary">تلاش مجدد</button>
          </div>
        `;
        
        document.getElementById('btn-retry-camera').addEventListener('click', () => {
          container.innerHTML = `
            <div class="camera-placeholder">
              <div class="camera-placeholder-icon">📷</div>
              <div class="camera-placeholder-text">در حال آماده‌سازی دوربین...</div>
            </div>
          `;
          startScanning();
        });
      });
  }
  
  function stopScanning() {
    isScanning = false;
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
  }
  
  function handleBarcodeScanned(barcode) {
    const normalized = Utils.normalizeBarcode(barcode);
    const existing = State.getShipmentByBarcode(normalized);
    
    if (existing) {
      showDuplicateWarning(existing, normalized);
    } else {
      Router.navigate('/shipment-new', { barcode: normalized });
    }
  }
  
  function showDuplicateWarning(existing, barcode) {
    stopScanning();
    Scanner.stopCamera();
    
    const supplier = State.getSupplier(existing.supplierId);
    const supplierName = supplier ? supplier.name : 'نامشخص';
    
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="duplicate-info">
        <p style="margin-bottom: 12px;">این بارکد قبلاً ثبت شده است:</p>
        <div class="info-box">
          <div><strong>بارکد:</strong> <span dir="ltr">${Utils.escapeHtml(barcode)}</span></div>
          <div><strong>فروشگاه:</strong> ${Utils.escapeHtml(supplierName)}</div>
          <div><strong>تاریخ دریافت:</strong> ${Utils.formatDateTime(existing.receivedAt)}</div>
          <div><strong>وضعیت:</strong> ${Utils.getStatusIcon(existing.status)} ${Utils.getStatusLabel(existing.status)}</div>
        </div>
      </div>
    `;
    
    const footer = document.createElement('div');
    footer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; width: 100%; flex-wrap: wrap;';
    
    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn btn-ghost';
    continueBtn.textContent = 'ادامه اسکن';
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-secondary';
    viewBtn.textContent = 'مشاهده';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary';
    editBtn.textContent = 'ویرایش';
    
    footer.appendChild(continueBtn);
    footer.appendChild(viewBtn);
    footer.appendChild(editBtn);
    
    const modal = Components.modal({
      title: '⚠️ بارکد تکراری',
      content: content,
      footer: footer
    });
    
    viewBtn.addEventListener('click', () => {
      modal.close();
      Router.navigate('/shipment-detail', { id: existing.id });
    });
    
    editBtn.addEventListener('click', () => {
      modal.close();
      Router.navigate('/shipment-edit', { id: existing.id });
    });
    
    continueBtn.addEventListener('click', () => {
      modal.close();
      // Restart camera and scanning
      const container = document.getElementById('camera-container');
      if (container) {
        container.innerHTML = `
          <div class="camera-placeholder">
            <div class="camera-placeholder-icon">📷</div>
            <div class="camera-placeholder-text">در حال آماده‌سازی دوربین...</div>
          </div>
        `;
        startScanning();
      }
    });
  }
  
  function showManualEntry() {
    stopScanning();
    Scanner.stopCamera();
    
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">شماره بارکد / مرسوله</label>
        <input type="text" id="manual-barcode" class="form-input" 
               placeholder="مثلاً: 123456789" 
               autocomplete="off" autocorrect="off" dir="ltr"
               style="text-align: left; font-family: monospace; font-size: 18px;">
        <div class="form-hint">شماره را وارد کنید یا از پیامک کپی کنید</div>
      </div>
    `;
    
    const footer = document.createElement('div');
    footer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; width: 100%;';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'انصراف';
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'ادامه';
    
    footer.appendChild(cancelBtn);
    footer.appendChild(submitBtn);
    
    const modal = Components.modal({
      title: '✍️ ورود دستی بارکد',
      content: content,
      footer: footer
    });
    
    setTimeout(() => {
      const input = document.getElementById('manual-barcode');
      if (input) {
        input.focus();
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') submitBtn.click();
        });
      }
    }, 100);
    
    cancelBtn.addEventListener('click', () => {
      modal.close();
      const container = document.getElementById('camera-container');
      if (container) {
        container.innerHTML = `
          <div class="camera-placeholder">
            <div class="camera-placeholder-icon">📷</div>
            <div class="camera-placeholder-text">در حال آماده‌سازی دوربین...</div>
          </div>
        `;
        startScanning();
      }
    });
    
    submitBtn.addEventListener('click', () => {
      const input = document.getElementById('manual-barcode');
      const barcode = Utils.normalizeBarcode(input.value);
      
      if (!barcode) {
        Components.toastWarning('لطفاً شماره بارکد را وارد کنید');
        return;
      }
      
      modal.close();
      handleBarcodeScanned(barcode);
    });
  }
  
  return { render };
})();
