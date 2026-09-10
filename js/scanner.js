/**
 * Scanner Module
 * بارکد اسکنر با استفاده از BarcodeDetector API
 */
window.Scanner = (function() {
  'use strict';
  
  let videoElement = null;
  let stream = null;
  let scanInterval = null;
  let detector = null;
  let isScanning = false;
  let onScanSuccess = null;
  
  // ============================================
  // Check Browser Support
  // ============================================
  
  function isSupported() {
    return 'BarcodeDetector' in window;
  }
  
  async function getSupportedFormats() {
    if (!isSupported()) return [];
    try {
      return await BarcodeDetector.getSupportedFormats();
    } catch (e) {
      return [];
    }
  }
  
  // ============================================
  // Initialize Detector
  // ============================================
  
  async function initDetector() {
    if (!isSupported()) {
      throw new Error('BarcodeDetector not supported');
    }
    
    const formats = await getSupportedFormats();
    // Use all supported formats for best compatibility
    detector = new BarcodeDetector({ 
      formats: formats.length > 0 ? formats : undefined 
    });
  }
  
  // ============================================
  // Start Camera
  // ============================================
  
  async function startCamera(container) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('دوربین در این مرورگر پشتیبانی نمی‌شود');
    }
    
    // Create video element
    videoElement = document.createElement('video');
    videoElement.setAttribute('autoplay', '');
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('muted', '');
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.objectFit = 'cover';
    videoElement.style.borderRadius = '12px';
    videoElement.style.background = '#000';
    
    container.innerHTML = '';
    container.appendChild(videoElement);
    
    // Request camera (back camera preferred)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      videoElement.srcObject = stream;
      await videoElement.play();
    } catch (err) {
      throw new Error('دسترسی به دوربین رد شد. لطفاً مجوز دوربین را بدهید.');
    }
  }
  
  // ============================================
  // Stop Camera
  // ============================================
  
  function stopCamera() {
    isScanning = false;
    
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    
    if (videoElement) {
      videoElement.srcObject = null;
      videoElement = null;
    }
    
    detector = null;
  }
  
  // ============================================
  // Scan Loop
  // ============================================
  
  async function scanFrame() {
    if (!isScanning || !videoElement || !detector) return;
    
    // Check if video is ready
    if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
      return;
    }
    
    try {
      const barcodes = await detector.detect(videoElement);
      
      if (barcodes && barcodes.length > 0) {
        const barcode = barcodes[0];
        const rawValue = barcode.rawValue;
        
        if (rawValue) {
          // Success!
          Utils.vibrate(100);
          Utils.playBeep();
          
          // Stop scanning temporarily to prevent multiple scans
          isScanning = false;
          
          if (onScanSuccess) {
            onScanSuccess(rawValue);
          }
        }
      }
    } catch (err) {
      // Silently ignore scan errors (frame might be blurry etc.)
    }
  }
  
  // ============================================
  // Start Scanning
  // ============================================
  
  async function startScan(container, onSuccess) {
    onScanSuccess = onSuccess;
    
    // Initialize detector
    await initDetector();
    
    // Start camera
    await startCamera(container);
    
    // Start scan loop (every 200ms)
    isScanning = true;
    scanInterval = setInterval(scanFrame, 200);
  }
  
  // ============================================
  // Public API
  // ============================================
  
  return {
    isSupported,
    startScan,
    stopCamera
  };
  
})();
