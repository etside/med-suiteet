#!/usr/bin/env node
/**
 * Smoke-test Netlify API actions (local netlify dev or deployed URL).
 *
 * Usage:
 *   node scripts/smoke-netlify-api.mjs
 *   API_BASE=https://med-et.netlify.app/.netlify/functions/api node scripts/smoke-netlify-api.mjs
 *   SMOKE_EMAIL=admin@eMed.com SMOKE_PASSWORD=secret node scripts/smoke-netlify-api.mjs
 */
const base =
  process.env.API_BASE ||
  process.env.VITE_API_URL ||
  'http://localhost:8888/.netlify/functions/api';

const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;

const publicActions = [
  ['GET', 'health'],
  ['GET', 'products'],
  ['GET', 'settings'],
  ['GET', 'categories'],
];

const authedActions = [
  ['GET', 'auth_me'],
  ['GET', 'dashboard'],
  ['GET', 'orders'],
  ['GET', 'sales'],
  ['GET', 'suppliers'],
  ['GET', 'purchase_orders'],
  ['GET', 'profiles'],
  ['GET', 'user_roles'],
  ['GET', 'notifications'],
  ['GET', 'manufacturers'],
  ['GET', 'cms_content'],
];

async function call(method, action, { token, body } = {}) {
  const url = new URL(base, 'http://localhost');
  url.searchParams.set('action', action);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

let failed = 0;

async function main() {
  console.log('API base:', base);

  for (const [method, action] of publicActions) {
    const r = await call(method, action);
    const pass = r.ok && !String(r.json.error || '').includes('Invalid action');
    console.log(`${pass ? 'OK' : 'FAIL'} ${method} ${action} → ${r.status}`);
    if (!pass) {
      failed++;
      console.log(' ', r.json);
    }
  }

  let token = null;
  if (email && password) {
    const login = await call('POST', 'auth_login', {
      body: { email, password },
    });
    token = login.json?.data?.token;
    console.log(login.ok ? 'OK login' : 'FAIL login', login.status);
    if (!login.ok) failed++;
  } else {
    console.log('Skip authed actions (set SMOKE_EMAIL + SMOKE_PASSWORD)');
  }

  if (token) {
    for (const [method, action] of authedActions) {
      const r = await call(method, action, { token });
      const pass = r.ok && !String(r.json.error || '').includes('Invalid action');
      console.log(`${pass ? 'OK' : 'FAIL'} ${method} ${action} → ${r.status}`);
      if (!pass) {
        failed++;
        console.log(' ', r.json.error || r.json);
      }
    }
  }

  const invalid = await call('GET', 'not_a_real_action');
  if (invalid.status === 400) {
    console.log('OK invalid action returns 400');
  } else {
    console.log('FAIL invalid action expected 400, got', invalid.status);
    failed++;
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
