/**
 * Scanner Module
 */
window.Scanner = (function() {
  'use strict';
  
  let videoElement = null;
  let stream = null;
  let scanInterval = null;
  let detector = null;
  let isScanning = false;
  let onScanSuccess = null;
  
  function isSupported() {
    return 'BarcodeDetector' in window;
  }
  
  async function getSupportedFormats() {
    if (!isSupported()) return [];
    try {
      const formats = await BarcodeDetector.getSupportedFormats();
      console.log('Supported barcode formats:', formats);
      return formats;
    } catch (e) {
      console.error('Error getting supported formats:', e);
      return [];
    }
  }
  
  async function initDetector() {
    if (!isSupported()) {
      throw new Error('BarcodeDetector not supported');
    }
    
    const formats = await getSupportedFormats();
    detector = new BarcodeDetector({ 
      formats: formats.length > 0 ? formats : undefined 
    });
    console.log('✅ BarcodeDetector initialized');
  }
  
  async function startCamera(container) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('دوربین در این مرورگر پشتیبانی نمی‌شود');
    }
    
    console.log('Starting camera...');
    
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
    
    try {
      console.log('Requesting camera permission...');
      
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      console.log('✅ Camera stream received');
      
      videoElement.srcObject = stream;
      
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded');
          resolve();
        };
        videoElement.onerror = (e) => {
          console.error('❌ Video error:', e);
          reject(new Error('خطا در راه‌اندازی دوربین'));
        };
        setTimeout(() => reject(new Error('Timeout loading video')), 10000);
      });
      
      await videoElement.play();
      console.log('✅ Video playing');
      
    } catch (err) {
      console.error('❌ Camera error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      
      if (err.name === 'NotAllowedError') {
        throw new Error('دسترسی به دوربین رد شد. لطفاً در Settings → Safari → Camera مجوز بدهید.');
      } else if (err.name === 'NotFoundError') {
        throw new Error('دوربین یافت نشد');
      } else if (err.name === 'NotReadableError') {
        throw new Error('دوربین در حال استفاده توسط برنامه دیگری است');
      } else {
        throw new Error('خطا در دسترسی به دوربین: ' + err.message);
      }
    }
  }
  
  function stopCamera() {
    console.log('Stopping camera...');
    isScanning = false;
    
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped');
      });
      stream = null;
    }
    
    if (videoElement) {
      videoElement.srcObject = null;
      videoElement = null;
    }
    
    detector = null;
    console.log('✅ Camera stopped');
  }
  
  async function scanFrame() {
    if (!isScanning || !videoElement || !detector) return;
    
    if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
      return;
    }
    
    try {
      const barcodes = await detector.detect(videoElement);
      
      if (barcodes && barcodes.length > 0) {
        const barcode = barcodes[0];
        const rawValue = barcode.rawValue;
        
        if (rawValue) {
          console.log('✅ Barcode detected:', rawValue);
          
          Utils.vibrate(100);
          Utils.playBeep();
          
          isScanning = false;
          
          if (onScanSuccess) {
            onScanSuccess(rawValue);
          }
        }
      }
    } catch (err) {
      // Silently ignore
    }
  }
  
  async function startScan(container, onSuccess) {
    console.log('Starting scan...');
    onScanSuccess = onSuccess;
    
    try {
      await initDetector();
      await startCamera(container);
      
      isScanning = true;
      scanInterval = setInterval(scanFrame, 200);
      console.log('✅ Scanning started');
      
    } catch (err) {
      console.error('❌ Start scan error:', err);
      throw err;
    }
  }
  
  return {
    isSupported,
    startScan,
    stopCamera
  };
  
})();
