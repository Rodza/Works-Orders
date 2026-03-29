import Dexie from 'dexie';

const db = new Dexie('SAGrindingDB');

db.version(1).stores({
  work_orders: 'unique_id, work_order, status, customer_id, order_date, updated_at',
  customers: 'customer_id, customer_name, updated_at',
  products: 'size, updated_at',
  users: 'id, user_email',
  sync_queue: '++id, table, action, timestamp',
});

export default db;
