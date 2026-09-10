/**
 * State Module
 * Simple observable state management
 */
window.State = (function() {
  'use strict';
  
  // ============================================
  // State
  // ============================================
  
  const state = {
    // App state
    initialized: false,
    currentRoute: 'dashboard',
    theme: 'light',
    
    // Data caches
    shipments: [],
    suppliers: [],
    settings: {},
    
    // UI state
    searchQuery: '',
    filterStatus: 'all',
    sortBy: 'receivedAt-desc'
  };
  
  // ============================================
  // Subscribers
  // ============================================
  
  const subscribers = {};
  
  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {function} callback - Callback when key changes
   * @returns {function} Unsubscribe function
   */
  function subscribe(key, callback) {
    if (!subscribers[key]) {
      subscribers[key] = [];
    }
    subscribers[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify subscribers of a state change
   */
  function notify(key, value) {
    if (subscribers[key]) {
      subscribers[key].forEach(callback => {
        try {
          callback(value, key);
        } catch (err) {
          console.error('Subscriber error:', err);
        }
      });
    }
  }
  
  // ============================================
  // Getters & Setters
  // ============================================
  
  function get(key) {
    return state[key];
  }
  
  function set(key, value) {
    state[key] = value;
    notify(key, value);
  }
  
  function update(key, updater) {
    const currentValue = state[key];
    const newValue = updater(currentValue);
    set(key, newValue);
    return newValue;
  }
  
  // ============================================
  // Data Helpers
  // ============================================
  
  /**
   * Load all shipments from DB into state
   */
  async function loadShipments() {
    const shipments = await DB.getAll(DB.STORES.SHIPMENTS);
    // Sort by displayIndex desc (newest first)
    shipments.sort((a, b) => b.displayIndex - a.displayIndex);
    set('shipments', shipments);
    return shipments;
  }
  
  /**
   * Load all suppliers from DB into state
   */
  async function loadSuppliers() {
    const suppliers = await DB.getAll(DB.STORES.SUPPLIERS);
    // Sort by name
    suppliers.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    set('suppliers', suppliers);
    return suppliers;
  }
  
  /**
   * Load settings from DB into state
   */
  async function loadSettings() {
    const settings = await DB.getAll(DB.STORES.SETTINGS);
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    set('settings', settingsObj);
    return settingsObj;
  }
  
  /**
   * Get shipment by ID
   */
  function getShipment(id) {
    return state.shipments.find(s => s.id === id);
  }
  
  /**
   * Get shipment by barcode
   */
  function getShipmentByBarcode(barcode) {
    const normalized = Utils.normalizeBarcode(barcode);
    return state.shipments.find(s => 
      Utils.normalizeBarcode(s.barcode) === normalized
    );
  }
  
  /**
   * Get supplier by ID
   */
  function getSupplier(id) {
    return state.suppliers.find(s => s.id === id);
  }
  
  /**
   * Get supplier by name
   */
  function getSupplierByName(name) {
    return state.suppliers.find(s => s.name === name);
  }
  
  /**
   * Get shipments filtered by supplier
   */
  function getShipmentsBySupplier(supplierId) {
    return state.shipments.filter(s => s.supplierId === supplierId);
  }
  
  /**
   * Get filtered shipments based on current filters
   */
  function getFilteredShipments() {
    let filtered = [...state.shipments];
    
    // Filter by status
    if (state.filterStatus && state.filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === state.filterStatus);
    }
    
    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const supplier = getSupplier(s.supplierId);
        const supplierName = supplier ? supplier.name : '';
        return (
          (s.barcode && s.barcode.toLowerCase().includes(query)) ||
          (s.contents && s.contents.toLowerCase().includes(query)) ||
          (s.notes && s.notes.toLowerCase().includes(query)) ||
          (s.senderName && s.senderName.toLowerCase().includes(query)) ||
          (supplierName && supplierName.toLowerCase().includes(query)) ||
          (supplier && supplier.city && supplier.city.toLowerCase().includes(query)) ||
          (supplier && supplier.phone && supplier.phone.includes(query))
        );
      });
    }
    
    // Sort
    const [sortField, sortDir] = (state.sortBy || 'receivedAt-desc').split('-');
    filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (sortField === 'displayIndex') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }
  
  /**
   * Compute dashboard statistics
   */
  function getStats() {
    const shipments = state.shipments;
    const now = new Date();
    const startOfToday = Utils.startOfToday();
    const startOfMonth = Utils.startOfMonth();
    
    return {
      total: shipments.length,
      todayReceived: shipments.filter(s => {
        if (!s.receivedAt) return false;
        return new Date(s.receivedAt) >= startOfToday;
      }).length,
      monthReceived: shipments.filter(s => {
        if (!s.receivedAt) return false;
        return new Date(s.receivedAt) >= startOfMonth;
      }).length,
      pending: shipments.filter(s => s.status === 'pending').length,
      shipping: shipments.filter(s => s.status === 'shipping').length,
      delivered: shipments.filter(s => s.status === 'delivered').length,
      problem: shipments.filter(s => s.status === 'problem').length,
      returned: shipments.filter(s => s.status === 'returned').length,
      cancelled: shipments.filter(s => s.status === 'cancelled').length
    };
  }
  
  // ============================================
  // Public API
  // ============================================
  
  return {
    get,
    set,
    update,
    subscribe,
    loadShipments,
    loadSuppliers,
    loadSettings,
    getShipment,
    getShipmentByBarcode,
    getSupplier,
    getSupplierByName,
    getShipmentsBySupplier,
    getFilteredShipments,
    getStats
  };
  
})();