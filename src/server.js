const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5001',
  'http://localhost:5002', // নতুন 5002 পোর্টটি এখানে যোগ করে দিলাম
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5001',
  'http://127.0.0.1:5002'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Not Allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

io.on('connection', (socket) => {
  console.log(`⚡ Connected via Socket ID: ${socket.id}`);
});

// =================== AUTO SCHEMA MIGRATION =================== //
const ensureDatabaseColumns = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name ON categories (LOWER(TRIM(name)));
    `);

    const existingCats = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(existingCats.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO categories (name) VALUES
        ('Fast Food'),
        ('Biryani & Kacchi'),
        ('Chinese & Thai'),
        ('Beverage & Cafe'),
        ('Sweets & Bakery')
      `);
    }

    await pool.query(`
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 40;
      ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        area_id INT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS area_id INT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    `);

    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS area_id INT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS street_house TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT;
    `);

    await pool.query(`
      ALTER TABLE riders ADD COLUMN IF NOT EXISTS areas TEXT[];
      ALTER TABLE riders ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'Bike';
      ALTER TABLE riders ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
    `);

    console.log('✅ Auto-check complete: Orders items JSONB, Rider columns & Note ready.');
  } catch (err) {
    console.error('Migration warning:', err.message);
  }
};
ensureDatabaseColumns();

// =================== DIRECT LOGIN API (ADMIN) =================== //
const PRIMARY_SUPER_ADMIN_EMAIL = 'tanvir.it009@gmail.com';
const PRIMARY_SUPER_ADMIN_PASS = 'casio100';

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Gmail and Password are both required!' });

  const cleanEmail = String(email).toLowerCase().trim();
  const inputPass = String(password).trim();

  try {
    if (cleanEmail === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase()) {
      if (inputPass !== PRIMARY_SUPER_ADMIN_PASS) {
        return res.status(401).json({ error: 'Incorrect password for Super Admin!' });
      }

      try {
        let adminRow = await pool.query('SELECT * FROM admins WHERE LOWER(email) = $1', [cleanEmail]);
        if (adminRow.rows.length === 0) {
          await pool.query(
            `INSERT INTO admins (name, email, password, role, permissions, status)
             VALUES ($1, $2, $3, 'super_admin', ARRAY['orders','restaurants','riders','finance','master_edit','customers'], 'active')`,
            ['Tanvir (Super Admin)', cleanEmail, PRIMARY_SUPER_ADMIN_PASS]
          );
        } else {
          await pool.query('UPDATE admins SET password = $1, status = $2 WHERE id = $3', [
            PRIMARY_SUPER_ADMIN_PASS, 'active', adminRow.rows[0].id
          ]);
        }
      } catch (dbErr) {
        console.error('DB sync warning:', dbErr.message);
      }

      return res.json({
        success: true,
        token: `cityfood_jwt_super_${Date.now()}`,
        user: {
          id: 1,
          name: 'Tanvir (Super Admin)',
          email: cleanEmail,
          role: 'super_admin',
          permissions: ['orders', 'restaurants', 'riders', 'finance', 'master_edit', 'customers']
        }
      });
    }

    const checkSubAdmin = await pool.query('SELECT * FROM admins WHERE LOWER(email) = $1', [cleanEmail]);
    if (checkSubAdmin.rows.length === 0) return res.status(403).json({ error: `Access Denied! (${cleanEmail}) is not registered!` });

    const subAdmin = checkSubAdmin.rows[0];
    if (subAdmin.status === 'blocked') return res.status(403).json({ error: 'Account suspended!' });
    if (String(subAdmin.password).trim() !== inputPass) return res.status(401).json({ error: 'Incorrect password!' });

    return res.json({
      success: true,
      token: `cityfood_jwt_${subAdmin.id}_${Date.now()}`,
      user: {
        id: subAdmin.id,
        name: subAdmin.name,
        email: subAdmin.email,
        role: subAdmin.role,
        permissions: subAdmin.permissions
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server authentication failed!' });
  }
});

// =================== RIDER APP AUTH & APIS =================== //
app.post('/api/rider/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required!' });

  try {
    const result = await pool.query('SELECT * FROM riders WHERE phone = $1', [String(phone).trim()]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rider account not found with this phone number!' });

    const rider = result.rows[0];
    if (String(rider.password).trim() !== String(password).trim()) {
      return res.status(401).json({ error: 'Incorrect password!' });
    }

    res.json({ success: true, token: `cityfood_rider_${rider.id}_${Date.now()}`, rider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rider/profile/:id', async (req, res) => {
  const { name, phone, vehicle_type, areas } = req.body;
  try {
    const result = await pool.query(
      `UPDATE riders
       SET name = $1, phone = $2, vehicle_type = $3, areas = $4, profile_completed = TRUE
       WHERE id = $5 RETURNING *`,
      [name, phone, vehicle_type || 'Bike', areas || [], req.params.id]
    );
    res.json({ success: true, rider: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rider/orders', async (req, res) => {
  const { rider_id } = req.query;
  try {
    let riderAreas = [];
    if (rider_id) {
      const riderRes = await pool.query('SELECT areas FROM riders WHERE id = $1', [rider_id]);
      if (riderRes.rows.length > 0) {
        riderAreas = riderRes.rows[0].areas || [];
      }
    }

    const result = await pool.query(`
      SELECT o.*, r.name AS restaurant_name, r.phone AS restaurant_phone, da.name AS area_name
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN delivery_areas da ON o.area_id = da.id
      WHERE (o.rider_id IS NULL AND o.status IN ('pending', 'confirmed', 'cooking', 'accepted', 'ready'))
         OR o.rider_id = $1
      ORDER BY o.id DESC
    `, [rider_id || null]);

    const filteredOrders = result.rows.filter(order => {
      if (Number(order.rider_id) === Number(rider_id)) return true;
      if (!riderAreas.length) return true;
      return riderAreas.includes(order.area_name);
    });

    res.json(filteredOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/rider/orders/:id/accept', async (req, res) => {
  const { rider_id } = req.body;
  try {
    const check = await pool.query('SELECT rider_id FROM orders WHERE id = $1', [req.params.id]);
    if (check.rows[0]?.rider_id) {
      return res.status(400).json({ error: 'Order already accepted by another rider!' });
    }

    const updated = await pool.query(
      `UPDATE orders SET rider_id = $1, status = 'accepted' WHERE id = $2 RETURNING *`,
      [rider_id, req.params.id]
    );
    res.json({ success: true, order: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/rider/orders/:id/action', async (req, res) => {
  const { status, rider_id, total_amount, payment_method } = req.body;
  try {
    const updated = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    const payMethod = String(payment_method || '').toUpperCase().trim();
    if (status === 'delivered' && (payMethod.includes('COD') || payMethod === 'CASH' || payMethod === '')) {
      await pool.query(
        `UPDATE riders SET cash_in_hand = cash_in_hand + $1 WHERE id = $2`,
        [Number(total_amount || 0), rider_id]
      );
    }

    res.json({ success: true, order: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rider/history/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, r.name AS restaurant_name
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.rider_id = $1 AND o.status IN ('delivered', 'cancelled')
      ORDER BY o.id DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== CUSTOMER AUTH & ORDERS =================== //
app.post('/api/customer/register', async (req, res) => {
  const { name, email, phone, password, area_id, address } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ error: 'All fields required!' });

  try {
    const cleanMail = String(email).toLowerCase().trim();
    const cleanPhone = String(phone).trim();
    const exists = await pool.query('SELECT id FROM customers WHERE LOWER(email) = $1 OR phone = $2', [cleanMail, cleanPhone]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'Email or phone already exists!' });

    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, password, area_id, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING id, name, email, phone, area_id, address, status`,
      [name.trim(), cleanMail, cleanPhone, password.trim(), area_id ? Number(area_id) : null, address || '']
    );

    const user = result.rows[0];
    res.status(201).json({ success: true, token: `cityfood_cust_${user.id}_${Date.now()}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customer/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'Identifier and password required!' });

  try {
    const cleanId = String(identifier).toLowerCase().trim();
    const result = await pool.query(
      `SELECT c.*, da.name as area_name, da.delivery_fee as area_delivery_fee
       FROM customers c
       LEFT JOIN delivery_areas da ON c.area_id = da.id
       WHERE LOWER(c.email) = $1 OR c.phone = $1`,
      [cleanId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found!' });
    const user = result.rows[0];
    if (String(user.status).toLowerCase() === 'blocked' || String(user.status).toLowerCase() === 'banned') {
      return res.status(403).json({ error: 'Your account is blocked by admin!' });
    }
    if (String(user.password).trim() !== String(password).trim()) return res.status(401).json({ error: 'Incorrect password!' });

    delete user.password;
    res.json({ success: true, token: `cityfood_cust_${user.id}_${Date.now()}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customer/profile/:id', async (req, res) => {
  const { name, email, phone, area_id, address } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers SET name = $1, email = $2, phone = $3, area_id = $4, address = $5 WHERE id = $6 RETURNING id, name, email, phone, area_id, address, status`,
      [name, String(email).toLowerCase().trim(), phone, area_id ? Number(area_id) : null, address, req.params.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/customers/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE customers SET status = $1 WHERE id = $2 RETURNING id, name, phone, status',
      [status || 'active', req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found!' });
    }
    res.json({ success: true, customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customer/orders/:phone', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, r.name AS restaurant_name, r.phone AS restaurant_phone,
             rd.name AS rider_name, rd.phone AS rider_phone
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN riders rd ON o.rider_id = rd.id
      WHERE o.customer_phone = $1
      ORDER BY o.id DESC
    `, [req.params.phone]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/customer/orders/:id/cancel', async (req, res) => {
  try {
    const check = await pool.query('SELECT status, rider_id FROM orders WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = check.rows[0];
    const uncancelable = ['accepted', 'cooking', 'picked', 'delivered', 'on_way'];
    if (uncancelable.includes(String(order.status).toLowerCase()) || order.rider_id) {
      return res.status(400).json({ error: 'Cannot cancel after restaurant or rider accepts!' });
    }

    const updated = await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *", [req.params.id]);
    res.json({ success: true, order: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== CATEGORIES, AREAS, BANNERS, SETTINGS =================== //
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });
  try {
    const checkExist = await pool.query('SELECT * FROM categories WHERE LOWER(TRIM(name)) = LOWER($1)', [name.trim()]);
    if (checkExist.rows.length > 0) return res.json(checkExist.rows[0]);
    const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name.trim()]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const { bkash_number, nagad_number, support_number } = req.body;
  try {
    const result = await pool.query(
      `UPDATE settings SET bkash_number = $1, nagad_number = $2, support_number = $3 WHERE id = 1 RETURNING *`,
      [bkash_number, nagad_number, support_number]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/banners', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM banners ORDER BY priority ASC, id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/banners', async (req, res) => {
  const { title, image_url, priority } = req.body;
  if (!image_url) return res.status(400).json({ error: 'Image required' });
  try {
    const result = await pool.query(
      `INSERT INTO banners (title, image_url, priority) VALUES ($1, $2, $3) RETURNING *`,
      [title || 'Promo', image_url, Number(priority) || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/banners/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM banners WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/delivery-areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM delivery_areas ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/delivery-areas', async (req, res) => {
  const { name, delivery_fee, estimated_time } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO delivery_areas (name, delivery_fee, estimated_time) VALUES ($1, $2, $3) RETURNING *`,
      [name, delivery_fee || 40, estimated_time || '30-45 mins']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/delivery-areas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM delivery_areas WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/coupons', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== RESTAURANTS & PRODUCTS =================== //
app.get('/api/restaurants', async (req, res) => {
  try {
    const restQuery = await pool.query('SELECT * FROM restaurants ORDER BY priority ASC, id DESC');
    const restaurants = restQuery.rows;
    for (let rest of restaurants) {
      const prodQuery = await pool.query('SELECT * FROM products WHERE restaurant_id = $1 ORDER BY priority ASC, id DESC', [rest.id]);
      rest.products = prodQuery.rows;
    }
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/restaurants', async (req, res) => {
  const { name, phone, password, image_url, order_type, orderType, priority, delivery_fee, category } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'Required fields missing' });

  try {
    const result = await pool.query(
      `INSERT INTO restaurants (name, phone, password, image_url, order_type, priority, delivery_fee, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, phone, password, image_url || '', order_type || orderType || 'both', Number(priority) || 1, Number(delivery_fee) >= 0 ? Number(delivery_fee) : 40, category || 'General']
    );
    res.status(201).json({ ...result.rows[0], products: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, category, delivery_fee, priority, order_type, image_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE restaurants
       SET name = $1, phone = $2, category = $3, delivery_fee = $4, priority = $5, order_type = $6, image_url = COALESCE($7, image_url)
       WHERE id = $8 RETURNING *`,
      [name, phone, category || 'General', Number(delivery_fee) || 40, Number(priority) || 1, order_type || 'both', image_url, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/restaurants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE restaurant_id = $1', [req.params.id]);
    await pool.query('DELETE FROM restaurants WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/restaurants/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query('UPDATE restaurants SET is_open = NOT is_open WHERE id = $1 RETURNING *', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/restaurants/:id/priority', async (req, res) => {
  try {
    const result = await pool.query('UPDATE restaurants SET priority = $1 WHERE id = $2 RETURNING *', [Number(req.body.priority) || 1, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/restaurants/:id/password', async (req, res) => {
  try {
    const result = await pool.query('UPDATE restaurants SET password = $1 WHERE id = $2 RETURNING *', [req.body.password, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { restaurant_id, name, price, priority, image_url, category } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (restaurant_id, name, price, priority, image_url, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [restaurant_id, name, price, priority || 1, image_url || '', category || 'General']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== RIDERS =================== //
app.get('/api/riders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM riders ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/riders', async (req, res) => {
  const { name, phone, password, cash_limit } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO riders (name, phone, password, cash_limit, cash_in_hand, online_total, status)
       VALUES ($1, $2, $3, $4, 0.00, 0.00, 'active') RETURNING *`,
      [name, phone, password, Number(cash_limit) || 2000.00]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/riders/:id/settle', async (req, res) => {
  try {
    const result = await pool.query("UPDATE riders SET cash_in_hand = 0.00, status = 'active' WHERE id = $1 RETURNING *", [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/riders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM riders WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== ORDERS API =================== //
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, r.name AS restaurant_name, rd.name AS rider_name, rd.phone AS rider_phone, da.name AS area_name
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN riders rd ON o.rider_id = rd.id
      LEFT JOIN delivery_areas da ON o.area_id = da.id
      ORDER BY o.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const {
    customer_id,
    customer_name,
    customer_phone,
    address,
    area_id,
    street_house,
    delivery_fee,
    discount_amount,
    coupon_code,
    restaurant_id,
    total_amount,
    payment_method,
    payment_status,
    transaction_id,
    items,
    note
  } = req.body;

  try {
    const cleanPhone = String(customer_phone || '').trim();

    let custCheck;
    if (customer_id) {
      custCheck = await pool.query('SELECT * FROM customers WHERE id = $1 OR phone = $2', [customer_id, cleanPhone]);
    } else {
      custCheck = await pool.query('SELECT * FROM customers WHERE phone = $1', [cleanPhone]);
    }

    if (custCheck.rows.length > 0) {
      for (let cust of custCheck.rows) {
        const st = String(cust.status || '').toLowerCase().trim();
        if (st === 'blocked' || st === 'banned') {
          return res.status(403).json({ error: 'Your account is blocked by admin! You cannot place orders.' });
        }
      }
    }

    let restaurantName = 'Multi-Restaurant Order';
    if (restaurant_id) {
      const restRes = await pool.query('SELECT name FROM restaurants WHERE id = $1', [restaurant_id]);
      if (restRes.rows.length > 0) restaurantName = restRes.rows[0].name;
    }

    const result = await pool.query(
      `INSERT INTO orders
       (customer_name, customer_phone, address, area_id, street_house, delivery_fee, discount_amount, coupon_code, restaurant_id, total_amount, payment_method, payment_status, transaction_id, items, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        customer_name,
        cleanPhone,
        address || street_house,
        area_id ? Number(area_id) : null,
        street_house || '',
        delivery_fee || 0,
        discount_amount || 0,
        coupon_code || '',
        restaurant_id ? Number(restaurant_id) : null,
        total_amount,
        payment_method || 'COD',
        payment_status || 'pending',
        transaction_id || '',
        JSON.stringify(items || []),
        note || ''
      ]
    );

    const newOrder = result.rows[0];

    io.emit('new_order', {
      ...newOrder,
      restaurant_name: restaurantName,
      items: items || []
    });

    res.status(201).json({ ...newOrder, restaurant_name: restaurantName });
  } catch (err) {
    console.error('Order Create Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const orderId = String(req.params.id).replace('ORD-', '');
  const cleanStatus = String(status).toLowerCase().trim();
  try {
    let query = 'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *';
    let params = [cleanStatus, orderId];

    if (cleanStatus === 'pending' || cleanStatus === 'cancelled') {
      query = 'UPDATE orders SET status = $1, rider_id = NULL WHERE id = $2 RETURNING *';
    }

    const result = await pool.query(query, params);
    io.emit('new_order', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/assign-rider', async (req, res) => {
  const { rider_id } = req.body;
  const orderId = String(req.params.id).replace('ORD-', '');
  try {
    const result = await pool.query(
      `UPDATE orders SET rider_id = $1, status = 'accepted' WHERE id = $2 RETURNING *`,
      [rider_id, orderId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FIXED CUSTOMERS API
app.get('/api/customers', async (req, res) => {
  try {
    const query = `
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.status,
        c.created_at,
        COUNT(o.id) AS total_orders,
        COUNT(CASE WHEN LOWER(TRIM(o.status)) = 'delivered' THEN 1 END) AS delivered_orders,
        COUNT(CASE WHEN LOWER(TRIM(o.status)) = 'cancelled' THEN 1 END) AS cancelled_orders,
        COALESCE(SUM(CASE WHEN LOWER(TRIM(o.status)) = 'delivered' THEN o.total_amount ELSE 0 END), 0) AS total_spent
      FROM customers c
      LEFT JOIN orders o ON c.phone = o.customer_phone
      GROUP BY c.id, c.name, c.email, c.phone, c.address, c.status, c.created_at
      ORDER BY c.id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance/overview', async (req, res) => {
  try {
    const ordersRes = await pool.query("SELECT * FROM orders WHERE LOWER(TRIM(status)) = 'delivered'");
    let totalDeliveredSales = 0;
    let totalCancelledAmount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    const allOrdersRes = await pool.query("SELECT status, total_amount FROM orders");
    allOrdersRes.rows.forEach(o => {
      const st = String(o.status || '').toLowerCase().trim();
      const amt = Number(o.total_amount || 0);
      if (st === 'delivered') {
        deliveredCount++;
      } else if (st === 'cancelled') {
        cancelledCount++;
        totalCancelledAmount += amt;
      }
    });

    ordersRes.rows.forEach(ord => {
      let itemsArr = [];
      try {
        itemsArr = typeof ord.items === 'string' ? JSON.parse(ord.items) : (ord.items || []);
      } catch { itemsArr = []; }

      if (itemsArr.length > 0) {
        itemsArr.forEach(it => {
          totalDeliveredSales += Number(it.price || 0) * Number(it.qty || 1);
        });
      } else {
        totalDeliveredSales += Number(ord.total_amount || 0) - Number(ord.delivery_fee || 0);
      }
    });

    const codStats = await pool.query('SELECT COALESCE(SUM(cash_in_hand), 0) AS total_rider_cod FROM riders');
    const gross = totalDeliveredSales;
    const commission = (gross * 0.10);
    const netPayable = gross - commission;

    res.json({
      grossSales: gross,
      platformCommission: commission,
      netPayableToRestaurants: netPayable,
      cancelledAmount: totalCancelledAmount,
      deliveredCount,
      cancelledCount,
      totalRiderCash: Number(codStats.rows[0].total_rider_cod || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance/restaurants', async (req, res) => {
  try {
    const restaurantsRes = await pool.query('SELECT * FROM restaurants ORDER BY id DESC');
    const ordersRes = await pool.query("SELECT * FROM orders");

    const restaurantMap = {};
    restaurantsRes.rows.forEach(r => {
      restaurantMap[r.id] = {
        id: r.id,
        name: r.name,
        phone: r.phone,
        delivery_fee: Number(r.delivery_fee || 40),
        category: r.category || 'General',
        gross_sales: 0,
        delivered_orders: 0,
        cancelled_orders: 0,
        cancelled_sales: 0
      };
    });

    ordersRes.rows.forEach(o => {
      const st = String(o.status || '').toLowerCase().trim();
      let itemsArr = [];
      try {
        itemsArr = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch { itemsArr = []; }

      if (itemsArr.length > 0) {
        itemsArr.forEach(it => {
          const rId = Number(it.restaurant_id || o.restaurant_id);
          if (restaurantMap[rId]) {
            const itemTotal = Number(it.price || 0) * Number(it.qty || 1);
            if (st === 'delivered') {
              restaurantMap[rId].gross_sales += itemTotal;
            } else if (st === 'cancelled') {
              restaurantMap[rId].cancelled_sales += itemTotal;
            }
          }
        });
      } else if (o.restaurant_id && restaurantMap[o.restaurant_id]) {
        const foodOnly = Number(o.total_amount || 0) - Number(o.delivery_fee || 0);
        if (st === 'delivered') {
          restaurantMap[o.restaurant_id].gross_sales += foodOnly;
        } else if (st === 'cancelled') {
          restaurantMap[o.restaurant_id].cancelled_sales += foodOnly;
        }
      }

      const mainRId = Number(o.restaurant_id);
      if (restaurantMap[mainRId]) {
        if (st === 'delivered') restaurantMap[mainRId].delivered_orders++;
        else if (st === 'cancelled') restaurantMap[mainRId].cancelled_orders++;
      }
    });

    const resultList = Object.values(restaurantMap).sort((a, b) => b.gross_sales - a.gross_sales);
    res.json(resultList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =================== ONLINE TRX API =================== //
app.get('/api/online-trx', async (req, res) => {
  const { dateFilter, customDate } = req.query;

  let dateCondition = "";
  if (dateFilter === 'today') dateCondition = " AND created_at::date = CURRENT_DATE";
  else if (dateFilter === 'yesterday') dateCondition = " AND created_at::date = CURRENT_DATE - 1";
  else if (dateFilter === 'last7days') dateCondition = " AND created_at >= NOW() - INTERVAL '7 days'";
  else if (dateFilter === 'custom' && customDate) dateCondition = ` AND created_at::date = '${customDate}'`;

  try {
    const query = `
      SELECT id, created_at, customer_name, customer_phone, payment_method, transaction_id, total_amount
      FROM orders
      WHERE (transaction_id IS NOT NULL AND transaction_id != '')
        AND (LOWER(payment_method) LIKE '%bkash%' OR LOWER(payment_method) LIKE '%nagad%')
        ${dateCondition}
      ORDER BY id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== RESTAURANT APP APIS (ROBUST FALLBACK FOR ALL RESTAURANTS) =================== //

app.post('/api/restaurant/login', async (req, res) => {
  const { restaurant_id, password } = req.body;
  if (!restaurant_id || !password) return res.status(400).json({ error: 'Restaurant and password required!' });

  try {
    const result = await pool.query('SELECT * FROM restaurants WHERE id = $1', [restaurant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Restaurant not found!' });

    const restaurant = result.rows[0];
    if (String(restaurant.password).trim() !== String(password).trim()) {
      return res.status(401).json({ error: 'Incorrect password!' });
    }

    res.json({ success: true, token: `cityfood_rest_${restaurant.id}_${Date.now()}`, restaurant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurant/:id/orders', async (req, res) => {
  const { id } = req.params;
  try {
    const restRes = await pool.query('SELECT name FROM restaurants WHERE id = $1', [id]);
    const restName = restRes.rows[0]?.name || '';

    const result = await pool.query(`
      SELECT o.*, da.name as area_name
      FROM orders o
      LEFT JOIN delivery_areas da ON o.area_id = da.id
      WHERE LOWER(o.status) NOT IN ('delivered', 'cancelled')
      ORDER BY o.id DESC
    `);

    const strictOrders = result.rows.map(order => {
      let itemsArr = [];
      try { itemsArr = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch { itemsArr = []; }

      const myItems = itemsArr.filter(it =>
        Number(it.restaurant_id) === Number(id) ||
        (restName && String(it.restaurant_name || '').toLowerCase().trim() === restName.toLowerCase().trim())
      );

      const isMyOrder = Number(order.restaurant_id) === Number(id) || myItems.length > 0;
      if (!isMyOrder) return null;

      const effectiveItems = myItems.length > 0 ? myItems : (Number(order.restaurant_id) === Number(id) ? itemsArr : []);
      const myTotalAmount = effectiveItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 1)), 0);

      return {
        ...order,
        items: effectiveItems,
        total_amount: myTotalAmount > 0 ? myTotalAmount : order.total_amount
      };
    }).filter(order => order !== null && order.items.length > 0);

    res.json(strictOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/restaurant/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    io.emit('new_order', result.rows[0]);
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/restaurant/orders/:id/item-status', async (req, res) => {
  const { restaurant_id, status } = req.body;
  const orderId = req.params.id;

  try {
    const orderRes = await pool.query('SELECT items FROM orders WHERE id = $1', [orderId]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    let itemsArr = [];
    try {
      itemsArr = typeof orderRes.rows[0].items === 'string'
        ? JSON.parse(orderRes.rows[0].items)
        : (orderRes.rows[0].items || []);
    } catch { itemsArr = []; }

    const updatedItems = itemsArr.map(it => {
      if (Number(it.restaurant_id) === Number(restaurant_id)) {
        return { ...it, status: status };
      }
      return it;
    });

    const updatedOrder = await pool.query(
      `UPDATE orders SET items = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(updatedItems), orderId]
    );

    io.emit('new_order', updatedOrder.rows[0]);
    res.json({ success: true, order: updatedOrder.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurant/:id/history', async (req, res) => {
  const { id } = req.params;
  const { dateFilter, customDate, statusFilter } = req.query;

  let dateCondition = "";
  if (dateFilter === 'today') dateCondition = " AND created_at::date = CURRENT_DATE";
  else if (dateFilter === 'yesterday') dateCondition = " AND created_at::date = CURRENT_DATE - 1";
  else if (dateFilter === 'last7days') dateCondition = " AND created_at >= NOW() - INTERVAL '7 days'";
  else if (dateFilter === 'custom' && customDate) dateCondition = ` AND created_at::date = '${customDate}'`;

  let statusCondition = "";
  if (statusFilter === 'delivered') statusCondition = " AND LOWER(status) = 'delivered'";
  else if (statusFilter === 'cancelled') statusCondition = " AND LOWER(status) = 'cancelled'";

  try {
    const restRes = await pool.query('SELECT name FROM restaurants WHERE id = $1', [id]);
    const restName = restRes.rows[0]?.name || '';

    const result = await pool.query(`
      SELECT * FROM orders
      WHERE 1=1 ${dateCondition} ${statusCondition}
      ORDER BY id DESC
    `);

    const strictHistory = result.rows.map(order => {
      let itemsArr = [];
      try { itemsArr = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch { itemsArr = []; }

      const myItems = itemsArr.filter(it =>
        Number(it.restaurant_id) === Number(id) ||
        (restName && String(it.restaurant_name || '').toLowerCase().trim() === restName.toLowerCase().trim())
      );

      const isMyOrder = Number(order.restaurant_id) === Number(id) || myItems.length > 0;
      if (!isMyOrder) return null;

      const effectiveItems = myItems.length > 0 ? myItems : (Number(order.restaurant_id) === Number(id) ? itemsArr : []);
      const myTotalAmount = effectiveItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 1)), 0);

      return {
        ...order,
        items: effectiveItems,
        total_amount: myTotalAmount > 0 ? myTotalAmount : order.total_amount
      };
    }).filter(order => order !== null && order.items.length > 0);

    res.json(strictHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/restaurant/:id/logo', async (req, res) => {
  const { image_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE restaurants SET image_url = $1 WHERE id = $2 RETURNING *',
      [image_url, req.params.id]
    );
    res.json({ success: true, restaurant: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/restaurant/:id/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE restaurant_id = $1 ORDER BY priority ASC, id DESC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/restaurant/products', async (req, res) => {
  const { restaurant_id, name, price, category, image_url, priority } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (restaurant_id, name, price, category, image_url, priority)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [restaurant_id, name, price, category || 'General', image_url || '', Number(priority) || 1]
    );
    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== FINANCE & DASHBOARD =================== //
app.get('/api/finance/restaurants/:id/details', async (req, res) => {
  const { id } = req.params;
  const { dateFilter, customDate } = req.query;

  let dateCondition = "";
  if (dateFilter === 'today') dateCondition = " AND created_at::date = CURRENT_DATE";
  else if (dateFilter === 'yesterday') dateCondition = " AND created_at::date = CURRENT_DATE - 1";
  else if (dateFilter === 'last7days') dateCondition = " AND created_at >= NOW() - INTERVAL '7 days'";
  else if (dateFilter === 'custom' && customDate) dateCondition = ` AND created_at::date = '${customDate}'`;

  try {
    const restQuery = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (restQuery.rows.length === 0) return res.status(404).json({ error: 'Restaurant not found' });

    const ordersQuery = await pool.query(`
      SELECT o.*, da.name as area_name
      FROM orders o
      LEFT JOIN delivery_areas da ON o.area_id = da.id
      WHERE (o.restaurant_id = $1 OR o.items::text LIKE '%"restaurant_id":${id}%') ${dateCondition}
      ORDER BY o.id DESC
    `, [id]);

    const orders = ordersQuery.rows;
    let deliveredAmount = 0;
    let cancelledAmount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let onlinePaidTotal = 0;
    let cashCollectTotal = 0;

    const formattedOrders = orders.map(o => {
      let itemsArr = [];
      try {
        itemsArr = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch { itemsArr = []; }

      let restFoodTotal = 0;
      itemsArr.forEach(it => {
        if (Number(it.restaurant_id) === Number(id)) {
          restFoodTotal += Number(it.price || 0) * Number(it.qty || 1);
        }
      });

      if (restFoodTotal === 0 && Number(o.restaurant_id) === Number(id)) {
        restFoodTotal = Number(o.total_amount || 0) - Number(o.delivery_fee || 0);
      }

      const st = String(o.status || '').toLowerCase().trim();
      const payMethod = String(o.payment_method || '').toUpperCase().trim();
      const orderTotal = Number(o.total_amount || 0);

      if (st === 'delivered') {
        deliveredAmount += restFoodTotal;
        deliveredCount++;
        if (payMethod.includes('COD') || payMethod === 'CASH' || payMethod === '') {
          cashCollectTotal += orderTotal;
        } else {
          onlinePaidTotal += orderTotal;
        }
      } else if (st === 'cancelled') {
        cancelledAmount += restFoodTotal;
        cancelledCount++;
      }

      return {
        ...o,
        restaurant_food_total: restFoodTotal
      };
    });

    const commission = deliveredAmount * 0.10;
    const netPayout = deliveredAmount - commission;

    res.json({
      restaurant: restQuery.rows[0],
      stats: {
        deliveredAmount,
        commission,
        netPayout,
        cancelledAmount,
        deliveredCount,
        cancelledCount,
        onlinePaidTotal,
        cashCollectTotal,
        totalOrders: formattedOrders.length
      },
      orders: formattedOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance/riders', async (req, res) => {
  try {
    const query = `
      SELECT
        rd.id,
        rd.name,
        rd.phone,
        rd.cash_in_hand,
        rd.cash_limit,
        rd.status,
        COUNT(CASE WHEN LOWER(TRIM(o.status)) IN ('accepted', 'cooking', 'picked', 'on_way') THEN 1 END) AS accepted_deliveries,
        COUNT(CASE WHEN LOWER(TRIM(o.status)) = 'delivered' THEN 1 END) AS delivered_deliveries,
        COUNT(CASE WHEN LOWER(TRIM(o.status)) = 'cancelled' THEN 1 END) AS cancelled_deliveries,
        COALESCE(SUM(CASE WHEN LOWER(TRIM(o.status)) = 'delivered' THEN total_amount ELSE 0 END), 0) AS total_handled
      FROM riders rd
      LEFT JOIN orders o ON rd.id = o.rider_id
      GROUP BY rd.id, rd.name, rd.phone, rd.cash_in_hand, rd.cash_limit, rd.status
      ORDER BY rd.id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance/riders/:id/details', async (req, res) => {
  const { id } = req.params;
  const { dateFilter, customDate } = req.query;

  let dateCondition = "";
  if (dateFilter === 'today') dateCondition = " AND o.created_at::date = CURRENT_DATE";
  else if (dateFilter === 'yesterday') dateCondition = " AND o.created_at::date = CURRENT_DATE - 1";
  else if (dateFilter === 'last7days') dateCondition = " AND o.created_at >= NOW() - INTERVAL '7 days'";
  else if (dateFilter === 'custom' && customDate) dateCondition = ` AND o.created_at::date = '${customDate}'`;

  try {
    const riderQuery = await pool.query('SELECT * FROM riders WHERE id = $1', [id]);
    if (riderQuery.rows.length === 0) return res.status(404).json({ error: 'Rider not found' });

    const ordersQuery = await pool.query(`
      SELECT o.*, r.name as restaurant_name, da.name as area_name
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN delivery_areas da ON o.area_id = da.id
      WHERE o.rider_id = $1 ${dateCondition}
      ORDER BY o.id DESC
    `, [id]);

    const orders = ordersQuery.rows;
    let deliveredAmount = 0;
    let codDeliveredAmount = 0;
    let onlineDeliveredAmount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    orders.forEach(o => {
      const st = String(o.status || '').toLowerCase().trim();
      const payMethod = String(o.payment_method || '').toUpperCase().trim();
      const amt = Number(o.total_amount || 0);

      if (st === 'delivered') {
        deliveredAmount += amt;
        deliveredCount++;
        if (payMethod.includes('COD') || payMethod === 'CASH' || payMethod === '') {
          codDeliveredAmount += amt;
        } else {
          onlineDeliveredAmount += amt;
        }
      } else if (st === 'cancelled') {
        cancelledCount++;
      }
    });

    res.json({
      rider: riderQuery.rows[0],
      stats: {
        deliveredAmount,
        codDeliveredAmount,
        onlineDeliveredAmount,
        deliveredCount,
        cancelledCount,
        totalOrders: orders.length
      },
      orders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admins', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, role, permissions, status, created_at FROM admins ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admins/:id', async (req, res) => {
  const cleanId = String(req.params.id).trim();
  try {
    const adminCheck = await pool.query('SELECT email FROM admins WHERE id = $1', [cleanId]);
    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (String(adminCheck.rows[0].email).toLowerCase().trim() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'Primary Super Admin cannot be deleted!' });
    }

    await pool.query('DELETE FROM admins WHERE id = $1', [cleanId]);
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Delete Admin Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  const { filter } = req.query;
  let dateCondition = "created_at >= CURRENT_DATE";
  if (filter === 'weekly') dateCondition = "created_at >= NOW() - INTERVAL '7 days'";
  else if (filter === 'monthly') dateCondition = "created_at >= NOW() - INTERVAL '30 days'";
  else if (filter === 'all' || filter === 'today') dateCondition = "1=1";

  try {
    const salesQuery = await pool.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_sales,
        COUNT(id) AS total_orders,
        COUNT(CASE WHEN LOWER(TRIM(status)) NOT IN ('delivered', 'cancelled') THEN 1 END) AS active_orders
      FROM orders
      WHERE ${dateCondition}
    `);

    const riderQuery = await pool.query(`
      SELECT COUNT(id) AS total_riders, COUNT(CASE WHEN status = 'active' THEN 1 END) AS online_riders FROM riders
    `);

    const stats = salesQuery.rows[0];
    const totalSalesNum = Number(stats.total_sales);
    const platformCommission = (totalSalesNum * 0.10).toFixed(2);

    res.json({
      totalSales: totalSalesNum,
      activeOrders: Number(stats.active_orders),
      totalOrders: Number(stats.total_orders),
      commission: Number(platformCommission),
      onlineRiders: `${riderQuery.rows[0]?.online_riders || 0} / ${riderQuery.rows[0]?.total_riders || 0}`
    });
  } catch (err) {
    console.error('Dashboard Stats Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Live Server running on port ${PORT}`);
});