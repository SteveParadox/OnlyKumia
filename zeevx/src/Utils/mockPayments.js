// Lightweight in-browser mock payments & entitlement store for frontend testing
// Persists state to localStorage so flows survive reloads during dev.

const ORDERS_KEY = 'mock_payments_orders';
const ENTITLEMENTS_KEY = 'mock_entitlements';
const WALLETS_KEY = 'mock_wallets';

const read = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// simple id generator
const id = () => `${Date.now()}-${Math.floor(Math.random()*10000)}`;

export async function createOrder({ userId, type, amount, currency = 'USD', creatorId, contentId, tokens = 0 }){
  const orders = read(ORDERS_KEY);
  const order = { id: id(), userId, type, amount, currency, creatorId, contentId, tokens, status: 'created', createdAt: Date.now() };
  orders.push(order);
  write(ORDERS_KEY, orders);
  // pretend provider session id
  await wait(300);
  return { orderId: order.id, provider: 'mock', checkoutUrl: null };
}

export async function confirmPayment(orderId){
  const orders = read(ORDERS_KEY);
  const o = orders.find((x)=>x.id===orderId);
  if(!o) throw new Error('order not found');
  // simulate payment processing
  await wait(600);
  o.status = 'paid';
  o.transactionToken = `tx_${id()}`;
  write(ORDERS_KEY, orders);

  // on payment, grant entitlement and credit wallet if creator present
  if(o.type === 'subscription'){
    await grantSubscription(o.userId, o.creatorId, 30*24*3600*1000, o.id);
  }
  if(o.type === 'ppv'){
    await grantPPV(o.userId, o.contentId, 7*24*3600*1000, o.id);
  }
  if(o.type === 'tokens'){
    creditTokens(o.creatorId || 'platform', o.tokens); // tokens represent platform purchase - here credit platform wallet
    creditUserTokens(o.userId, o.tokens);
  }

  return { order: o };
}

function ensureEntitlements(){
  const e = read(ENTITLEMENTS_KEY);
  write(ENTITLEMENTS_KEY, e);
  return e;
}

export async function grantSubscription(userId, creatorId, durationMs, sourceOrderId){
  const e = read(ENTITLEMENTS_KEY);
  const expiresAt = Date.now() + durationMs;
  const ent = { id: id(), userId, creatorId, type: 'subscription', contentId: null, expiresAt, sourceOrderId, createdAt: Date.now() };
  e.push(ent);
  write(ENTITLEMENTS_KEY, e);
  return ent;
}

export async function grantPPV(userId, contentId, durationMs, sourceOrderId){
  const e = read(ENTITLEMENTS_KEY);
  const expiresAt = Date.now() + durationMs;
  const ent = { id: id(), userId, creatorId: null, type: 'ppv', contentId, expiresAt, usageLimit: 1, sourceOrderId, createdAt: Date.now() };
  e.push(ent);
  write(ENTITLEMENTS_KEY, e);
  return ent;
}

export async function getEntitlementsForUser(userId){
  const e = read(ENTITLEMENTS_KEY);
  return e.filter(x=>x.userId===userId);
}

export async function checkEntitlement(userId, contentId, creatorId){
  const e = read(ENTITLEMENTS_KEY);
  const now = Date.now();
  // subscription for creator
  const sub = e.find(x => x.userId===userId && x.type==='subscription' && x.creatorId===creatorId && x.expiresAt>now);
  if(sub) return { granted: true, type: 'subscription', expiresAt: sub.expiresAt };
  // ppv for content
  const ppv = e.find(x => x.userId===userId && x.type==='ppv' && x.contentId===contentId && x.expiresAt>now);
  if(ppv) return { granted: true, type: 'ppv', expiresAt: ppv.expiresAt };
  return { granted: false };
}

// Simple token & wallet helpers
export function readWallets(){
  return read(WALLETS_KEY);
}

export function creditUserTokens(userId, tokens){
  const w = read(WALLETS_KEY);
  let u = w.find(x=>x.userId===userId);
  if(!u){ u = { userId, tokens: 0 }; w.push(u); }
  u.tokens = (u.tokens||0) + tokens;
  write(WALLETS_KEY, w);
}

export function creditTokens(userId, tokens){
  // platform/creator wallets; simplified
  creditUserTokens(userId, tokens);
}

export function getUserTokenBalance(userId){
  const w = read(WALLETS_KEY);
  const u = w.find(x=>x.userId===userId);
  return u?.tokens || 0;
}

export function listOrders(){
  return read(ORDERS_KEY);
}

export function listEntitlements(){
  return read(ENTITLEMENTS_KEY);
}

// initialize keys if missing
(function init(){
  if(!localStorage.getItem(ORDERS_KEY)) write(ORDERS_KEY, []);
  if(!localStorage.getItem(ENTITLEMENTS_KEY)) write(ENTITLEMENTS_KEY, []);
  if(!localStorage.getItem(WALLETS_KEY)) write(WALLETS_KEY, []);
})();

export default { createOrder, confirmPayment, getEntitlementsForUser, checkEntitlement, grantPPV, grantSubscription, getUserTokenBalance, creditUserTokens, listOrders, listEntitlements };
