// netlify/functions/api.js - Main API endpoint handler (aligned with src/lib/api.ts actions)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const ALLOWED_ORIGINS = [
  'https://med-et.netlify.app',
  'http://localhost:8080',
  'http://localhost:3000'
];

// CORS headers
function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };
}

// Handle preflight
exports.handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.referer;
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: ''
    };
  }

  try {
    const { action, email, password, search } = event.queryStringParameters || {};
    const authHeader = event.headers.authorization;

    // Health check (matches PHP shape)
    if (action === 'health') {
      return {
        statusCode: 200,
        headers: corsHeaders(origin),
        body: JSON.stringify({
          status: 'ok',
          service: 'Medsuite-eT Netlify API',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
        })
      };
    }

    // Auth + data routes (support legacy and frontend action names)
    if ((action === 'auth_login' || action === 'login') && event.httpMethod === 'POST') {
      return await handleLogin(event, origin);
    }

    if ((action === 'auth_signup' || action === 'signup') && event.httpMethod === 'POST') {
      return await handleSignup(event, origin);
    }

    if (action === 'auth_me' || action === 'user') {
      return await handleGetUser(event, origin);
    }

    if (action === 'products') {
      return await handleProducts(event, origin);
    }

    if (action === 'dashboard') {
      return await handleDashboard(event, origin);
    }

    // Catch undefined actions
    return {
      statusCode: 400,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Invalid action: ' + (action || 'not provided') })
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};

// Login endpoint
async function handleLogin(event, origin) {
  try {
    // Netlify Functions base64-encodes the body, so decode it if needed
    let bodyStr = event.body;
    if (event.isBase64Encoded) {
      bodyStr = Buffer.from(event.body, 'base64').toString('utf-8');
    }
    const body = JSON.parse(bodyStr);
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Email and password required' })
      };
    }

    const result = await query(
      'SELECT id, email, password, role FROM users WHERE LOWER(email) = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 401,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Invalid email or password' })
      };
    }

    const user = result.rows[0];
    const stored = user.password || '';
    const passwordOk =
      stored.startsWith('$2a$') || stored.startsWith('$2b$')
        ? await bcrypt.compare(password, stored)
        : stored === password;

    if (!passwordOk) {
      return {
        statusCode: 401,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Invalid email or password' })
      };
    }

    if (!stored.startsWith('$2')) {
      const hash = await bcrypt.hash(password, 10);
      await query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ 
        data: {
          token, 
          user: { id: user.id, email: user.email },
          roles: [user.role],
          approval_status: 'approved'
        }
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Login failed: ' + error.message })
    };
  }
}

// Signup endpoint
async function handleSignup(event, origin) {
  try {
    // Netlify Functions base64-encodes the body, so decode it if needed
    let bodyStr = event.body;
    if (event.isBase64Encoded) {
      bodyStr = Buffer.from(event.body, 'base64').toString('utf-8');
    }
    const body = JSON.parse(bodyStr);
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password;
    const fullName = String(body.full_name || body.fullName || '').trim();

    if (!email || !password || password.length < 8) {
      return {
        statusCode: 400,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Valid email and password (8+ chars) required' })
      };
    }

    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);

    if (existing.rows.length > 0) {
      return {
        statusCode: 409,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Email already registered' })
      };
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hash, 'customer']
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 201,
      headers: corsHeaders(origin),
      body: JSON.stringify({ 
        data: {
          token, 
          user: { id: user.id, email: user.email },
          roles: [user.role],
          approval_status: 'approved'
        }
      })
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Signup failed: ' + error.message })
    };
  }
}

// Get products endpoint
async function handleProducts(event, origin) {
  try {
    const params = event.queryStringParameters || {};
    const limit = Math.min(20000, Math.max(1, parseInt(params.limit, 10) || 10000));
    const result = await query('SELECT * FROM products ORDER BY name ASC LIMIT $1', [limit]);
    
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ data: result.rows })
    };
  } catch (error) {
    console.error('Products error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Failed to fetch products' })
    };
  }
}

// Get user info endpoint
async function handleGetUser(event, origin) {
  try {
    const authHeader = event.headers.authorization;
    
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ 
        data: {
          user: { id: result.rows[0].id, email: result.rows[0].email },
          roles: [result.rows[0].role],
          approval_status: 'approved'
        }
      })
    };
  } catch (error) {
    console.error('User error:', error);
    return {
      statusCode: 401,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Invalid token: ' + error.message })
    };
  }
}

// Dashboard stats endpoint
async function handleDashboard(event, origin) {
  try {
    const authHeader = event.headers.authorization;
    
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Query dashboard stats
    const productCount = await query('SELECT COUNT(*) as count FROM products');
    const lowStock = await query('SELECT COUNT(*) as count FROM products WHERE quantity < min_quantity');
    const pendingOrders = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const expiringProducts = await query('SELECT COUNT(*) as count FROM products WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL \'30 days\'');
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const supplierCount = await query('SELECT COUNT(*) as count FROM suppliers');
    const todaySales = await query('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE');
    const monthlyRevenue = await query('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE DATE_TRUNC(\'month\', created_at) = DATE_TRUNC(\'month\', CURRENT_DATE)');
    const topStock = await query('SELECT name, quantity FROM products ORDER BY quantity DESC LIMIT 5');
    const weeklySales = await query(`
      SELECT 
        DATE(created_at) as created_at,
        COALESCE(SUM(total), 0) as total
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
    `);

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({
        data: {
          product_count: parseInt(productCount.rows[0]?.count || 0),
          low_stock: parseInt(lowStock.rows[0]?.count || 0),
          pending_orders: parseInt(pendingOrders.rows[0]?.count || 0),
          expiring_soon: parseInt(expiringProducts.rows[0]?.count || 0),
          user_count: parseInt(userCount.rows[0]?.count || 0),
          supplier_count: parseInt(supplierCount.rows[0]?.count || 0),
          pending_approvals: 0,
          today_sales: parseFloat(todaySales.rows[0]?.total || 0),
          monthly_revenue: parseFloat(monthlyRevenue.rows[0]?.total || 0),
          top_stock: topStock.rows.map(row => ({ name: row.name, stock: row.quantity })),
          week_sales: weeklySales.rows.map(row => ({ 
            total: parseFloat(row.total),
            created_at: row.created_at
          }))
        }
      })
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Failed to fetch dashboard stats: ' + error.message })
    };
  }
}
