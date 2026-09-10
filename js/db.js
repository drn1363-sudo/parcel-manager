/**
 * Database Module
 * IndexedDB wrapper with Promise-based API
 */
window.DB = (function() {
  'use strict';
  
  const DB_NAME = 'ParcelManagerDB';
  const DB_VERSION = 1;
  
  const STORES = {
    SHIPMENTS: 'shipments',
    SUPPLIERS: 'suppliers',
    STATUS_HISTORY: 'statusHistory',
    SETTINGS: 'settings',
    PHOTOS: 'photos'
  };
  
  let db = null;
  
  // ============================================
  // Initialization
  // ============================================
  
  function init() {
    return new Promise((resolve, reject) => {
      if (db) {
        resolve(db);
        return;
      }
      
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported in this browser'));
        return;
      }
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };
      
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        
        // Shipments store
        if (!database.objectStoreNames.contains(STORES.SHIPMENTS)) {
          const shipmentStore = database.createObjectStore(STORES.SHIPMENTS, { keyPath: 'id' });
          shipmentStore.createIndex('barcode', 'barcode', { unique: true });
          shipmentStore.createIndex('supplierId', 'supplierId', { unique: false });
          shipmentStore.createIndex('status', 'status', { unique: false });
          shipmentStore.createIndex('receivedAt', 'receivedAt', { unique: false });
          shipmentStore.createIndex('displayIndex', 'displayIndex', { unique: true });
        }
        
        // Suppliers store
        if (!database.objectStoreNames.contains(STORES.SUPPLIERS)) {
          const supplierStore = database.createObjectStore(STORES.SUPPLIERS, { keyPath: 'id' });
          supplierStore.createIndex('name', 'name', { unique: true });
        }
        
        // Status History store
        if (!database.objectStoreNames.contains(STORES.STATUS_HISTORY)) {
          const historyStore = database.createObjectStore(STORES.STATUS_HISTORY, { keyPath: 'id' });
          historyStore.createIndex('shipmentId', 'shipmentId', { unique: false });
          historyStore.createIndex('changedAt', 'changedAt', { unique: false });
        }
        
        // Settings store
        if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
          database.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
        
        // Photos store (for future use)
        if (!database.objectStoreNames.contains(STORES.PHOTOS)) {
          const photoStore = database.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
          photoStore.createIndex('shipmentId', 'shipmentId', { unique: false });
        }
      };
    });
  }
  
  // ============================================
  // Generic CRUD Operations
  // ============================================
  
  function transaction(storeName, mode = 'readonly') {
    return db.transaction(storeName, mode).objectStore(storeName);
  }
  
  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  function getAll(storeName) {
    return init().then(() => {
      const store = transaction(storeName);
      return promisifyRequest(store.getAll());
    });
  }
  
  function get(storeName, id) {
    return init().then(() => {
      const store = transaction(storeName);
      return promisifyRequest(store.get(id));
    });
  }
  
  function add(storeName, item) {
    return init().then(() => {
      const store = transaction(storeName, 'readwrite');
      return promisifyRequest(store.add(item));
    });
  }
  
  function put(storeName, item) {
    return init().then(() => {
      const store = transaction(storeName, 'readwrite');
      return promisifyRequest(store.put(item));
    });
  }
  
  function remove(storeName, id) {
    return init().then(() => {
      const store = transaction(storeName, 'readwrite');
      return promisifyRequest(store.delete(id));
    });
  }
  
  function clear(storeName) {
    return init().then(() => {
      const store = transaction(storeName, 'readwrite');
      return promisifyRequest(store.clear());
    });
  }
  
  function count(storeName) {
    return init().then(() => {
      const store = transaction(storeName);
      return promisifyRequest(store.count());
    });
  }
  
  function getByIndex(storeName, indexName, value) {
    return init().then(() => {
      const store = transaction(storeName);
      const index = store.index(indexName);
      return promisifyRequest(index.get(value));
    });
  }
  
  function getAllByIndex(storeName, indexName, value) {
    return init().then(() => {
      const store = transaction(storeName);
      const index = store.index(indexName);
      return promisifyRequest(index.getAll(value));
    });
  }
  
  // ============================================
  // Settings Helpers
  // ============================================
  
  function getSetting(key, defaultValue = null) {
    return get(STORES.SETTINGS, key).then(item => {
      return item ? item.value : defaultValue;
    });
  }
  
  function setSetting(key, value) {
    return put(STORES.SETTINGS, { key, value });
  }
  
  // ============================================
  // Display Index Helpers (NEW)
  // ============================================
  
  async function getNextDisplayIndex() {
    let nextIndex = await getSetting('nextDisplayIndex', 1);
    await setSetting('nextDisplayIndex', nextIndex + 1);
    return nextIndex;
  }
  
  // ============================================
  // Bulk Operations
  // ============================================
  
  function clearAll() {
    return init().then(() => {
      const tx = db.transaction(Object.values(STORES), 'readwrite');
      const promises = Object.values(STORES).map(storeName => {
        return promisifyRequest(tx.objectStore(storeName).clear());
      });
      return Promise.all(promises);
    });
  }
  
  function exportAll() {
    return init().then(() => {
      const promises = Object.values(STORES).map(storeName => {
        return getAll(storeName).then(items => ({ storeName, items }));
      });
      return Promise.all(promises).then(results => {
        const data = {};
        results.forEach(({ storeName, items }) => {
          data[storeName] = items;
        });
        return {
          version: DB_VERSION,
          exportedAt: new Date().toISOString(),
          appName: 'ParcelManager',
          data
        };
      });
    });
  }
  
  function importAll(backupData) {
    if (!backupData || !backupData.data) {
      return Promise.reject(new Error('Invalid backup data'));
    }
    
    return init().then(() => {
      return clearAll().then(() => {
        const promises = [];
        Object.entries(backupData.data).forEach(([storeName, items]) => {
          if (Object.values(STORES).includes(storeName) && Array.isArray(items)) {
            items.forEach(item => {
              promises.push(put(storeName, item));
            });
          }
        });
        return Promise.all(promises);
      });
    });
  }
  
  // ============================================
  // Public API
  // ============================================
  
  return {
    STORES,
    init,
    getAll,
    get,
    add,
    put,
    remove,
    clear,
    count,
    getByIndex,
    getAllByIndex,
    getSetting,
    setSetting,
    getNextDisplayIndex,
    clearAll,
    exportAll,
    importAll
  };
  
})();
