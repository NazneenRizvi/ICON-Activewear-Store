import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrders, finiteNumber } from '../src/lib/orders.ts';
test('null/error responses have an empty order fallback', () => {
  for (const value of [null, undefined, {}, { error: 'missing table' }, 'html']) assert.deepEqual(normalizeOrders(value), []);
});
test('nullable snake_case database fields cannot crash dashboard search or totals', () => {
  const [order] = normalizeOrders([null, { id: 123, customer_name: null, email: 19, phone: null, total: '12.95', items: null }]);
  assert.equal(order.id.toLowerCase(), '123');
  assert.equal(order.customerName.toLowerCase(), '');
  assert.equal(order.email.toLowerCase(), '');
  assert.equal(order.total, 12.95);
  assert.deepEqual(order.items, []);
});
test('invalid numbers and item rows do not poison charts', () => {
  const [order] = normalizeOrders([{ id: 'test', total: 'bad', items: [null, { price: 'NaN', quantity: '2', name: null }] }]);
  assert.equal(order.total, 0);
  assert.equal(order.items[0].price, 0);
  assert.equal(order.items[0].quantity, 2);
  assert.equal(finiteNumber(Infinity), 0);
});
test('successful empty response clears stale orders', () => {
  assert.deepEqual(normalizeOrders([]), []);
});
test('demo orders normalize with preserved notes and status', () => {
  const [order] = normalizeOrders([{
    id: 'ICON-DEMO-123456',
    customerName: 'Test Customer',
    email: 'test@example.com',
    phone: '+971501234567',
    address: 'Downtown Dubai',
    city: 'Dubai',
    total: 89.97,
    notes: '[DEMO TRANSACTION] Test card checkout - simulated payment success',
    status: 'confirmed',
    items: [{ productId: 'prod-sculpt-tank', name: 'SCULPT TRAINING TANK', color: 'Blush Coral', size: 'S', price: 17.50, quantity: 1 }]
  }]);
  assert.equal(order.id, 'ICON-DEMO-123456');
  assert.equal(order.customerName, 'Test Customer');
  assert.equal(order.total, 89.97);
  assert.match(order.notes, /DEMO TRANSACTION/);
  assert.equal(order.items.length, 1);
});
