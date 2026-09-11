/**
 * Supplier Detail View
 * جزئیات فروشگاه + لیست مرسولات
 */
window.Views = window.Views || {};
Views.SupplierDetail = (function() {
  'use strict';
  
  function render(root, params) {
    const supplierId = params.id;
    const supplier = State.getSupplier(supplierId);
    
    if (!supplier) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <div class="empty-state-title">فروشگاه یافت نشد</div>
          <button class="btn btn-primary mt-md" onclick="Router.navigate('/suppliers')">
            بازگشت به لیست
          </button>
        </div>
      `;
      return null;
    }
    
    const shipments = State.getShipmentsBySupplier(supplierId);
    const stats = getSupplierStats(supplierId);
    
    root.innerHTML = `
      <div class="supplier-detail">
        
        <!-- Header -->
        <div class="detail-header">
          <div>
            <div class="detail-index">${Utils.escapeHtml(supplier.name)}</div>
            <div class="text-muted" style="font-size: 14px; margin-top: 4px;">
              ${shipments.length} مرسوله
            </div>
          </div>
        </div>
        
        <!-- Contact Info -->
        ${supplier.contactPerson ? `
          <div class="detail-section">
            <div class="detail-label">نام شخص</div>
            <div class="detail-value">${Utils.escapeHtml(supplier.contactPerson)}</div>
          </div>
        ` : ''}
        
        ${supplier.phone ? `
          <div class="detail-section">
            <div class="detail-label">شماره تماس</div>
            <div class="detail-value" dir="ltr" style="text-align: right;">
              <a href="tel:${Utils.escapeHtml(supplier.phone)}" class="phone-link">
                📞 ${Utils.escapeHtml(supplier.phone)}
              </a>
            </div>
          </div>
        ` : ''}
        
        ${supplier.city ? `
          <div class="detail-section">
            <div class="detail-label">شهر</div>
            <div class="detail-value">📍 ${Utils.escapeHtml(supplier.city)}</div>
          </div>
        ` : ''}
        
        ${supplier.notes ? `
          <div class="detail-section">
            <div class="detail-label">توضیحات</div>
            <div class="detail-value notes-value">${Utils.escapeHtml(supplier.notes)}</div>
          </div>
        ` : ''}
        
        <!-- Stats -->
        <div class="supplier-stats-grid">
          <div class="stat-box">
            <div class="stat-box-value">${stats.total}</div>
            <div class="stat-box-label">کل مرسولات</div>
          </div>
          <div class="stat-box stat-delivered">
            <div class="stat-box-value">${stats.delivered}</div>
            <div class="stat-box-label">تحویل شده</div>
          </div>
          <div class="stat-box stat-pending">
            <div class="stat-box-value">${stats.pending}</div>
            <div class="stat-box-label">در انتظار</div>
          </div>
          <div class="stat-box stat-problem">
            <div class="stat-box-value">${stats.problem}</div>
            <div class="stat-box-label">مشکل‌دار</div>
          </div>
        </div>
        
        ${stats.lastReceived ? `
          <div class="detail-section">
            <div class="detail-label">آخرین دریافت</div>
            <div class="detail-value">${Utils.formatDateTime(stats.lastReceived)}</div>
          </div>
        ` : ''}
        
        <!-- Shipments Section -->
        <div class="section-header" style="margin-top: 24px;">
          <h2 class="section-title">مرسولات این فروشگاه</h2>
        </div>
        
        <div id="supplier-shipments">
          ${renderShipmentsList(shipments)}
        </div>
        
        <!-- Actions -->
        <div class="detail-actions">
          <button id="btn-edit-supplier" class="btn btn-primary btn-block">
            ✏️ ویرایش فروشگاه
          </button>
          <button id="btn-new-shipment" class="btn btn-secondary btn-block">
            ➕ ثبت مرسوله جدید برای این فروشگاه
          </button>
          <button id="btn-delete-supplier" class="btn btn-danger btn-block">
            🗑️ حذف فروشگاه
          </button>
        </div>
        
        <!-- Metadata -->
        <div class="detail-metadata">
          <div>ایجاد: ${Utils.formatDateTime(supplier.createdAt)}</div>
          <div>ویرایش: ${Utils.formatDateTime(supplier.updatedAt)}</div>
        </div>
        
      </div>
    `;
    
    attachEvents(supplier, shipments.length);
    return null;
  }
  
  function getSupplierStats(supplierId) {
    const shipments = State.getShipmentsBySupplier(supplierId);
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const pending = shipments.filter(s => s.status === 'pending' || s.status === 'shipping').length;
    const problem = shipments.filter(s => s.status === 'problem').length;
    
    const receivedDates = shipments
      .filter(s => s.receivedAt)
      .map(s => new Date(s.receivedAt))
      .sort((a, b) => b - a);
    const lastReceived = receivedDates.length > 0 ? receivedDates[0] : null;
    
    return { total, delivered, pending, problem, lastReceived };
  }
  
  function renderShipmentsList(shipments) {
    if (shipments.length === 0) {
      return `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-text">هنوز مرسوله‌ای از این فروشگاه ثبت نشده</div>
        </div>
      `;
    }
    
    return shipments.map(shipment => `
      <div class="shipment-item" data-shipment-id="${shipment.id}">
        <div class="shipment-item-header">
          <span class="shipment-item-index">ردیف ${shipment.displayIndex}</span>
          <span class="status-badge status-${shipment.status}">
            ${Utils.getStatusIcon(shipment.status)}
            ${Utils.getStatusLabel(shipment.status)}
          </span>
        </div>
        <div class="shipment-item-barcode">${Utils.escapeHtml(shipment.barcode)}</div>
        <div class="shipment-item-meta">
          ${shipment.receivedAt ? `<span>📅 ${Utils.formatDate(shipment.receivedAt)}</span>` : ''}
          ${shipment.contents ? `<span>📦 ${Utils.escapeHtml(shipment.contents)}</span>` : ''}
        </div>
      </div>
    `).join('');
  }
  
  function attachEvents(supplier, shipmentCount) {
    // Click on shipment
    document.querySelectorAll('.shipment-item[data-shipment-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-shipment-id');
        Router.navigate('/shipment-detail', { id });
      });
    });
    
    // Edit supplier
    document.getElementById('btn-edit-supplier').addEventListener('click', () => {
      Router.navigate('/supplier-edit', { id: supplier.id });
    });
    
    // New shipment for this supplier
    document.getElementById('btn-new-shipment').addEventListener('click', () => {
      Router.navigate('/shipment-new', { supplierId: supplier.id });
    });
    
    // Delete supplier
    document.getElementById('btn-delete-supplier').addEventListener('click', () => {
      showDeleteConfirm(supplier, shipmentCount);
    });
  }
  
  async function showDeleteConfirm(supplier, shipmentCount) {
    let message = `آیا مطمئن هستید که می‌خواهید فروشگاه "${supplier.name}" را حذف کنید؟`;
    
    if (shipmentCount > 0) {
      message += `\n\n⚠️ توجه: این فروشگاه ${shipmentCount} مرسوله دارد. با حذف فروشگاه، مرسولات آن حذف نمی‌شوند ولی ارتباطشان با فروشگاه قطع می‌شود.`;
    }
    
    message += '\n\nاین عمل قابل بازگشت نیست.';
    
    const confirmed = await Components.confirm({
      title: '🗑️ حذف فروشگاه',
      message: message,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      danger: true
    });
    
    if (!confirmed) return;
    
    try {
      // Remove supplier
      await DB.remove(DB.STORES.SUPPLIERS, supplier.id);
      
      // Clear supplierId from related shipments
      const shipments = State.getShipmentsBySupplier(supplier.id);
      for (const shipment of shipments) {
        shipment.supplierId = '';
        shipment.updatedAt = Utils.nowISO();
        await DB.put(DB.STORES.SHIPMENTS, shipment);
      }
      
      await State.loadSuppliers();
      await State.loadShipments();
      
      Components.toastSuccess('فروشگاه حذف شد');
      
      if (window.history.length > 1) {
        window.history.back();
      } else {
        Router.navigate('/suppliers');
      }
      
    } catch (err) {
      console.error(err);
      Components.toastError('خطا در حذف فروشگاه');
    }
  }
  
  return { render };
})();
