/**
 * Shipment Detail View
 * صفحه جزئیات مرسوله
 */
window.Views = window.Views || {};
Views.ShipmentDetail = (function() {
  'use strict';
  
  function render(root, params) {
    const shipmentId = params.id;
    const shipment = State.getShipment(shipmentId);
    
    if (!shipment) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <div class="empty-state-title">مرسوله یافت نشد</div>
          <div class="empty-state-text">این مرسوله وجود ندارد یا حذف شده است.</div>
          <button class="btn btn-primary mt-md" onclick="Router.navigate('/shipments')">
            بازگشت به لیست
          </button>
        </div>
      `;
      return null;
    }
    
    const supplier = State.getSupplier(shipment.supplierId);
    const supplierName = supplier ? supplier.name : 'نامشخص';
    const supplierCity = supplier ? (supplier.city || '') : '';
    const supplierPhone = supplier ? (supplier.phone || '') : '';
    
    root.innerHTML = `
      <div class="shipment-detail">
        <div class="detail-header">
          <div class="detail-index">ردیف ${shipment.displayIndex}</div>
          <span class="status-badge status-${shipment.status}">
            ${Utils.getStatusIcon(shipment.status)}
            ${Utils.getStatusLabel(shipment.status)}
          </span>
        </div>
        
        <div class="detail-section">
          <div class="detail-label">شماره بارکد</div>
          <div class="detail-value barcode-value" dir="ltr">${Utils.escapeHtml(shipment.barcode)}</div>
          <button class="btn-copy" data-copy="${Utils.escapeHtml(shipment.barcode)}">📋 کپی</button>
        </div>
        
        <div class="detail-section">
          <div class="detail-label">فروشگاه / تأمین‌کننده</div>
          <div class="detail-value">${Utils.escapeHtml(supplierName)}</div>
          ${supplierCity ? `<div class="detail-sub">📍 ${Utils.escapeHtml(supplierCity)}</div>` : ''}
          ${supplierPhone ? `<div class="detail-sub">📞 <span dir="ltr">${Utils.escapeHtml(supplierPhone)}</span></div>` : ''}
        </div>
        
        ${shipment.senderName ? `
          <div class="detail-section">
            <div class="detail-label">ارسال‌کننده</div>
            <div class="detail-value">${Utils.escapeHtml(shipment.senderName)}</div>
          </div>
        ` : ''}
        
        <div class="detail-row">
          <div class="detail-section">
            <div class="detail-label">تاریخ ارسال</div>
            <div class="detail-value">
              ${shipment.sentAt ? Utils.formatDateTime(shipment.sentAt) : '—'}
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-label">تاریخ دریافت</div>
            <div class="detail-value">
              ${shipment.receivedAt ? Utils.formatDateTime(shipment.receivedAt) : '—'}
            </div>
          </div>
        </div>
        
        ${shipment.carrier ? `
          <div class="detail-section">
            <div class="detail-label">شرکت حمل</div>
            <div class="detail-value">${Utils.escapeHtml(shipment.carrier)}</div>
          </div>
        ` : ''}
        
        <div class="detail-row">
          <div class="detail-section">
            <div class="detail-label">محتویات</div>
            <div class="detail-value">
              ${shipment.contents ? Utils.escapeHtml(shipment.contents) : '—'}
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-label">تعداد اقلام</div>
            <div class="detail-value">
              ${shipment.itemCount ? shipment.itemCount : '—'}
            </div>
          </div>
        </div>
        
        ${shipment.notes ? `
          <div class="detail-section">
            <div class="detail-label">توضیحات</div>
            <div class="detail-value notes-value">${Utils.escapeHtml(shipment.notes)}</div>
          </div>
        ` : ''}
        
        <div class="detail-metadata">
          <div>ایجاد: ${Utils.formatDateTime(shipment.createdAt)}</div>
          <div>ویرایش: ${Utils.formatDateTime(shipment.updatedAt)}</div>
        </div>
        
        <div class="detail-actions">
          <button id="btn-edit" class="btn btn-primary btn-block">
            ✏️ ویرایش
          </button>
          <button id="btn-change-status" class="btn btn-secondary btn-block">
            🔄 تغییر وضعیت
          </button>
          <button id="btn-delete" class="btn btn-danger btn-block">
            🗑️ حذف مرسوله
          </button>
        </div>
      </div>
    `;
    
    attachEvents(shipment);
    return null;
  }
  
  function attachEvents(shipment) {
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(() => {
          Components.toastSuccess('کپی شد');
        }).catch(() => {
          Components.toastError('خطا در کپی');
        });
      });
    });
    
    document.getElementById('btn-edit').addEventListener('click', () => {
      Router.navigate('/shipment-edit', { id: shipment.id });
    });
    
    document.getElementById('btn-change-status').addEventListener('click', () => {
      showChangeStatusModal(shipment);
    });
    
    document.getElementById('btn-delete').addEventListener('click', () => {
      showDeleteConfirm(shipment);
    });
  }
  
  function showChangeStatusModal(shipment) {
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">وضعیت جدید</label>
        <select id="new-status" class="form-select">
          ${Object.entries(Utils.STATUS_LABELS).map(([key, label]) => 
            `<option value="${key}" ${shipment.status === key ? 'selected' : ''}>
              ${Utils.getStatusIcon(key)} ${label}
            </option>`
          ).join('')}
        </select>
      </div>
    `;
    
    const footer = document.createElement('div');
    footer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; width: 100%;';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'انصراف';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'ذخیره';
    
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    
    const modal = Components.modal({
      title: '🔄 تغییر وضعیت',
      content: content,
      footer: footer
    });
    
    cancelBtn.addEventListener('click', () => modal.close());
    
    saveBtn.addEventListener('click', async () => {
      const newStatus = document.getElementById('new-status').value;
      
      if (newStatus === shipment.status) {
        modal.close();
        return;
      }
      
      try {
        shipment.status = newStatus;
        shipment.updatedAt = Utils.nowISO();
        
        await DB.put(DB.STORES.SHIPMENTS, shipment);
        await State.loadShipments();
        
        modal.close();
        Components.toastSuccess('وضعیت تغییر کرد');
        
        const viewRoot = document.getElementById('view-root');
        Views.ShipmentDetail.render(viewRoot, { id: shipment.id });
        
      } catch (err) {
        console.error(err);
        Components.toastError('خطا در تغییر وضعیت');
      }
    });
  }
  
async function showDeleteConfirm(shipment) {
  const confirmed = await Components.confirm({
    title: '🗑️ حذف مرسوله',
    message: `آیا مطمئن هستید که می‌خواهید مرسوله ردیف ${shipment.displayIndex} با بارکد "${shipment.barcode}" را حذف کنید؟\n\nاین عمل قابل بازگشت نیست.`,
    confirmText: 'حذف',
    cancelText: 'انصراف',
    danger: true
  });
  
  if (!confirmed) return;
  
  try {
    console.log('Deleting shipment:', shipment.id);
    
    // Remove from database
    await DB.remove(DB.STORES.SHIPMENTS, shipment.id);
    console.log('✅ Removed from DB');
    
    // Reload state
    await State.loadShipments();
    console.log('✅ State reloaded');
    
    Components.toastSuccess('مرسوله حذف شد');
    
    // Navigate back
    setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        Router.navigate('/shipments');
      }
    }, 500);
    
  } catch (err) {
    console.error('❌ Delete error:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    Components.toastError('خطا در حذف مرسوله: ' + err.message);
  }
}
  
  return { render };
})();
