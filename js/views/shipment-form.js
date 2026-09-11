/**
 * Shipment Form View
 */
window.Views = window.Views || {};
Views.ShipmentForm = (function() {
  'use strict';
  
  let currentShipment = null;
  let isEditMode = false;
  
  function render(root, params) {
    const shipmentId = params.id;
    const barcodeFromScan = params.barcode;
    const supplierIdFromNav = params.supplierId;
    
    isEditMode = !!shipmentId;
    currentShipment = isEditMode ? State.getShipment(shipmentId) : null;
    
    const defaults = {
      barcode: barcodeFromScan || (currentShipment ? currentShipment.barcode : ''),
      supplierId: supplierIdFromNav || (currentShipment ? currentShipment.supplierId : ''),
      senderName: currentShipment ? currentShipment.senderName || '' : '',
      carrier: currentShipment ? currentShipment.carrier || '' : '',
      contents: currentShipment ? currentShipment.contents || '' : '',
      itemCount: currentShipment ? (currentShipment.itemCount || '') : '',
      status: currentShipment ? currentShipment.status : Utils.STATUS.DELIVERED,
      notes: currentShipment ? currentShipment.notes || '' : '',
      sentAt: currentShipment && currentShipment.sentAt 
        ? toLocalDateTimeInput(currentShipment.sentAt) 
        : '',
      receivedAt: currentShipment && currentShipment.receivedAt 
        ? toLocalDateTimeInput(currentShipment.receivedAt) 
        : toLocalDateTimeInput(new Date().toISOString())
    };
    
    root.innerHTML = `
      <form id="shipment-form" class="shipment-form">
        
        <div class="form-group">
          <label class="form-label">شماره بارکد / مرسوله *</label>
          <input type="text" id="f-barcode" class="form-input" 
                 value="${Utils.escapeHtml(defaults.barcode)}" 
                 required autocomplete="off" dir="ltr"
                 style="text-align: left; font-family: monospace;">
        </div>
        
        <div class="form-group">
          <label class="form-label">فروشگاه / تأمین‌کننده</label>
          <div class="autocomplete-wrapper">
            <input type="text" id="f-supplier-search" class="form-input" 
                   placeholder="جستجو یا انتخاب فروشگاه..." 
                   autocomplete="off"
                   value="${getSupplierName(defaults.supplierId)}">
            <input type="hidden" id="f-supplier-id" value="${defaults.supplierId}">
            <div id="supplier-suggestions" class="autocomplete-suggestions"></div>
          </div>
          <button type="button" id="btn-new-supplier" class="btn-link">
            + افزودن فروشگاه جدید
          </button>
        </div>
        
        <div class="form-group">
          <label class="form-label">نام ارسال‌کننده</label>
          <input type="text" id="f-sender" class="form-input" 
                 value="${Utils.escapeHtml(defaults.senderName)}" 
                 placeholder="اختیاری">
        </div>
        
        <div class="form-group">
          <label class="form-label">وضعیت</label>
          <select id="f-status" class="form-select">
            ${Object.entries(Utils.STATUS_LABELS).map(([key, label]) => 
              `<option value="${key}" ${defaults.status === key ? 'selected' : ''}>
                ${Utils.getStatusIcon(key)} ${label}
              </option>`
            ).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">تاریخ و ساعت دریافت</label>
          <input type="datetime-local" id="f-received-at" class="form-input" 
                 value="${defaults.receivedAt}" dir="ltr" style="text-align: left;">
        </div>
        
        <div class="form-group">
          <label class="form-label">تاریخ و ساعت ارسال</label>
          <input type="datetime-local" id="f-sent-at" class="form-input" 
                 value="${defaults.sentAt}" dir="ltr" style="text-align: left;">
        </div>
        
        <div class="form-group">
          <label class="form-label">شرکت حمل / پست</label>
          <input type="text" id="f-carrier" class="form-input" 
                 value="${Utils.escapeHtml(defaults.carrier)}" 
                 placeholder="مثلاً: پست پیشتاز، تیپاکس، باربری">
        </div>
        
        <div class="form-group">
          <label class="form-label">محتویات بسته</label>
          <input type="text" id="f-contents" class="form-input" 
                 value="${Utils.escapeHtml(defaults.contents)}" 
                 placeholder="مثلاً: ست دخترانه، لباس پسرانه">
        </div>
        
        <div class="form-group">
          <label class="form-label">تعداد اقلام</label>
          <input type="number" id="f-item-count" class="form-input" 
                 value="${defaults.itemCount}" 
                 placeholder="مثلاً: 35" min="0" dir="ltr" style="text-align: left;">
        </div>
        
        <div class="form-group">
          <label class="form-label">توضیحات</label>
          <textarea id="f-notes" class="form-textarea" 
                    placeholder="توضیحات اضافی...">${Utils.escapeHtml(defaults.notes)}</textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" id="btn-cancel" class="btn btn-secondary btn-block">
            انصراف
          </button>
          <button type="submit" class="btn btn-primary btn-block btn-lg">
            ${isEditMode ? '💾 ذخیره تغییرات' : '✅ ثبت مرسوله'}
          </button>
        </div>
        
      </form>
    `;
    
    attachEvents();
    return null;
  }
  
  function getSupplierName(id) {
    if (!id) return '';
    const supplier = State.getSupplier(id);
    return supplier ? supplier.name : '';
  }
  
  function toLocalDateTimeInput(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  
  function attachEvents() {
    document.getElementById('shipment-form').addEventListener('submit', handleSubmit);
    
    document.getElementById('btn-cancel').addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        Router.navigate('/dashboard');
      }
    });
    
    const searchInput = document.getElementById('f-supplier-search');
    const suggestionsBox = document.getElementById('supplier-suggestions');
    
    searchInput.addEventListener('input', Utils.debounce(() => {
      const query = searchInput.value.trim();
      if (query.length < 1) {
        suggestionsBox.innerHTML = '';
        return;
      }
      showSuggestions(query);
    }, 150));
    
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 1) {
        showSuggestions(searchInput.value.trim());
      }
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-wrapper')) {
        suggestionsBox.innerHTML = '';
      }
    });
    
    document.getElementById('btn-new-supplier').addEventListener('click', showNewSupplierModal);
  }
  
  function showSuggestions(query) {
    const suggestionsBox = document.getElementById('supplier-suggestions');
    const suppliers = State.get('suppliers');
    const q = query.toLowerCase();
    
    const matches = suppliers.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q))
    ).slice(0, 5);
    
    if (matches.length === 0) {
      suggestionsBox.innerHTML = `
        <div class="suggestion-item suggestion-empty">
          نتیجه‌ای یافت نشد
        </div>
      `;
      return;
    }
    
    suggestionsBox.innerHTML = matches.map(s => `
      <div class="suggestion-item" data-id="${s.id}" data-name="${Utils.escapeHtml(s.name)}">
        <div class="suggestion-name">${Utils.escapeHtml(s.name)}</div>
        ${s.city ? `<div class="suggestion-meta">${Utils.escapeHtml(s.city)}</div>` : ''}
      </div>
    `).join('');
    
    suggestionsBox.querySelectorAll('.suggestion-item[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const name = item.getAttribute('data-name');
        document.getElementById('f-supplier-search').value = name;
        document.getElementById('f-supplier-id').value = id;
        suggestionsBox.innerHTML = '';
      });
    });
  }
  
  function showNewSupplierModal() {
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">نام فروشگاه *</label>
        <input type="text" id="new-supplier-name" class="form-input" required>
      </div>
      <div class="form-group">
        <label class="form-label">نام شخص</label>
        <input type="text" id="new-supplier-contact" class="form-input">
      </div>
      <div class="form-group">
        <label class="form-label">شماره تماس</label>
        <input type="tel" id="new-supplier-phone" class="form-input" dir="ltr" style="text-align: left;">
      </div>
      <div class="form-group">
        <label class="form-label">شهر</label>
        <input type="text" id="new-supplier-city" class="form-input">
      </div>
    `;
    
    const footer = document.createElement('div');
    footer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; width: 100%;';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'انصراف';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'ذخیره و انتخاب';
    
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    
    const modal = Components.modal({
      title: '🏪 افزودن فروشگاه جدید',
      content: content,
      footer: footer
    });
    
    cancelBtn.addEventListener('click', () => modal.close());
    
    saveBtn.addEventListener('click', async () => {
      const name = document.getElementById('new-supplier-name').value.trim();
      if (!name) {
        Components.toastWarning('نام فروشگاه الزامی است');
        return;
      }
      
      if (State.getSupplierByName(name)) {
        Components.toastError('فروشگاهی با این نام قبلاً ثبت شده');
        return;
      }
      
      const newSupplier = {
        id: Utils.generateId(),
        name: name,
        contactPerson: document.getElementById('new-supplier-contact').value.trim(),
        phone: document.getElementById('new-supplier-phone').value.trim(),
        city: document.getElementById('new-supplier-city').value.trim(),
        notes: '',
        createdAt: Utils.nowISO(),
        updatedAt: Utils.nowISO()
      };
      
      try {
        await DB.add(DB.STORES.SUPPLIERS, newSupplier);
        await State.loadSuppliers();
        
        document.getElementById('f-supplier-search').value = name;
        document.getElementById('f-supplier-id').value = newSupplier.id;
        
        modal.close();
        Components.toastSuccess('فروشگاه اضافه شد');
      } catch (err) {
        console.error(err);
        Components.toastError('خطا در ذخیره فروشگاه');
      }
    });
    
    setTimeout(() => {
      document.getElementById('new-supplier-name').focus();
    }, 100);
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    const barcode = Utils.normalizeBarcode(document.getElementById('f-barcode').value);
    
    if (!barcode) {
      Components.toastWarning('شماره بارکد الزامی است');
      return;
    }
    
    if (!isEditMode) {
      const existing = State.getShipmentByBarcode(barcode);
      if (existing) {
        Components.toastError('این بارکد قبلاً ثبت شده است');
        return;
      }
    }
    
    const supplierId = document.getElementById('f-supplier-id').value;
    const status = document.getElementById('f-status').value;
    const receivedAtInput = document.getElementById('f-received-at').value;
    const sentAtInput = document.getElementById('f-sent-at').value;
    
    const shipmentData = {
      barcode: barcode,
      supplierId: supplierId || '',
      senderName: document.getElementById('f-sender').value.trim() || '',
      status: status,
      receivedAt: receivedAtInput ? new Date(receivedAtInput).toISOString() : new Date().toISOString(),
      sentAt: sentAtInput ? new Date(sentAtInput).toISOString() : '',
      carrier: document.getElementById('f-carrier').value.trim() || '',
      contents: document.getElementById('f-contents').value.trim() || '',
      itemCount: parseInt(document.getElementById('f-item-count').value) || 0,
      notes: document.getElementById('f-notes').value.trim() || '',
      photoIds: [],
      relatedOrderId: '',
      updatedAt: Utils.nowISO()
    };
    
    try {
      if (isEditMode) {
        shipmentData.id = currentShipment.id;
        shipmentData.displayIndex = currentShipment.displayIndex;
        shipmentData.createdAt = currentShipment.createdAt;
        
        await DB.put(DB.STORES.SHIPMENTS, shipmentData);
        Components.toastSuccess('مرسوله ویرایش شد ✅');
      } else {
        const nextIndex = await DB.getNextDisplayIndex();
        shipmentData.id = Utils.generateId();
        shipmentData.displayIndex = nextIndex;
        shipmentData.createdAt = Utils.nowISO();
        
        await DB.add(DB.STORES.SHIPMENTS, shipmentData);
        Components.toastSuccess(`مرسوله #${nextIndex} ثبت شد ✅`);
      }
      
      await State.loadShipments();
      Router.navigate('/dashboard');
      
    } catch (err) {
      console.error('Save error:', err);
      if (err.name === 'ConstraintError') {
        Components.toastError('این بارکد قبلاً ثبت شده است');
      } else {
        Components.toastError('خطا در ذخیره: ' + err.message);
      }
    }
  }
  
  return { render };
})();
