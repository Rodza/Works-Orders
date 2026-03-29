import api from './api';
import db from './db';

const LAST_SYNC_KEY = 'lastSyncTimestamp';

// Pull all data from server into IndexedDB
export async function pullFromServer() {
  try {
    const since = localStorage.getItem(LAST_SYNC_KEY) || '1970-01-01 00:00:00';
    const res = await api.get(`/sync.php?since=${encodeURIComponent(since)}`);

    await db.transaction('rw', [db.customers, db.products, db.work_orders], async () => {
      if (res.data.customers?.length) {
        await db.customers.bulkPut(res.data.customers);
      }
      if (res.data.products?.length) {
        await db.products.bulkPut(res.data.products);
      }
      if (res.data.work_orders?.length) {
        await db.work_orders.bulkPut(res.data.work_orders);
      }
    });

    if (res.data.timestamp) {
      localStorage.setItem(LAST_SYNC_KEY, res.data.timestamp);
    }

    return true;
  } catch {
    return false;
  }
}

// Push queued offline changes to server
export async function pushToServer() {
  const queue = await db.sync_queue.toArray();
  if (queue.length === 0) return true;

  try {
    const changes = queue.map(item => ({
      table: item.table,
      action: item.action,
      data: item.data,
    }));

    const res = await api.post('/sync.php', { changes });

    // Clear the sync queue
    await db.sync_queue.clear();

    // Update local data with server response
    if (res.data.customers) await db.customers.bulkPut(res.data.customers);
    if (res.data.products) await db.products.bulkPut(res.data.products);
    if (res.data.work_orders) await db.work_orders.bulkPut(res.data.work_orders);

    if (res.data.timestamp) {
      localStorage.setItem(LAST_SYNC_KEY, res.data.timestamp);
    }

    return true;
  } catch {
    return false;
  }
}

// Queue an offline change
export async function queueChange(table, action, data) {
  await db.sync_queue.add({
    table,
    action,
    data,
    timestamp: new Date().toISOString(),
  });
}

// Full sync: push then pull
export async function fullSync() {
  const pushed = await pushToServer();
  if (pushed) {
    await pullFromServer();
  }
  return pushed;
}

// Get pending sync count
export async function getPendingSyncCount() {
  return await db.sync_queue.count();
}
