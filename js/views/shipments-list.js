/**
 * Shipments List View
 * لیست مرسولات با جستجو و فیلتر
 */
window.Views = window.Views || {};
Views.ShipmentsList = (function() {
  'use strict';
  
  function render(root) {
    const filteredShipments = State.getFilteredShipments();
    const currentFilter = State.get('filterStatus');
    const currentSort = State.get('sortBy');
    const searchQuery = State.get('searchQuery');
    
    root.innerHTML = `
      <div class="search-bar">
        <span class="search-bar-icon">🔍</span>
        <input type="text" id="search-input" 
               placeholder="جستجو: بارکد، فروشگاه، محتویات..." 
               value="${Utils.escapeHtml(searchQuery)}"
               autocomplete="off">
      </div>
      
      <div class="filters-row">
        <select id="filter-status" class="form-select">
          <option value="all" ${currentFilter === 'all' ? 'selected' : ''}>همه وضعیت‌ها</option>
          <option value="pending" ${currentFilter === 'pending' ? 'selected' : ''}>⏳ در انتظار ارسال</option>
          <option value="shipping" ${currentFilter === 'shipping' ? 'selected' : ''}>🚚 در مسیر</option>
          <option value="delivered" ${currentFilter === 'delivered' ? 'selected' : ''}>✅ تحویل شده</option>
          <option value="problem" ${currentFilter === 'problem' ? 'selected' : ''}>⚠️ مشکل‌دار</option>
          <option value="returned" ${currentFilter === 'returned' ? 'selected' : ''}>↩️ برگشتی</option>
          <option value="cancelled" ${currentFilter === 'cancelled' ? 'selected' : ''}>❌ لغو شده</option>
        </select>
        
        <select id="sort-by" class="form-select">
          <option value="receivedAt-desc" ${currentSort === 'receivedAt-desc' ? 'selected' : ''}>جدیدترین دریافت</option>
          <option value="receivedAt-asc" ${currentSort === 'receivedAt-asc' ? 'selected' : ''}>قدیمی‌ترین دریافت</option>
          <option value="displayIndex-desc" ${currentSort === 'displayIndex-desc' ? 'selected' : ''}>جدیدترین ثبت</option>
          <option value="displayIndex-asc" ${currentSort === 'displayIndex-asc' ? 'selected' : ''}>قدیمی‌ترین ثبت</option>
        </select>
      </div>
      
      <div class="results-count">
        ${filteredShipments.length} مرسوله
      </div>
      
      <div id="shipments-list">
        ${renderShipmentsList(filteredShipments)}
      </div>
    `;
    
    attachEvents();
    return null;
  }
  
  function renderShipmentsList(shipments) {
    if (shipments.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-title">مرسوله‌ای یافت نشد</div>
          <div class="empty-state-text">فیلترها را تغییر دهید یا مرسوله جدید ثبت کنید.</div>
        </div>
      `;
    }
    
    return shipments.map(shipment => {
      const supplier = State.getSupplier(shipment.supplierId);
      const supplierName = supplier ? supplier.name : 'نامشخص';
      
      return `
        <div class="shipment-item" data-id="${shipment.id}">
          <div class="shipment-item-header">
            <span class="shipment-item-index">ردیف ${shipment.displayIndex}</span>
            <span class="status-badge status-${shipment.status}">
              ${Utils.getStatusIcon(shipment.status)}
              ${Utils.getStatusLabel(shipment.status)}
            </span>
          </div>
          <div class="shipment-item-barcode">${Utils.escapeHtml(shipment.barcode)}</div>
          <div class="shipment-item-meta">
            <span>🏪 ${Utils.escapeHtml(supplierName)}</span>
            ${shipment.receivedAt ? `<span>📅 ${Utils.formatDate(shipment.receivedAt)}</span>` : ''}
            ${shipment.contents ? `<span>📦 ${Utils.escapeHtml(shipment.contents)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  function attachEvents() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      State.set('searchQuery', e.target.value);
      updateList();
    }, 200));
    
    document.getElementById('filter-status').addEventListener('change', (e) => {
      State.set('filterStatus', e.target.value);
      updateList();
    });
    
    document.getElementById('sort-by').addEventListener('change', (e) => {
      State.set('sortBy', e.target.value);
      updateList();
    });
    
    document.querySelectorAll('.shipment-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        Router.navigate('/shipment-detail', { id });
      });
    });
  }
  
  function updateList() {
    const filteredShipments = State.getFilteredShipments();
    const listContainer = document.getElementById('shipments-list');
    const resultsCount = document.querySelector('.results-count');
    
    if (listContainer) {
      listContainer.innerHTML = renderShipmentsList(filteredShipments);
      listContainer.querySelectorAll('.shipment-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          Router.navigate('/shipment-detail', { id });
        });
      });
    }
    
    if (resultsCount) {
      resultsCount.textContent = `${filteredShipments.length} مرسوله`;
    }
  }
  
  return { render };
})();
