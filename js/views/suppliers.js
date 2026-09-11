/**
 * Suppliers List View
 * لیست فروشگاه‌ها و تأمین‌کنندگان
 */
window.Views = window.Views || {};
Views.Suppliers = (function() {
  'use strict';
  
  function render(root) {
    const suppliers = State.get('suppliers');
    const shipments = State.get('shipments');
    
    root.innerHTML = `
      <!-- Search Bar -->
      <div class="search-bar">
        <span class="search-bar-icon">🔍</span>
        <input type="text" id="supplier-search" 
               placeholder="جستجو در فروشگاه‌ها..." 
               autocomplete="off">
      </div>
      
      <!-- Add Button -->
      <a href="#/supplier-new" class="btn btn-primary btn-block" style="margin-bottom: 16px;">
        ➕ افزودن فروشگاه جدید
      </a>
      
      <!-- Count -->
      <div class="results-count">
        ${suppliers.length} فروشگاه
      </div>
      
      <!-- List -->
      <div id="suppliers-list">
        ${renderSuppliersList(suppliers, shipments)}
      </div>
    `;
    
    attachEvents();
    return null;
  }
  
  /**
   * Calculate supplier stats
   */
  function getSupplierStats(supplierId, shipments) {
    const related = shipments.filter(s => s.supplierId === supplierId);
    
    const total = related.length;
    const delivered = related.filter(s => s.status === 'delivered').length;
    const pending = related.filter(s => s.status === 'pending' || s.status === 'shipping').length;
    const problem = related.filter(s => s.status === 'problem').length;
    
    // Last received date
    const receivedDates = related
      .filter(s => s.receivedAt)
      .map(s => new Date(s.receivedAt))
      .sort((a, b) => b - a);
    const lastReceived = receivedDates.length > 0 ? receivedDates[0] : null;
    
    // Last sent date
    const sentDates = related
      .filter(s => s.sentAt)
      .map(s => new Date(s.sentAt))
      .sort((a, b) => b - a);
    const lastSent = sentDates.length > 0 ? sentDates[0] : null;
    
    return { total, delivered, pending, problem, lastReceived, lastSent };
  }
  
  /**
   * Render suppliers list
   */
  function renderSuppliersList(suppliers, shipments) {
    if (suppliers.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🏪</div>
          <div class="empty-state-title">هنوز فروشگاهی ثبت نشده</div>
          <div class="empty-state-text">اولین فروشگاه خود را اضافه کنید.</div>
        </div>
      `;
    }
    
    return suppliers.map(supplier => {
      const stats = getSupplierStats(supplier.id, shipments);
      
      return `
        <div class="supplier-item" data-id="${supplier.id}">
          <div class="supplier-item-header">
            <div class="supplier-item-name">${Utils.escapeHtml(supplier.name)}</div>
            <div class="supplier-item-count">${stats.total} مرسوله</div>
          </div>
          
          ${supplier.contactPerson ? `
            <div class="supplier-item-meta">
              👤 ${Utils.escapeHtml(supplier.contactPerson)}
            </div>
          ` : ''}
          
          ${supplier.city ? `
            <div class="supplier-item-meta">
              📍 ${Utils.escapeHtml(supplier.city)}
            </div>
          ` : ''}
          
          <div class="supplier-item-stats">
            <span class="stat-mini stat-delivered">✅ ${stats.delivered}</span>
            <span class="stat-mini stat-pending">🚚 ${stats.pending}</span>
            ${stats.problem > 0 ? `<span class="stat-mini stat-problem">⚠️ ${stats.problem}</span>` : ''}
          </div>
          
          ${stats.lastReceived ? `
            <div class="supplier-item-date">
              آخرین دریافت: ${Utils.formatDate(stats.lastReceived)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }
  
  /**
   * Attach events
   */
  function attachEvents() {
    // Search
    const searchInput = document.getElementById('supplier-search');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      const query = e.target.value.trim().toLowerCase();
      const suppliers = State.get('suppliers');
      const shipments = State.get('shipments');
      
      let filtered = suppliers;
      if (query) {
        filtered = suppliers.filter(s => 
          s.name.toLowerCase().includes(query) ||
          (s.contactPerson && s.contactPerson.toLowerCase().includes(query)) ||
          (s.city && s.city.toLowerCase().includes(query)) ||
          (s.phone && s.phone.includes(query))
        );
      }
      
      document.getElementById('suppliers-list').innerHTML = renderSuppliersList(filtered, shipments);
      document.querySelector('.results-count').textContent = `${filtered.length} فروشگاه`;
      
      // Re-attach click handlers
      attachItemClickHandlers();
    }, 200));
    
    // Click handlers
    attachItemClickHandlers();
  }
  
  function attachItemClickHandlers() {
    document.querySelectorAll('.supplier-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        Router.navigate('/supplier-detail', { id });
      });
    });
  }
  
  return { render };
})();
