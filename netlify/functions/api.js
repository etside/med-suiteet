// netlify/functions/api.js — Neon PostgreSQL API (parity with public/api/index.php)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

const ALLOWED_ORIGINS = [
  'https://med-et.netlify.app',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
if (process.env.ALLOWED_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.ALLOWED_ORIGIN);
}

const STAFF_ROLES = new Set(['staff', 'admin', 'super_admin']);

function corsHeaders(origin) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o) || origin === o)
      ? origin
      : ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };
}

function jsonResponse(statusCode, origin, body) {
  return { statusCode, headers: corsHeaders(origin), body: JSON.stringify(body) };
}

function parseBody(event) {
  if (!event.body) return {};
  let bodyStr = event.body;
  if (event.isBase64Encoded) {
    bodyStr = Buffer.from(event.body, 'base64').toString('utf-8');
  }
  if (event.headers['content-type']?.includes('multipart/form-data')) {
    return {};
  }
  try {
    return JSON.parse(bodyStr);
  } catch {
    return {};
  }
}

function verifyJwt(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return jwt.verify(token, JWT_SECRET);
}

async function requireAuth(event) {
  const decoded = verifyJwt(event);
  const result = await query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);
  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return { ...decoded, ...result.rows[0] };
}

function requireRoles(user, roles) {
  const role = user.role || 'customer';
  if (!roles.includes(role)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}

function isStaff(role) {
  return STAFF_ROLES.has(role);
}

function mapProduct(row) {
  if (!row) return row;
  return {
    ...row,
    stock: row.quantity,
    min_stock: row.min_quantity,
  };
}

function mapProducts(rows) {
  return rows.map(mapProduct);
}

function productBodyToDb(b) {
  return {
    name: b.name ?? '',
    name_bn: b.name_bn ?? null,
    generic_name: b.generic_name ?? null,
    manufacturer: b.manufacturer ?? null,
    category: b.category ?? null,
    price: Number(b.price) || 0,
    quantity: Number(b.stock ?? b.quantity) || 0,
    min_quantity: Number(b.min_stock ?? b.min_quantity) || 10,
    batch_number: b.batch_number ?? null,
    expiry_date: b.expiry_date || null,
    requires_prescription: Boolean(b.requires_prescription),
    description: b.description ?? null,
    description_bn: b.description_bn ?? null,
    image_url: b.image_url ?? null,
  };
}

function handleError(origin, error) {
  console.error('API Error:', error);
  const status = error.status || 500;
  return jsonResponse(status, origin, {
    error: error.message || 'Internal server error',
    ...(status === 500 && error.message ? { details: error.message } : {}),
  });
}

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '';

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(origin), body: '' };
  }

  const params = event.queryStringParameters || {};
  const action = params.action;
  const method = event.httpMethod;

  try {
    if (action === 'health') {
      return jsonResponse(200, origin, {
        status: 'ok',
        service: 'Medsuite-eT Netlify API',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
      });
    }

    if ((action === 'auth_login' || action === 'login') && method === 'POST') {
      return await handleLogin(event, origin);
    }
    if ((action === 'auth_signup' || action === 'signup') && method === 'POST') {
      return await handleSignup(event, origin);
    }
    if (action === 'auth_me' || action === 'user') {
      return await handleGetUser(event, origin);
    }
    if (action === 'auth_password' && method === 'POST') {
      return await handleAuthPassword(event, origin);
    }
    if (action === 'auth_pin' && method === 'POST') {
      return jsonResponse(501, origin, { error: 'PIN auth not enabled on Netlify yet' });
    }
    if (action === 'auth_logs' && method === 'GET') {
      return await handleAuthLogs(event, origin);
    }
    if (
      action === 'auth_biometric' ||
      action === 'auth_biometric_status' ||
      action === 'auth_webauthn_register_options' ||
      action === 'auth_webauthn_login_options' ||
      action === 'auth_enroll_biometric' ||
      action === 'auth_biometric_remove' ||
      action === 'auth_set_pin'
    ) {
      return jsonResponse(501, origin, { error: `${action} not available on Netlify` });
    }

    if (action === 'products') {
      if (method === 'GET') return await handleProductsList(event, origin);
      if (method === 'POST') return await handleProductsCreate(event, origin);
      return jsonResponse(405, origin, { error: 'Method not allowed' });
    }
    if (action === 'product') {
      return await handleProduct(event, origin);
    }

    if (action === 'orders') return await handleOrders(event, origin);
    if (action === 'order_items') return await handleOrderItems(event, origin);
    if (action === 'track') return await handleTrack(event, origin);
    if (action === 'sales') return await handleSales(event, origin);
    if (action === 'settings') return await handleSettings(event, origin);
    if (action === 'profiles') return await handleProfiles(event, origin);
    if (action === 'user_roles') return await handleUserRoles(event, origin);
    if (action === 'suppliers') return await handleSuppliers(event, origin);
    if (action === 'purchase_orders') return await handlePurchaseOrders(event, origin);
    if (action === 'notifications') return await handleNotifications(event, origin);
    if (action === 'dashboard') return await handleDashboard(event, origin);
    if (action === 'upload') return await handleUpload(event, origin);
    if (action === 'cms_content') return await handleCmsContent(event, origin);
    if (action === 'manufacturers') return await handleManufacturers(event, origin);
    if (action === 'categories') return await handleCategories(event, origin);

    return jsonResponse(400, origin, { error: 'Invalid action: ' + (action || 'not provided') });
  } catch (error) {
    return handleError(origin, error);
  }
};

async function handleLogin(event, origin) {
  const body = parseBody(event);
  const email = String(body.email || '').trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return jsonResponse(400, origin, { error: 'Email and password required' });
  }

  const result = await query(
    'SELECT id, email, password, role FROM users WHERE LOWER(email) = $1',
    [email]
  );
  if (result.rows.length === 0) {
    return jsonResponse(401, origin, { error: 'Invalid email or password' });
  }

  const user = result.rows[0];
  const stored = user.password || '';
  const passwordOk =
    stored.startsWith('$2a$') || stored.startsWith('$2b$')
      ? await bcrypt.compare(password, stored)
      : stored === password;

  if (!passwordOk) {
    return jsonResponse(401, origin, { error: 'Invalid email or password' });
  }

  if (!stored.startsWith('$2')) {
    const hash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return jsonResponse(200, origin, {
    data: {
      token,
      user: { id: String(user.id), email: user.email },
      roles: [user.role],
      approval_status: 'approved',
    },
  });
}

async function handleSignup(event, origin) {
  const body = parseBody(event);
  const email = String(body.email || '').trim().toLowerCase();
  const password = body.password;
  const fullName = String(body.full_name || body.fullName || '').trim();

  if (!email || !password || password.length < 8) {
    return jsonResponse(400, origin, { error: 'Valid email and password (8+ chars) required' });
  }

  const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
  if (existing.rows.length > 0) {
    return jsonResponse(409, origin, { error: 'Email already registered' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
    [email, hash, 'customer']
  );
  const user = result.rows[0];

  await query(
    `INSERT INTO profiles (user_id, full_name, approval_status) VALUES ($1, $2, 'approved')
     ON CONFLICT (user_id) DO NOTHING`,
    [user.id, fullName || null]
  );

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return jsonResponse(201, origin, {
    data: {
      token,
      user: { id: String(user.id), email: user.email },
      roles: [user.role],
      approval_status: 'approved',
      message: 'Account created',
    },
  });
}

async function handleGetUser(event, origin) {
  const user = await requireAuth(event);
  const profileRes = await query('SELECT * FROM profiles WHERE user_id = $1', [user.id]);
  const profile = profileRes.rows[0] || {};
  return jsonResponse(200, origin, {
    data: {
      user: { id: String(user.id), email: user.email },
      roles: [user.role],
      profile,
      approval_status: profile.approval_status || 'approved',
    },
  });
}

async function handleAuthPassword(event, origin) {
  const user = await requireAuth(event);
  const body = parseBody(event);
  const newPassword = body.password || '';
  if (newPassword.length < 8) {
    return jsonResponse(400, origin, { error: 'Password must be at least 8 characters' });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
  return jsonResponse(200, origin, { data: { message: 'Password updated' } });
}

async function handleAuthLogs(event, origin) {
  await requireAuth(event);
  const limit = Math.min(100, Math.max(1, parseInt(paramsLimit(event), 10) || 50));
  try {
    const result = await query(
      'SELECT * FROM auth_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return jsonResponse(200, origin, { data: result.rows });
  } catch {
    return jsonResponse(200, origin, { data: [] });
  }
}

function paramsLimit(event) {
  return (event.queryStringParameters || {}).limit;
}

async function handleProductsList(event, origin) {
  const params = event.queryStringParameters || {};
  const category = params.category;
  const search = params.search;
  const limit = Math.min(20000, Math.max(1, parseInt(params.limit, 10) || 10000));

  let sql = 'SELECT * FROM products WHERE 1=1';
  const qParams = [];
  if (category) {
    qParams.push(category);
    sql += ` AND category = $${qParams.length}`;
  }
  if (search) {
    qParams.push(`%${search}%`);
    const i = qParams.length;
    qParams.push(`%${search}%`);
    sql += ` AND (name ILIKE $${i} OR generic_name ILIKE $${i + 1})`;
  }
  qParams.push(limit);
  sql += ` ORDER BY name ASC LIMIT $${qParams.length}`;

  const result = await query(sql, qParams);
  return jsonResponse(200, origin, { data: mapProducts(result.rows) });
}

async function handleProductsCreate(event, origin) {
  const user = await requireAuth(event);
  requireRoles(user, ['staff', 'admin', 'super_admin']);
  const b = productBodyToDb(parseBody(event));
  const result = await query(
    `INSERT INTO products (name, name_bn, generic_name, manufacturer, category, price, quantity, min_quantity,
      batch_number, expiry_date, requires_prescription, description, description_bn, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id`,
    [
      b.name,
      b.name_bn,
      b.generic_name,
      b.manufacturer,
      b.category,
      b.price,
      b.quantity,
      b.min_quantity,
      b.batch_number,
      b.expiry_date,
      b.requires_prescription,
      b.description,
      b.description_bn,
      b.image_url,
    ]
  );
  return jsonResponse(201, origin, { data: { id: String(result.rows[0].id) } });
}

async function handleProduct(event, origin) {
  const params = event.queryStringParameters || {};
  const id = params.id;
  if (!id) return jsonResponse(400, origin, { error: 'id required' });

  if (event.httpMethod === 'GET') {
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) return jsonResponse(404, origin, { error: 'Not found' });
    return jsonResponse(200, origin, { data: mapProduct(result.rows[0]) });
  }

  const user = await requireAuth(event);
  requireRoles(user, ['staff', 'admin', 'super_admin']);

  if (event.httpMethod === 'PUT') {
    const b = productBodyToDb(parseBody(event));
    await query(
      `UPDATE products SET name=$1, name_bn=$2, generic_name=$3, manufacturer=$4, category=$5, price=$6,
        quantity=$7, min_quantity=$8, batch_number=$9, expiry_date=$10, requires_prescription=$11,
        description=$12, description_bn=$13, image_url=$14, updated_at=NOW() WHERE id=$15`,
      [
        b.name,
        b.name_bn,
        b.generic_name,
        b.manufacturer,
        b.category,
        b.price,
        b.quantity,
        b.min_quantity,
        b.batch_number,
        b.expiry_date,
        b.requires_prescription,
        b.description,
        b.description_bn,
        b.image_url,
        id,
      ]
    );
    return jsonResponse(200, origin, { data: { id: String(id) } });
  }

  if (event.httpMethod === 'DELETE') {
    await query('DELETE FROM products WHERE id = $1', [id]);
    return jsonResponse(200, origin, { data: { deleted: true } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handleOrders(event, origin) {
  const user = await requireAuth(event);
  const params = event.queryStringParameters || {};
  const method = event.httpMethod;

  if (method === 'GET') {
    const status = params.status;
    const forUser = params.user_id;
    let sql;
    let qParams = [];

    if (isStaff(user.role)) {
      sql = 'SELECT * FROM orders WHERE 1=1';
      if (status) {
        qParams.push(status);
        sql += ` AND status = $${qParams.length}`;
      }
      if (forUser) {
        qParams.push(forUser);
        sql += ` AND user_id = $${qParams.length}`;
      }
      sql += ' ORDER BY created_at DESC LIMIT 500';
    } else {
      sql = 'SELECT * FROM orders WHERE user_id = $1';
      qParams = [user.id];
      if (status) {
        qParams.push(status);
        sql += ` AND status = $${qParams.length}`;
      }
      sql += ' ORDER BY created_at DESC LIMIT 100';
    }
    const result = await query(sql, qParams);
    return jsonResponse(200, origin, { data: result.rows });
  }

  if (method === 'POST') {
    const b = parseBody(event);
    if (!b.customer_name || !b.customer_phone || !b.items?.length) {
      return jsonResponse(400, origin, { error: 'Missing order fields' });
    }

    let subtotal = 0;
    for (const item of b.items) {
      subtotal += (Number(item.unit_price) || 0) * (Number(item.quantity) || 1);
    }
    const deliveryFee =
      Number(b.delivery_fee) || ((b.payment_method || 'cod') === 'cod' ? 50 : 0);
    const total = subtotal + deliveryFee;
    const orderNumber =
      b.order_number || 'ORD-' + Date.now().toString(36).toUpperCase();

    const orderRes = await query(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_phone, customer_address,
        payment_method, payment_status, transaction_id, subtotal, delivery_fee, total, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        orderNumber,
        user.id,
        b.customer_name,
        b.customer_phone,
        b.customer_address || null,
        b.payment_method || 'cod',
        b.payment_status || 'pending',
        b.transaction_id || null,
        subtotal,
        deliveryFee,
        total,
        b.status || 'pending',
        b.notes || null,
      ]
    );
    const orderId = orderRes.rows[0].id;

    for (const item of b.items) {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || 0;
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [orderId, item.product_id, item.product_name, qty, unitPrice, unitPrice * qty]
      );
      if (item.product_id) {
        await query(
          'UPDATE products SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1',
          [qty, item.product_id]
        );
      }
    }

    return jsonResponse(201, origin, {
      data: { id: String(orderId), order_number: orderNumber, total },
    });
  }

  if (method === 'PUT') {
    requireRoles(user, ['staff', 'admin', 'super_admin']);
    const b = parseBody(event);
    const orderId = b.id || params.id;
    if (!orderId) return jsonResponse(400, origin, { error: 'id required' });

    const sets = [];
    const qParams = [];
    for (const field of ['status', 'payment_status']) {
      if (Object.prototype.hasOwnProperty.call(b, field)) {
        qParams.push(b[field]);
        sets.push(`${field} = $${qParams.length}`);
      }
    }
    if (!sets.length) return jsonResponse(400, origin, { error: 'Nothing to update' });
    qParams.push(orderId);
    await query(`UPDATE orders SET ${sets.join(', ')}, updated_at=NOW() WHERE id = $${qParams.length}`, qParams);
    return jsonResponse(200, origin, { data: { id: String(orderId) } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handleOrderItems(event, origin) {
  await requireAuth(event);
  const orderId = (event.queryStringParameters || {}).order_id;
  if (!orderId) return jsonResponse(400, origin, { error: 'order_id required' });
  const result = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
  return jsonResponse(200, origin, { data: result.rows });
}

async function handleTrack(event, origin) {
  const orderNumber = (event.queryStringParameters || {}).order_number;
  if (!orderNumber) return jsonResponse(400, origin, { error: 'order_number required' });

  const result = await query('SELECT * FROM orders WHERE UPPER(order_number) = UPPER($1)', [
    orderNumber.trim(),
  ]);
  if (result.rows.length === 0) return jsonResponse(404, origin, { error: 'Order not found' });

  const order = result.rows[0];
  const items = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
  order.items = items.rows;
  return jsonResponse(200, origin, { data: order });
}

async function handleSales(event, origin) {
  const user = await requireAuth(event);
  const method = event.httpMethod;

  if (method === 'GET') {
    requireRoles(user, ['staff', 'admin', 'super_admin']);
    const since = (event.queryStringParameters || {}).since;
    let sql = 'SELECT * FROM sales WHERE 1=1';
    const qParams = [];
    if (since) {
      qParams.push(since);
      sql += ` AND created_at >= $${qParams.length}`;
    }
    sql += ' ORDER BY created_at DESC LIMIT 500';
    const result = await query(sql, qParams);
    return jsonResponse(200, origin, { data: result.rows });
  }

  if (method === 'POST') {
    requireRoles(user, ['staff', 'admin', 'super_admin']);
    const b = parseBody(event);
    const items = b.items || [];
    const result = await query(
      `INSERT INTO sales (invoice_number, customer_name, customer_phone, items, subtotal, discount, vat, total, payment_method, sold_by)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        b.invoice_number || 'INV-' + Date.now(),
        b.customer_name || 'Walk-in Customer',
        b.customer_phone || null,
        JSON.stringify(items),
        b.subtotal ?? 0,
        b.discount ?? 0,
        b.vat ?? 0,
        b.total ?? 0,
        b.payment_method || 'cash',
        user.id,
      ]
    );

    for (const item of items) {
      const pid = item.id || item.product_id;
      const qty = Number(item.qty || item.quantity) || 0;
      if (pid && qty > 0) {
        await query('UPDATE products SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1', [
          qty,
          pid,
        ]);
      }
    }

    return jsonResponse(201, origin, { data: { id: String(result.rows[0].id) } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handleSettings(event, origin) {
  if (event.httpMethod === 'GET') {
    const result = await query('SELECT * FROM pharmacy_settings ORDER BY updated_at DESC LIMIT 1');
    const row = result.rows[0] || null;
    if (row) row.shop_enabled = Boolean(row.shop_enabled);
    return jsonResponse(200, origin, { data: row });
  }

  const user = await requireAuth(event);
  requireRoles(user, ['staff', 'admin', 'super_admin']);
  const b = parseBody(event);

  if (event.httpMethod === 'PUT' && b.id) {
    await query(
      `UPDATE pharmacy_settings SET pharmacy_name=$1, phone=$2, email=$3, address=$4, license_number=$5,
        logo_url=$6, bkash_number=$7, nagad_number=$8, shop_enabled=$9, updated_at=NOW() WHERE id=$10`,
      [
        b.pharmacy_name ?? 'Medsuite-eT Pharmacy',
        b.phone ?? null,
        b.email ?? null,
        b.address ?? null,
        b.license_number ?? null,
        b.logo_url ?? null,
        b.bkash_number ?? null,
        b.nagad_number ?? null,
        Boolean(b.shop_enabled),
        b.id,
      ]
    );
    return jsonResponse(200, origin, { data: { id: String(b.id) } });
  }

  if (event.httpMethod === 'POST') {
    const result = await query(
      `INSERT INTO pharmacy_settings (pharmacy_name, phone, email, address, license_number, logo_url, bkash_number, nagad_number, shop_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        b.pharmacy_name ?? 'Medsuite-eT Pharmacy',
        b.phone ?? null,
        b.email ?? null,
        b.address ?? null,
        b.license_number ?? null,
        b.logo_url ?? null,
        b.bkash_number ?? null,
        b.nagad_number ?? null,
        Boolean(b.shop_enabled),
      ]
    );
    return jsonResponse(201, origin, { data: { id: String(result.rows[0].id) } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handleProfiles(event, origin) {
  const user = await requireAuth(event);
  const params = event.queryStringParameters || {};

  if (event.httpMethod === 'GET') {
    if (isStaff(user.role) && params.self !== '1') {
      const result = await query(
        'SELECT user_id, full_name, phone, address, approval_status, created_at FROM profiles ORDER BY created_at DESC'
      );
      return jsonResponse(200, origin, { data: result.rows });
    }
    const result = await query('SELECT * FROM profiles WHERE user_id = $1', [user.id]);
    return jsonResponse(200, origin, { data: result.rows[0] || null });
  }

  if (event.httpMethod === 'PUT') {
    const b = parseBody(event);
    const target = b.user_id || user.id;
    if (String(target) !== String(user.id)) {
      requireRoles(user, ['super_admin', 'admin']);
    }
    if (b.approval_status) {
      requireRoles(user, ['super_admin', 'admin']);
      await query('UPDATE profiles SET approval_status = $1, updated_at=NOW() WHERE user_id = $2', [
        b.approval_status,
        target,
      ]);
    } else {
      await query(
        'UPDATE profiles SET full_name=$1, phone=$2, address=$3, updated_at=NOW() WHERE user_id=$4',
        [b.full_name ?? null, b.phone ?? null, b.address ?? null, target]
      );
    }
    return jsonResponse(200, origin, { data: { user_id: String(target) } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handleUserRoles(event, origin) {
  const user = await requireAuth(event);
  requireRoles(user, ['admin', 'super_admin']);
  const params = event.queryStringParameters || {};

  if (event.httpMethod === 'GET') {
    const result = await query(
      `SELECT u.id AS user_id, COALESCE(ur.role, u.role) AS role
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id`
    );
    return jsonResponse(200, origin, { data: result.rows.map((r) => ({ user_id: String(r.user_id), role: r.role })) });
  }

  if (event.httpMethod === 'PUT') {
    const b = parseBody(event);
    if (!b.user_id || !b.role) return jsonResponse(400, origin, { error: 'user_id and role required' });
    await query('DELETE FROM user_roles WHERE user_id = $1', [b.user_id]);
    await query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [b.user_id, b.role]);
    await query('UPDATE users SET role = $1 WHERE id = $2', [b.role, b.user_id]);
    return jsonResponse(200, origin, { data: { user_id: String(b.user_id), role: b.role } });
  }

  if (event.httpMethod === 'DELETE') {
    requireRoles(user, ['super_admin']);
    const target = params.user_id || parseBody(event).user_id;
    if (!target) return jsonResponse(400, origin, { error: 'user_id required' });
    await query('DELETE FROM notifications WHERE user_id = $1', [target]).catch(() => {});
    await query('DELETE FROM user_roles WHERE user_id = $1', [target]).catch(() => {});
    await query('DELETE FROM profiles WHERE user_id = $1', [target]).catch(() => {});
    await query('DELETE FROM users WHERE id = $1', [target]);
    return jsonResponse(200, origin, { data: { deleted: true } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handleSuppliers(event, origin) {
  const user = await requireAuth(event);
  requireRoles(user, ['staff', 'admin', 'super_admin']);

  if (event.httpMethod === 'GET') {
    const result = await query('SELECT * FROM suppliers ORDER BY name');
    return jsonResponse(200, origin, { data: result.rows });
  }

  if (event.httpMethod === 'POST') {
    const b = parseBody(event);
    const result = await query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [b.name ?? '', b.contact_person ?? null, b.phone ?? null, b.email ?? null, b.address ?? null]
    );
    return jsonResponse(201, origin, { data: { id: String(result.rows[0].id) } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handlePurchaseOrders(event, origin) {
  const user = await requireAuth(event);
  requireRoles(user, ['staff', 'admin', 'super_admin']);

  if (event.httpMethod === 'GET') {
    const result = await query(
      `SELECT po.*, s.name AS supplier_name FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id ORDER BY po.created_at DESC`
    );
    return jsonResponse(200, origin, { data: result.rows });
  }

  if (event.httpMethod === 'POST') {
    const b = parseBody(event);
    const poRes = await query(
      'INSERT INTO purchase_orders (po_number, supplier_id, created_by, status, total, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [
        b.po_number || 'PO-' + Date.now(),
        b.supplier_id || null,
        user.id,
        b.status || 'draft',
        b.total ?? 0,
        b.notes || null,
      ]
    );
    const poId = poRes.rows[0].id;
    for (const item of b.items || []) {
      await query(
        `INSERT INTO purchase_order_items (po_id, product_id, product_name, quantity, unit_cost, total_cost)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          poId,
          item.product_id || null,
          item.product_name ?? '',
          item.quantity ?? 1,
          item.unit_cost ?? 0,
          item.total_cost ?? 0,
        ]
      );
    }
    return jsonResponse(201, origin, { data: { id: String(poId) } });
  }

  if (event.httpMethod === 'PUT') {
    const b = parseBody(event);
    const id = b.id || (event.queryStringParameters || {}).id;
    if (!id) return jsonResponse(400, origin, { error: 'id required' });
    await query('UPDATE purchase_orders SET status = $1, updated_at=NOW() WHERE id = $2', [
      b.status || 'received',
      id,
    ]);
    return jsonResponse(200, origin, { data: { id: String(id) } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handleNotifications(event, origin) {
  const user = await requireAuth(event);

  if (event.httpMethod === 'GET') {
    const result = await query(
      'SELECT id, user_id, title, message, type, "read", created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [user.id]
    );
    const data = result.rows.map((r) => ({
      ...r,
      read: Boolean(r.read),
    }));
    return jsonResponse(200, origin, { data });
  }

  if (event.httpMethod === 'PUT') {
    await query('UPDATE notifications SET "read" = TRUE WHERE user_id = $1 AND "read" = FALSE', [user.id]);
    return jsonResponse(200, origin, { data: { ok: true } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handleDashboard(event, origin) {
  const user = await requireAuth(event);
  requireRoles(user, ['staff', 'admin', 'super_admin']);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  let todaySales = 0;
  let monthlyRevenue = 0;
  let weekSales = [];

  try {
    const t = await query('SELECT COALESCE(SUM(total),0) AS total FROM sales WHERE created_at >= $1', [
      todayStart.toISOString(),
    ]);
    todaySales = parseFloat(t.rows[0]?.total || 0);
    const m = await query('SELECT COALESCE(SUM(total),0) AS total FROM sales WHERE created_at >= $1', [
      monthStart.toISOString(),
    ]);
    monthlyRevenue = parseFloat(m.rows[0]?.total || 0);
    const w = await query(
      `SELECT total, created_at FROM sales WHERE created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC`
    );
    weekSales = w.rows.map((row) => ({
      total: parseFloat(row.total),
      created_at: row.created_at,
    }));
  } catch {
    const t = await query(
      "SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE created_at >= CURRENT_DATE"
    );
    todaySales = parseFloat(t.rows[0]?.total || 0);
    const m = await query(
      "SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)"
    );
    monthlyRevenue = parseFloat(m.rows[0]?.total || 0);
    const w = await query(`
      SELECT DATE(created_at) AS created_at, COALESCE(SUM(total), 0) AS total
      FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC`);
    weekSales = w.rows.map((row) => ({
      total: parseFloat(row.total),
      created_at: row.created_at,
    }));
  }

  const productCount = await query('SELECT COUNT(*)::int AS count FROM products');
  const lowStock = await query(
    'SELECT COUNT(*)::int AS count FROM products WHERE quantity < min_quantity AND quantity > 0'
  );
  const pendingOrders = await query(
    "SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'"
  );
  const expiringProducts = await query(
    `SELECT COUNT(*)::int AS count FROM products WHERE expiry_date IS NOT NULL
     AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date > CURRENT_DATE`
  );

  let userCount = { rows: [{ count: 0 }] };
  let pendingApprovals = { rows: [{ count: 0 }] };
  try {
    userCount = await query('SELECT COUNT(*)::int AS count FROM profiles');
    pendingApprovals = await query(
      "SELECT COUNT(*)::int AS count FROM profiles WHERE approval_status = 'pending'"
    );
  } catch {
    userCount = await query('SELECT COUNT(*)::int AS count FROM users');
  }

  const supplierCount = await query('SELECT COUNT(*)::int AS count FROM suppliers');
  const topStock = await query('SELECT name, quantity FROM products ORDER BY quantity DESC LIMIT 5');

  let topSelling = [];
  try {
    const salesRows = await query(
      `SELECT items FROM sales WHERE created_at >= NOW() - INTERVAL '30 days'`
    );
    const qtyByName = {};
    for (const saleRow of salesRows.rows) {
      const items =
        typeof saleRow.items === 'string' ? JSON.parse(saleRow.items) : saleRow.items || [];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const name = String(item.name || '').trim();
        if (!name) continue;
        const qty = Math.max(1, parseInt(item.qty || item.quantity, 10) || 1);
        qtyByName[name] = (qtyByName[name] || 0) + qty;
      }
    }
    topSelling = Object.entries(qtyByName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, qty]) => ({ name, qty }));
  } catch {
    topSelling = [];
  }

  return jsonResponse(200, origin, {
    data: {
      product_count: productCount.rows[0]?.count || 0,
      low_stock: lowStock.rows[0]?.count || 0,
      pending_orders: pendingOrders.rows[0]?.count || 0,
      expiring_soon: expiringProducts.rows[0]?.count || 0,
      user_count: userCount.rows[0]?.count || 0,
      supplier_count: supplierCount.rows[0]?.count || 0,
      pending_approvals: pendingApprovals.rows[0]?.count || 0,
      today_sales: todaySales,
      monthly_revenue: monthlyRevenue,
      top_stock: topStock.rows.map((row) => ({ name: row.name, stock: row.quantity })),
      top_selling: topSelling,
      week_sales: weekSales,
    },
  });
}

async function handleUpload(event, origin) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, origin, { error: 'POST required' });
  }
  const user = await requireAuth(event);
  requireRoles(user, ['staff', 'admin', 'super_admin']);
  return jsonResponse(501, origin, {
    error: 'File upload not supported on Netlify Functions (use external storage or data URL)',
  });
}

async function handleCmsContent(event, origin) {
  const params = event.queryStringParameters || {};
  const method = event.httpMethod;

  const tableExists = await query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cms_content'`
  );
  if (tableExists.rowCount === 0) {
    return jsonResponse(200, origin, { data: [] });
  }

  if (method === 'GET') {
    const status = params.status || 'published';
    const category = params.category;
    let sql =
      'SELECT id, title, slug, content, category, status, excerpt, author_id, created_at FROM cms_content WHERE status = $1';
    const qParams = [status];
    if (category) {
      qParams.push(category);
      sql += ` AND category = $${qParams.length}`;
    }
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const result = await query(sql, qParams);
    if (params.id) {
      const one = await query('SELECT * FROM cms_content WHERE id = $1', [params.id]);
      if (one.rows.length === 0) return jsonResponse(404, origin, { error: 'Not found' });
      return jsonResponse(200, origin, { data: one.rows[0] });
    }
    return jsonResponse(200, origin, { data: result.rows });
  }

  const user = await requireAuth(event);
  requireRoles(user, ['admin', 'super_admin']);
  const b = parseBody(event);

  if (method === 'POST') {
    const slug =
      (b.slug || '').trim() ||
      String(b.title || 'post')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
    const result = await query(
      `INSERT INTO cms_content (title, slug, content, category, status, excerpt, author_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [
        b.title ?? 'Untitled',
        slug,
        b.content ?? '',
        b.category ?? 'announcement',
        b.status ?? 'draft',
        b.excerpt ?? '',
        user.id,
      ]
    );
    return jsonResponse(201, origin, { data: { id: String(result.rows[0].id) } });
  }

  if (method === 'PUT' && params.id) {
    await query(
      'UPDATE cms_content SET title=$1, slug=$2, content=$3, category=$4, status=$5, excerpt=$6, updated_at=NOW() WHERE id=$7',
      [
        b.title ?? '',
        b.slug ?? '',
        b.content ?? '',
        b.category ?? 'announcement',
        b.status ?? 'draft',
        b.excerpt ?? '',
        params.id,
      ]
    );
    return jsonResponse(200, origin, { data: { id: params.id } });
  }

  if (method === 'DELETE' && params.id) {
    await query('DELETE FROM cms_content WHERE id = $1', [params.id]);
    return jsonResponse(200, origin, { data: { deleted: true } });
  }

  return jsonResponse(405, origin, { error: 'Method not allowed' });
}

async function handleManufacturers(event, origin) {
  const user = await requireAuth(event);
  requireRoles(user, ['staff', 'admin', 'super_admin']);

  const result = await query(
    `SELECT COALESCE(NULLIF(TRIM(manufacturer), ''), 'General') AS name,
            COUNT(*)::int AS medicines,
            SUM(CASE WHEN requires_prescription THEN 1 ELSE 0 END)::int AS prescriptions,
            COUNT(DISTINCT category)::int AS divisions
     FROM products
     GROUP BY COALESCE(NULLIF(TRIM(manufacturer), ''), 'General')
     ORDER BY medicines DESC`
  );
  return jsonResponse(200, origin, { data: result.rows });
}

async function handleCategories(event, origin) {
  const result = await query(
    'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
  );
  return jsonResponse(200, origin, { data: result.rows.map((r) => r.category) });
}
