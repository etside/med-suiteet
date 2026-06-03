// netlify/functions/api.js - Main API endpoint handler
const jwt = require('jsonwebtoken');
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

    // Routes
    if (action === 'login' && event.httpMethod === 'POST') {
      return await handleLogin(event, origin);
    }
    
    if (action === 'signup' && event.httpMethod === 'POST') {
      return await handleSignup(event, origin);
    }
    
    if (action === 'products') {
      return await handleProducts(event, origin);
    }
    
    if (action === 'user') {
      return await handleGetUser(event, origin);
    }

    return {
      statusCode: 400,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Invalid action' })
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Login endpoint
async function handleLogin(event, origin) {
  try {
    const body = JSON.parse(event.body);
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Email and password required' })
      };
    }

    // Query user
    const result = await query(
      'SELECT id, email, password, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 401,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    const user = result.rows[0];

    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return {
        statusCode: 401,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
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
      body: JSON.stringify({ token, user: { id: user.id, email: user.email, role: user.role } })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Login failed' })
    };
  }
}

// Signup endpoint
async function handleSignup(event, origin) {
  try {
    const body = JSON.parse(event.body);
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'Email and password required' })
      };
    }

    // Check if user exists
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return {
        statusCode: 409,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: 'User already exists' })
      };
    }

    // Create user
    const result = await query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, password, 'customer']
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
      body: JSON.stringify({ token, user })
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Signup failed' })
    };
  }
}

// Get products endpoint
async function handleProducts(event, origin) {
  try {
    const result = await query('SELECT * FROM products LIMIT 100');
    
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify(result.rows)
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
      body: JSON.stringify(result.rows[0])
    };
  } catch (error) {
    console.error('User error:', error);
    return {
      statusCode: 401,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }
}
