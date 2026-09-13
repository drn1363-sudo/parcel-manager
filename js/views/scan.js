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
          <p class="scan-guide-text">بارکد را اسکن کنید یا از گالری انتخاب کنید</p>
        </div>
        
        <div id="camera-container" class="camera-container">
          <div class="camera-placeholder">
            <div class="camera-placeholder-icon">📷</div>
            <div class="camera-placeholder-text">در حال آماده‌سازی دوربین...</div>
          </div>
        </div>
        
        <!-- Alternative Methods -->
        <div class="scan-alternatives">
          <div class="divider-text">یا</div>
          
          <div class="alternative-buttons">
            <button id="btn-gallery" class="btn btn-secondary btn-block alternative-btn">
              🖼️ انتخاب از گالری
            </button>
            
            <button id="btn-manual-entry" class="btn btn-secondary btn-block alternative-btn">
              ✍️ ورود دستی بارکد
            </button>
          </div>
        </div>
        
        <!-- Hidden file input for gallery -->
        <input type="file" id="gallery-input" accept="image/*" style="display: none;">
        
      </div>
    `;
    
    if (supported) {
      startScanning();
    }
    
    document.getElementById('btn-manual-entry').addEventListener('click', showManualEntry);
    document.getElementById('btn-gallery').addEventListener('click', () => {
      document.getElementById('gallery-input').click();
    });
    document.getElementById('gallery-input').addEventListener('change', handleGalleryImage);
    
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
  
  // ============================================
  // Gallery Image Scan
  // ============================================
  
async function handleGalleryImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  e.target.value = '';
  
  stopScanning();
  Scanner.stopCamera();
  
  const container = document.getElementById('camera-container');
  const originalContent = container.innerHTML;
  container.innerHTML = `
    <div class="camera-placeholder">
      <div class="loading-spinner"></div>
      <div class="camera-placeholder-text">در حال بررسی عکس...</div>
    </div>
  `;
  
  try {
    // Load image
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('خطا در بارگذاری عکس'));
      img.src = imageUrl;
    });
    
    console.log('Original image size:', img.width, 'x', img.height);
    
    // Create canvas for preprocessing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize if too large (max 2000px)
    const maxSize = 2000;
    let width = img.width;
    let height = img.height;
    
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = (height / width) * maxSize;
        width = maxSize;
      } else {
        width = (width / height) * maxSize;
        height = maxSize;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw image on canvas (this also fixes orientation)
    ctx.drawImage(img, 0, 0, width, height);
    
    // Clean up
    URL.revokeObjectURL(imageUrl);
    
    console.log('Resized image:', width, 'x', height);
    
    // Try to detect barcode
    if (!Scanner.isSupported()) {
      throw new Error('مرورگر از تشخیص بارکد پشتیبانی نمی‌کند');
    }
    
    const detector = new BarcodeDetector();
    
    // Try detection on canvas
    let barcodes = await detector.detect(canvas);
    
    console.log('Detection attempt 1:', barcodes.length, 'barcodes found');
    
    // If not found, try with enhanced contrast
    if (barcodes.length === 0) {
      console.log('Trying with enhanced contrast...');
      
      // Apply contrast enhancement
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // Enhance contrast
        const enhanced = gray < 128 ? gray * 0.7 : gray * 1.3;
        const clamped = Math.max(0, Math.min(255, enhanced));
        
        data[i] = clamped;
        data[i + 1] = clamped;
        data[i + 2] = clamped;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      barcodes = await detector.detect(canvas);
      console.log('Detection attempt 2 (enhanced):', barcodes.length, 'barcodes found');
    }
    
    if (barcodes && barcodes.length > 0) {
      const barcode = barcodes[0];
      const rawValue = barcode.rawValue;
      
      if (rawValue) {
        console.log('✅ Barcode detected:', rawValue, 'Format:', barcode.format);
        
        Utils.vibrate(100);
        Utils.playBeep();
        
        Components.toastSuccess(`✅ بارکد پیدا شد: ${rawValue}`);
        
        container.innerHTML = originalContent;
        handleBarcodeScanned(rawValue);
        return;
      }
    }
    
    // No barcode found
    throw new Error('بارکدی در این عکس پیدا نشد');
    
  } catch (err) {
    console.error('Gallery scan error:', err);
    
    container.innerHTML = `
      <div class="camera-error">
        <div class="camera-error-icon">⚠️</div>
        <div class="camera-error-text">${Utils.escapeHtml(err.message)}</div>
        <div class="camera-error-tips">
          <p style="font-size: 12px; margin-top: 8px; text-align: right;">
            💡 <strong>نکات برای عکس بهتر:</strong><br>
            • بارکد واضح و کامل باشد<br>
            • نور کافی باشد<br>
            • بارکد صاف و بدون زاویه باشد<br>
            • فاصله مناسب (نه خیلی نزدیک)
          </p>
        </div>
        <div class="camera-error-buttons">
          <button id="btn-retry-gallery" class="btn btn-primary">تلاش مجدد</button>
          <button id="btn-back-to-camera" class="btn btn-secondary">بازگشت به دوربین</button>
        </div>
      </div>
    `;
    
    document.getElementById('btn-retry-gallery').addEventListener('click', () => {
      document.getElementById('gallery-input').click();
    });
    
    document.getElementById('btn-back-to-camera').addEventListener('click', () => {
      container.innerHTML = `
        <div class="camera-placeholder">
          <div class="camera-placeholder-icon">📷</div>
          <div class="camera-placeholder-text">در حال آماده‌سازی دوربین...</div>
        </div>
      `;
      startScanning();
    });
  }
}
  // ============================================
  // Barcode Handling
  // ============================================
  
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
  
  // ============================================
  // Manual Entry
  // ============================================
  
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
