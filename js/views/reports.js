/**
 * Reports View
 * صفحه گزارش‌ها و آمار
 */
window.Views = window.Views || {};
Views.Reports = (function() {
  'use strict';
  
  function render(root) {
    const shipments = State.get('shipments');
    const suppliers = State.get('suppliers');
    
    const stats = calculateStats(shipments);
    const supplierStats = calculateSupplierStats(shipments, suppliers);
    const monthlyStats = calculateMonthlyStats(shipments);
    
    root.innerHTML = `
      <div class="reports-page">
        
        <!-- Summary Stats -->
        <div class="report-section">
          <h3 class="report-section-title">📊 آمار کلی</h3>
          <div class="report-stats-grid">
            <div class="report-stat">
              <div class="report-stat-value">${stats.total}</div>
              <div class="report-stat-label">کل مرسولات</div>
            </div>
            <div class="report-stat stat-delivered">
              <div class="report-stat-value">${stats.delivered}</div>
              <div class="report-stat-label">✅ تحویل شده</div>
            </div>
            <div class="report-stat stat-pending">
              <div class="report-stat-value">${stats.pending}</div>
              <div class="report-stat-label">🚚 در انتظار / مسیر</div>
            </div>
            <div class="report-stat stat-problem">
              <div class="report-stat-value">${stats.problem}</div>
              <div class="report-stat-label">⚠️ مشکل‌دار</div>
            </div>
            <div class="report-stat stat-returned">
              <div class="report-stat-value">${stats.returned}</div>
              <div class="report-stat-label">↩️ برگشتی</div>
            </div>
            <div class="report-stat stat-cancelled">
              <div class="report-stat-value">${stats.cancelled}</div>
              <div class="report-stat-label">❌ لغو شده</div>
            </div>
          </div>
        </div>
        
        <!-- Time Stats -->
        <div class="report-section">
          <h3 class="report-section-title">📅 آمار زمانی</h3>
          <div class="report-stats-grid report-stats-grid-3">
            <div class="report-stat">
              <div class="report-stat-value">${stats.today}</div>
              <div class="report-stat-label">امروز</div>
            </div>
            <div class="report-stat">
              <div class="report-stat-value">${stats.thisWeek}</div>
              <div class="report-stat-label">این هفته</div>
            </div>
            <div class="report-stat">
              <div class="report-stat-value">${stats.thisMonth}</div>
              <div class="report-stat-label">این ماه</div>
            </div>
          </div>
        </div>
        
        <!-- By Supplier -->
        <div class="report-section">
          <h3 class="report-section-title">🏪 گزارش بر اساس فروشگاه</h3>
          
          ${supplierStats.length === 0 ? `
            <div class="empty-state" style="padding: 24px;">
              <div class="empty-state-icon">🏪</div>
              <div class="empty-state-text">هنوز فروشگاهی ثبت نشده</div>
            </div>
          ` : `
            <div class="supplier-report-list">
              ${supplierStats.map(s => `
                <div class="supplier-report-item" data-id="${s.id}">
                  <div class="supplier-report-header">
                    <div class="supplier-report-name">${Utils.escapeHtml(s.name)}</div>
                    <div class="supplier-report-total">${s.total} مرسوله</div>
                  </div>
                  <div class="supplier-report-bar">
                    <div class="bar-delivered" style="width: ${s.total ? (s.delivered / s.total * 100) : 0}%"></div>
                    <div class="bar-pending" style="width: ${s.total ? (s.pending / s.total * 100) : 0}%"></div>
                    <div class="bar-problem" style="width: ${s.total ? (s.problem / s.total * 100) : 0}%"></div>
                  </div>
                  <div class="supplier-report-stats">
                    <span class="stat-mini stat-delivered">✅ ${s.delivered}</span>
                    <span class="stat-mini stat-pending">🚚 ${s.pending}</span>
                    ${s.problem > 0 ? `<span class="stat-mini stat-problem">⚠️ ${s.problem}</span>` : ''}
                    ${s.returned > 0 ? `<span class="stat-mini">↩️ ${s.returned}</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
        
        <!-- Monthly Stats -->
        ${monthlyStats.length > 0 ? `
          <div class="report-section">
            <h3 class="report-section-title">📆 آمار ماهانه</h3>
            <div class="monthly-report-list">
              ${monthlyStats.map(m => `
                <div class="monthly-report-item">
                  <div class="monthly-report-name">${m.label}</div>
                  <div class="monthly-report-count">${m.count} مرسوله</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Problem Shipments -->
        ${stats.problem > 0 ? `
          <div class="report-section report-section-warning">
            <h3 class="report-section-title">⚠️ مرسولات مشکل‌دار (${stats.problem})</h3>
            <div class="problem-shipments-list">
              ${getProblemShipments(shipments).map(s => {
                const supplier = State.getSupplier(s.supplierId);
                return `
                  <div class="problem-shipment-item" data-id="${s.id}">
                    <div class="problem-shipment-barcode">${Utils.escapeHtml(s.barcode)}</div>
                    <div class="problem-shipment-info">
                      ${supplier ? Utils.escapeHtml(supplier.name) : 'نامشخص'}
                      ${s.notes ? ` • ${Utils.escapeHtml(s.notes.substring(0, 40))}` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Pending Shipments -->
        ${stats.pending > 0 ? `
          <div class="report-section report-section-info">
            <h3 class="report-section-title">🚚 مرسولات در انتظار (${stats.pending})</h3>
            <div class="problem-shipments-list">
              ${getPendingShipments(shipments).map(s => {
                const supplier = State.getSupplier(s.supplierId);
                return `
                  <div class="problem-shipment-item" data-id="${s.id}">
                    <div class="problem-shipment-barcode">${Utils.escapeHtml(s.barcode)}</div>
                    <div class="problem-shipment-info">
                      ${supplier ? Utils.escapeHtml(supplier.name) : 'نامشخص'}
                      ${s.sentAt ? ` • ارسال: ${Utils.formatDate(s.sentAt)}` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        
      </div>
    `;
    
    attachEvents();
    return null;
  }
  
  function calculateStats(shipments) {
    const now = new Date();
    const startOfToday = Utils.startOfToday();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = Utils.startOfMonth();
    
    return {
      total: shipments.length,
      delivered: shipments.filter(s => s.status === 'delivered').length,
      pending: shipments.filter(s => s.status === 'pending' || s.status === 'shipping').length,
      problem: shipments.filter(s => s.status === 'problem').length,
      returned: shipments.filter(s => s.status === 'returned').length,
      cancelled: shipments.filter(s => s.status === 'cancelled').length,
      today: shipments.filter(s => s.receivedAt && new Date(s.receivedAt) >= startOfToday).length,
      thisWeek: shipments.filter(s => s.receivedAt && new Date(s.receivedAt) >= startOfWeek).length,
      thisMonth: shipments.filter(s => s.receivedAt && new Date(s.receivedAt) >= startOfMonth).length
    };
  }
  
  function calculateSupplierStats(shipments, suppliers) {
    return suppliers.map(supplier => {
      const related = shipments.filter(s => s.supplierId === supplier.id);
      return {
        id: supplier.id,
        name: supplier.name,
        total: related.length,
        delivered: related.filter(s => s.status === 'delivered').length,
        pending: related.filter(s => s.status === 'pending' || s.status === 'shipping').length,
        problem: related.filter(s => s.status === 'problem').length,
        returned: related.filter(s => s.status === 'returned').length
      };
    }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
  }
  
  function calculateMonthlyStats(shipments) {
    const monthMap = {};
    
    shipments.forEach(s => {
      if (!s.receivedAt) return;
      const d = new Date(s.receivedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    
    // Convert to array and format
    return Object.entries(monthMap)
      .map(([key, count]) => {
        const [year, month] = key.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        const label = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          year: 'numeric',
          month: 'long'
        }).format(d);
        return { key, count, label, date: d };
      })
      .sort((a, b) => b.date - a.date)
      .slice(0, 12); // Last 12 months
  }
  
  function getProblemShipments(shipments) {
    return shipments
      .filter(s => s.status === 'problem')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);
  }
  
  function getPendingShipments(shipments) {
    return shipments
      .filter(s => s.status === 'pending' || s.status === 'shipping')
      .sort((a, b) => {
        const aDate = a.sentAt ? new Date(a.sentAt) : new Date(0);
        const bDate = b.sentAt ? new Date(b.sentAt) : new Date(0);
        return aDate - bDate; // Oldest first
      })
      .slice(0, 10);
  }
  
  function attachEvents() {
    // Click on supplier
    document.querySelectorAll('.supplier-report-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        Router.navigate('/supplier-detail', { id });
      });
    });
    
    // Click on problem/pending shipment
    document.querySelectorAll('.problem-shipment-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        Router.navigate('/shipment-detail', { id });
      });
    });
  }
  
  return { render };
})();
