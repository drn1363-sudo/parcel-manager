/**
 * Settings View
 * صفحه تنظیمات
 */
window.Views = window.Views || {};
Views.Settings = (function() {
  'use strict';
  
  function render(root) {
    const theme = State.get('theme') || 'light';
    const shipments = State.get('shipments');
    const suppliers = State.get('suppliers');
    
    root.innerHTML = `
      <div class="settings-page">
        
        <!-- Theme -->
        <div class="settings-group">
          <h3 class="settings-group-title">🎨 ظاهر</h3>
          
          <div class="settings-item">
            <div class="settings-item-label">حالت نمایش</div>
            <div class="theme-selector">
              <button class="theme-btn ${theme === 'light' ? 'active' : ''}" data-theme="light">
                ☀️ روشن
              </button>
              <button class="theme-btn ${theme === 'dark' ? 'active' : ''}" data-theme="dark">
                🌙 تاریک
              </button>
              <button class="theme-btn ${theme === 'system' ? 'active' : ''}" data-theme="system">
                📱 خودکار
              </button>
            </div>
          </div>
        </div>
        
        <!-- Data Info -->
        <div class="settings-group">
          <h3 class="settings-group-title">📊 اطلاعات داده‌ها</h3>
          
          <div class="settings-item">
            <div class="settings-item-label">تعداد مرسولات</div>
            <div class="settings-item-value">${shipments.length}</div>
          </div>
          
          <div class="settings-item">
            <div class="settings-item-label">تعداد فروشگاه‌ها</div>
            <div class="settings-item-value">${suppliers.length}</div>
          </div>
        </div>
        
        <!-- Export -->
        <div class="settings-group">
          <h3 class="settings-group-title">📤 خروجی</h3>
          
          <button id="btn-export-csv" class="btn btn-secondary btn-block settings-action">
            📊 خروجی CSV (Excel)
          </button>
          
          <button id="btn-backup" class="btn btn-secondary btn-block settings-action">
            💾 پشتیبان‌گیری (Backup JSON)
          </button>
        </div>
        
        <!-- Import -->
        <div class="settings-group">
          <h3 class="settings-group-title">📥 ورودی</h3>
          
          <label class="btn btn-secondary btn-block settings-action" style="cursor: pointer;">
            📂 بازیابی از فایل (Restore)
            <input type="file" id="btn-restore" accept=".json" style="display: none;">
          </label>
        </div>
        
        <!-- Danger Zone -->
        <div class="settings-group settings-danger">
          <h3 class="settings-group-title">⚠️ منطقه خطر</h3>
          
          <button id="btn-clear-all" class="btn btn-danger btn-block settings-action">
            🗑️ پاک کردن تمام اطلاعات
          </button>
        </div>
        
        <!-- About -->
        <div class="settings-group">
          <h3 class="settings-group-title">ℹ️ درباره برنامه</h3>
          
          <div class="settings-item">
            <div class="settings-item-label">نام برنامه</div>
            <div class="settings-item-value">مدیریت مرسولات</div>
          </div>
          
          <div class="settings-item">
            <div class="settings-item-label">نسخه</div>
            <div class="settings-item-value">1.0.0</div>
          </div>
          
          <div class="settings-item">
            <div class="settings-item-label">ذخیره‌سازی</div>
            <div class="settings-item-value">محلی (IndexedDB)</div>
          </div>
          
          <div class="settings-item">
            <div class="settings-item-label">حالت</div>
            <div class="settings-item-value">آفلاین</div>
          </div>
        </div>
        
      </div>
    `;
    
    attachEvents();
    return null;
  }
  
  function attachEvents() {
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const theme = btn.getAttribute('data-theme');
        
        document.documentElement.setAttribute('data-theme', theme);
        State.set('theme', theme);
        await DB.setSetting('theme', theme);
        
        // Update meta theme color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
          const isDark = theme === 'dark' || 
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
          metaTheme.setAttribute('content', isDark ? '#0f172a' : '#0ea5e9');
        }
        
        // Update active state
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        Components.toastSuccess('حالت نمایش تغییر کرد');
      });
    });
    
    // Export CSV
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    
    // Backup
    document.getElementById('btn-backup').addEventListener('click', backupData);
    
    // Restore
    document.getElementById('btn-restore').addEventListener('change', restoreData);
    
    // Clear all
    document.getElementById('btn-clear-all').addEventListener('click', clearAllData);
  }
  
  // ============================================
  // Export CSV
  // ============================================
  
  function exportCSV() {
    const shipments = State.get('shipments');
    const suppliers = State.get('suppliers');
    
    if (shipments.length === 0) {
      Components.toastWarning('هیچ مرسوله‌ای برای خروجی وجود ندارد');
      return;
    }
    
    // BOM for Excel UTF-8
    let csv = '\uFEFF';
    
    // Header
    csv += 'ردیف,بارکد,فروشگاه,فرستنده,شهر,تماس,تاریخ ارسال,ساعت ارسال,تاریخ دریافت,ساعت دریافت,شرکت حمل,محتویات,تعداد اقلام,وضعیت,توضیحات,تاریخ ایجاد,تاریخ ویرایش\n';
    
    // Rows
    shipments.forEach(s => {
      const supplier = suppliers.find(sup => sup.id === s.supplierId);
      const supplierName = supplier ? supplier.name : '';
      const city = supplier ? (supplier.city || '') : '';
      const phone = supplier ? (supplier.phone || '') : '';
      
      const sentDate = s.sentAt ? Utils.formatDate(s.sentAt) : '';
      const sentTime = s.sentAt ? Utils.formatTime(s.sentAt) : '';
      const receivedDate = s.receivedAt ? Utils.formatDate(s.receivedAt) : '';
      const receivedTime = s.receivedAt ? Utils.formatTime(s.receivedAt) : '';
      const createdDate = s.createdAt ? Utils.formatDateTime(s.createdAt) : '';
      const updatedDate = s.updatedAt ? Utils.formatDateTime(s.updatedAt) : '';
      
      csv += [
        s.displayIndex,
        escapeCSV(s.barcode),
        escapeCSV(supplierName),
        escapeCSV(s.senderName || ''),
        escapeCSV(city),
        escapeCSV(phone),
        escapeCSV(sentDate),
        escapeCSV(sentTime),
        escapeCSV(receivedDate),
        escapeCSV(receivedTime),
        escapeCSV(s.carrier || ''),
        escapeCSV(s.contents || ''),
        s.itemCount || 0,
        escapeCSV(Utils.getStatusLabel(s.status)),
        escapeCSV(s.notes || ''),
        escapeCSV(createdDate),
        escapeCSV(updatedDate)
      ].join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, getFileName('shipments', '.csv'));
    
    Components.toastSuccess(`${shipments.length} مرسوله خروجی گرفته شد`);
  }
  
  function escapeCSV(str) {
    if (!str) return '';
    str = String(str);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
  
  // ============================================
  // Backup
  // ============================================
  
  async function backupData() {
    try {
      Components.toast('در حال تهیه پشتیبان...', 'info');
      
      const backupData = await DB.exportAll();
      const json = JSON.stringify(backupData, null, 2);
      
      const blob = new Blob([json], { type: 'application/json' });
      downloadFile(blob, getFileName('backup', '.json'));
      
      // Update last backup time
      await DB.setSetting('lastBackupAt', Utils.nowISO());
      
      Components.toastSuccess('پشتیبان‌گیری انجام شد ✅');
      
    } catch (err) {
      console.error('Backup error:', err);
      Components.toastError('خطا در پشتیبان‌گیری');
    }
  }
  
  // ============================================
  // Restore
  // ============================================
  
  async function restoreData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset input so same file can be selected again
    e.target.value = '';
    
    const confirmed = await Components.confirm({
      title: '⚠️ بازیابی اطلاعات',
      message: 'تمام اطلاعات فعلی (مرسولات، فروشگاه‌ها و تنظیمات) پاک شده و با اطلاعات فایل پشتیبان جایگزین می‌شود.\n\nآیا مطمئن هستید؟',
      confirmText: 'بازیابی',
      cancelText: 'انصراف',
      danger: true
    });
    
    if (!confirmed) return;
    
    try {
      Components.toast('در حال بازیابی...', 'info');
      
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Validate
      if (!backupData.data) {
        throw new Error('فایل پشتیبان نامعتبر است');
      }
      
      await DB.importAll(backupData);
      await State.loadShipments();
      await State.loadSuppliers();
      await State.loadSettings();
      
      Components.toastSuccess('بازیابی انجام شد ✅');
      
      // Reload page to apply settings
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      console.error('Restore error:', err);
      Components.toastError('خطا در بازیابی: ' + err.message);
    }
  }
  
  // ============================================
  // Clear All
  // ============================================
  
  async function clearAllData() {
  const shipments = State.get('shipments');
  const suppliers = State.get('suppliers');
  
  if (shipments.length === 0 && suppliers.length === 0) {
    Components.toastWarning('هیچ اطلاعاتی برای پاک کردن وجود ندارد');
    return;
  }
  
  const confirmed1 = await Components.confirm({
    title: '🗑️ پاک کردن تمام اطلاعات',
    message: `شما ${shipments.length} مرسوله و ${suppliers.length} فروشگاه دارید.\n\nتمام اطلاعات برای همیشه پاک خواهد شد!\n\nآیا واقعاً مطمئن هستید؟`,
    confirmText: 'بله، مطمئنم',
    cancelText: 'انصراف',
    danger: true
  });
  
  if (!confirmed1) return;
  
  const content = document.createElement('div');
  content.innerHTML = `
    <p style="margin-bottom: 12px; line-height: 1.6;">
      برای تأیید نهایی، عبارت <strong>پاک کن</strong> را در کادر زیر تایپ کنید:
    </p>
    <input type="text" id="confirm-clear-input" class="form-input" 
           placeholder="پاک کن" autocomplete="off">
  `;
  
  const footer = document.createElement('div');
  footer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; width: 100%;';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'انصراف';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'حذف همه';
  deleteBtn.disabled = true;
  
  footer.appendChild(cancelBtn);
  footer.appendChild(deleteBtn);
  
  const modal = Components.modal({
    title: '⚠️ تأیید نهایی حذف',
    content: content,
    footer: footer
  });
  
  const input = document.getElementById('confirm-clear-input');
  input.addEventListener('input', () => {
    deleteBtn.disabled = input.value.trim() !== 'پاک کن';
  });
  
  cancelBtn.addEventListener('click', () => modal.close());
  
  deleteBtn.addEventListener('click', async () => {
    try {
      console.log('Clearing all data...');
      
      // Clear all stores one by one
      await DB.clear(DB.STORES.SHIPMENTS);
      console.log('✅ Shipments cleared');
      
      await DB.clear(DB.STORES.SUPPLIERS);
      console.log('✅ Suppliers cleared');
      
      await DB.clear(DB.STORES.STATUS_HISTORY);
      console.log('✅ Status history cleared');
      
      await DB.clear(DB.STORES.PHOTOS);
      console.log('✅ Photos cleared');
      
      // Keep settings but reset nextDisplayIndex
      await DB.setSetting('nextDisplayIndex', 1);
      console.log('✅ Settings reset');
      
      // Reload state
      await State.loadShipments();
      await State.loadSuppliers();
      await State.loadSettings();
      console.log('✅ State reloaded');
      
      modal.close();
      Components.toastSuccess('تمام اطلاعات پاک شد');
      
      // Re-render settings
      setTimeout(() => {
        const viewRoot = document.getElementById('view-root');
        Views.Settings.render(viewRoot);
      }, 500);
      
    } catch (err) {
      console.error('❌ Clear error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      Components.toastError('خطا در پاک کردن: ' + err.message);
    }
  });
  
  setTimeout(() => input.focus(), 100);
}
  
  // ============================================
  // Helpers
  // ============================================
  
  function getFileName(prefix, ext) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
    return `${prefix}-${date}-${time}${ext}`;
  }
  
  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  return { render };
})();
