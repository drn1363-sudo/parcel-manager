/**
 * Dashboard View
 * صفحه اصلی با آمار و دسترسی سریع
 */
window.Views = window.Views || {};
Views.Dashboard = (function() {
  'use strict';
  
  /**
   * Render dashboard
   */
  function render(root) {
    // Get data from state
    const stats = State.getStats();
    const allShipments = State.get('shipments');
    const recentShipments = allShipments.slice(0, 5); // Last 5
    
    // Build HTML
    root.innerHTML = `
      <!-- Stats Grid -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.todayReceived}</div>
          <div class="stat-label">📦 دریافت امروز</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">📊 کل مرسولات</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.pending + stats.shipping}</div>
          <div class="stat-label">🚚 در انتظار</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.problem}</div>
          <div class="stat-label">⚠️ مشکل‌دار</div>
        </div>
      </div>
      
      <!-- Main Action: Scan -->
      <a href="#/scan" class="quick-action-btn quick-action-scan" style="margin-bottom: 16px;">
        <span class="quick-action-icon">📷</span>
        <span class="quick-action-label">اسکن بارکد</span>
      </a>
      
      <!-- Quick Actions Grid -->
      <div class="quick-actions">
        <a href="#/shipment-new" class="quick-action-btn">
          <span class="quick-action-icon">➕</span>
          <span class="quick-action-label">ثبت دستی</span>
        </a>
        <a href="#/shipments" class="quick-action-btn">
          <span class="quick-action-icon">📦</span>
          <span class="quick-action-label">همه مرسولات</span>
        </a>
        <a href="#/suppliers" class="quick-action-btn">
          <span class="quick-action-icon">🏪</span>
          <span class="quick-action-label">فروشگاه‌ها</span>
        </a>
        <a href="#/reports" class="quick-action-btn">
          <span class="quick-action-icon">📊</span>
          <span class="quick-action-label">گزارش‌ها</span>
        </a>
      </div>
      
      <!-- Recent Shipments Section -->
      <div class="section-header">
        <h2 class="section-title">آخرین مرسولات</h2>
        <a href="#/shipments" class="section-link">مشاهده همه ←</a>
      </div>
      
      <div id="recent-shipments-list">
        ${renderRecentShipments(recentShipments)}
      </div>
    `;
    
    // Attach event listeners
    attachEvents();
    
    // No cleanup needed
    return null;
  }
  
  /**
   * Render recent shipments list
   */
  function renderRecentShipments(shipments) {
    if (shipments.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-title">هنوز مرسوله‌ای ثبت نشده</div>
          <div class="empty-state-text">اولین مرسوله خود را با اسکن بارکد یا ثبت دستی اضافه کنید.</div>
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
          </div>
        </div>
      `;
    }).join('');
  }
  
  /**
   * Attach event listeners
   */
  function attachEvents() {
    // Click on shipment item → navigate to detail
    document.querySelectorAll('.shipment-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        Router.navigate('/shipment-detail', { id });
      });
    });
  }
  
  // Public API
  return { render };
  
})();
