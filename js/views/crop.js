/**
 * Crop View
 * برش عکس قبل از اسکن بارکد
 */
window.Views = window.Views || {};
Views.Crop = (function() {
  'use strict';
  
  let canvas = null;
  let ctx = null;
  let img = null;
  let cropBox = { x: 0, y: 0, width: 0, height: 0 };
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  
  function render(root, params) {
    const imageUrl = params.imageUrl;
    
    if (!imageUrl) {
      Router.navigate('/scan');
      return null;
    }
    
    root.innerHTML = `
      <div class="crop-container">
        <div class="crop-guide">
          <div class="crop-guide-text">بارکد را در کادر قرار دهید</div>
        </div>
        
        <div class="crop-canvas-wrapper">
          <canvas id="crop-canvas"></canvas>
          <div id="crop-overlay" class="crop-overlay"></div>
        </div>
        
        <div class="crop-actions">
          <button id="btn-crop-cancel" class="btn btn-secondary btn-block">
            انصراف
          </button>
          <button id="btn-crop-scan" class="btn btn-primary btn-block btn-lg">
            🔍 اسکن بارکد
          </button>
        </div>
      </div>
    `;
    
    initCrop(imageUrl);
    
    return () => {
      // Cleanup
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }
  
  async function initCrop(imageUrl) {
    canvas = document.getElementById('crop-canvas');
    ctx = canvas.getContext('2d');
    
    img = new Image();
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });
    
    // Set canvas size (fit to screen)
    const maxWidth = window.innerWidth - 32;
    const maxHeight = window.innerHeight - 250;
    
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
      height = (height / width) * maxWidth;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width / height) * maxHeight;
      height = maxHeight;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Initialize crop box (center 80%)
    cropBox = {
      x: width * 0.1,
      y: height * 0.2,
      width: width * 0.8,
      height: height * 0.6
    };
    
    drawOverlay();
    attachEvents();
  }
  
  function drawOverlay() {
    const overlay = document.getElementById('crop-overlay');
    
    overlay.style.left = cropBox.x + 'px';
    overlay.style.top = cropBox.y + 'px';
    overlay.style.width = cropBox.width + 'px';
    overlay.style.height = cropBox.height + 'px';
  }
  
  function attachEvents() {
    const overlay = document.getElementById('crop-overlay');
    
    // Touch/mouse events for dragging
    overlay.addEventListener('touchstart', startDrag);
    overlay.addEventListener('mousedown', startDrag);
    
    document.addEventListener('touchmove', drag);
    document.addEventListener('mousemove', drag);
    
    document.addEventListener('touchend', endDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Buttons
    document.getElementById('btn-crop-cancel').addEventListener('click', () => {
      Router.navigate('/scan');
    });
    
    document.getElementById('btn-crop-scan').addEventListener('click', scanCroppedArea);
  }
  
  function startDrag(e) {
    isDragging = true;
    const touch = e.touches ? e.touches[0] : e;
    const rect = canvas.getBoundingClientRect();
    dragStart.x = touch.clientX - rect.left - cropBox.x;
    dragStart.y = touch.clientY - rect.top - cropBox.y;
    e.preventDefault();
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    const touch = e.touches ? e.touches[0] : e;
    const rect = canvas.getBoundingClientRect();
    
    let newX = touch.clientX - rect.left - dragStart.x;
    let newY = touch.clientY - rect.top - dragStart.y;
    
    // Constrain to canvas
    newX = Math.max(0, Math.min(canvas.width - cropBox.width, newX));
    newY = Math.max(0, Math.min(canvas.height - cropBox.height, newY));
    
    cropBox.x = newX;
    cropBox.y = newY;
    
    drawOverlay();
    e.preventDefault();
  }
  
  function endDrag() {
    isDragging = false;
  }
  
  async function scanCroppedArea() {
    // Get cropped area from original image
    const scaleX = img.width / canvas.width;
    const scaleY = img.height / canvas.height;
    
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    
    cropCanvas.width = cropBox.width * scaleX;
    cropCanvas.height = cropBox.height * scaleY;
    
    cropCtx.drawImage(
      img,
      cropBox.x * scaleX,
      cropBox.y * scaleY,
      cropBox.width * scaleX,
      cropBox.height * scaleY,
      0,
      0,
      cropCanvas.width,
      cropCanvas.height
    );
    
    // Show loading
    const btnScan = document.getElementById('btn-crop-scan');
    btnScan.textContent = '⏳ در حال اسکن...';
    btnScan.disabled = true;
    
    try {
      const detector = new BarcodeDetector();
      const barcodes = await detector.detect(cropCanvas);
      
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        Utils.vibrate(100);
        Utils.playBeep();
        
        Components.toastSuccess(`✅ بارکد پیدا شد: ${barcodes[0].rawValue}`);
        
        // Navigate to form
        Router.navigate('/shipment-new', { barcode: barcodes[0].rawValue });
      } else {
        throw new Error('بارکدی پیدا نشد');
      }
      
    } catch (err) {
      Components.toastError('بارکدی در این ناحیه پیدا نشد');
      btnScan.textContent = '🔍 اسکن بارکد';
      btnScan.disabled = false;
    }
  }
  
  return { render };
})();
