/**
 * Supplier Form View
 * فرم افزودن/ویرایش فروشگاه
 */
window.Views = window.Views || {};
Views.SupplierForm = (function() {
  'use strict';
  
  let currentSupplier = null;
  let isEditMode = false;
  
  function render(root, params) {
    const supplierId = params.id;
    isEditMode = !!supplierId;
    currentSupplier = isEditMode ? State.getSupplier(supplierId) : null;
    
    const defaults = {
      name: currentSupplier ? currentSupplier.name : '',
      contactPerson: currentSupplier ? (currentSupplier.contactPerson || '') : '',
      phone: currentSupplier ? (currentSupplier.phone || '') : '',
      city: currentSupplier ? (currentSupplier.city || '') : '',
      notes: currentSupplier ? (currentSupplier.notes || '') : ''
    };
    
    root.innerHTML = `
      <form id="supplier-form" class="shipment-form">
        
        <div class="form-group">
          <label class="form-label">نام فروشگاه / تأمین‌کننده *</label>
          <input type="text" id="f-sup-name" class="form-input" 
                 value="${Utils.escapeHtml(defaults.name)}" 
                 required autocomplete="off">
        </div>
        
        <div class="form-group">
          <label class="form-label">نام شخص</label>
          <input type="text" id="f-sup-contact" class="form-input" 
                 value="${Utils.escapeHtml(defaults.contactPerson)}" 
                 placeholder="اختیاری">
        </div>
        
        <div class="form-group">
          <label class="form-label">شماره تماس</label>
          <input type="tel" id="f-sup-phone" class="form-input" 
                 value="${Utils.escapeHtml(defaults.phone)}" 
                 placeholder="مثلاً: 09123456789" 
                 dir="ltr" style="text-align: left;">
        </div>
        
        <div class="form-group">
          <label class="form-label">شهر</label>
          <input type="text" id="f-sup-city" class="form-input" 
                 value="${Utils.escapeHtml(defaults.city)}" 
                 placeholder="مثلاً: تهران">
        </div>
        
        <div class="form-group">
          <label class="form-label">توضیحات</label>
          <textarea id="f-sup-notes" class="form-textarea" 
                    placeholder="آدرس، توضیحات اضافی...">${Utils.escapeHtml(defaults.notes)}</textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" id="btn-cancel" class="btn btn-secondary btn-block">
            انصراف
          </button>
          <button type="submit" class="btn btn-primary btn-block btn-lg">
            ${isEditMode ? '💾 ذخیره تغییرات' : '✅ ثبت فروشگاه'}
          </button>
        </div>
        
      </form>
    `;
    
    attachEvents();
    return null;
  }
  
  function attachEvents() {
    document.getElementById('supplier-form').addEventListener('submit', handleSubmit);
    
    document.getElementById('btn-cancel').addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        Router.navigate('/suppliers');
      }
    });
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('f-sup-name').value.trim();
    
    if (!name) {
      Components.toastWarning('نام فروشگاه الزامی است');
      return;
    }
    
    // Check duplicate name (only in create mode, or if name changed)
    const existing = State.getSupplierByName(name);
    if (existing && (!isEditMode || existing.id !== currentSupplier.id)) {
      Components.toastError('فروشگاهی با این نام قبلاً ثبت شده');
      return;
    }
    
    const supplierData = {
      name: name,
      contactPerson: document.getElementById('f-sup-contact').value.trim(),
      phone: document.getElementById('f-sup-phone').value.trim(),
      city: document.getElementById('f-sup-city').value.trim(),
      notes: document.getElementById('f-sup-notes').value.trim(),
      updatedAt: Utils.nowISO()
    };
    
    try {
      if (isEditMode) {
        supplierData.id = currentSupplier.id;
        supplierData.createdAt = currentSupplier.createdAt;
        
        await DB.put(DB.STORES.SUPPLIERS, supplierData);
        Components.toastSuccess('فروشگاه ویرایش شد ✅');
      } else {
        supplierData.id = Utils.generateId();
        supplierData.createdAt = Utils.nowISO();
        
        await DB.add(DB.STORES.SUPPLIERS, supplierData);
        Components.toastSuccess('فروشگاه ثبت شد ✅');
      }
      
      await State.loadSuppliers();
      Router.navigate('/suppliers');
      
    } catch (err) {
      console.error('Save error:', err);
      if (err.name === 'ConstraintError') {
        Components.toastError('فروشگاهی با این نام قبلاً ثبت شده');
      } else {
        Components.toastError('خطا در ذخیره: ' + err.message);
      }
    }
  }
  
  return { render };
})();
