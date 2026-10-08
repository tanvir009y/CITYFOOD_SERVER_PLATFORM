const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cityfood_db',
});

const initDB = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      bkash_number VARCHAR(20) DEFAULT '',
      nagad_number VARCHAR(20) DEFAULT '',
      support_number VARCHAR(20) DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS banners (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL DEFAULT 'Special Offer',
      image_url TEXT NOT NULL DEFAULT '',
      priority INT DEFAULT 1,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE banners ADD COLUMN IF NOT EXISTS title VARCHAR(150) DEFAULT 'Special Offer';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS priority INT DEFAULT 1;
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

    CREATE TABLE IF NOT EXISTS delivery_areas (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      delivery_fee NUMERIC(10, 2) DEFAULT 40.00,
      estimated_time VARCHAR(50) DEFAULT '30-45 mins',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      discount_type VARCHAR(20) DEFAULT 'percentage',
      discount_value NUMERIC(10, 2) NOT NULL,
      min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(20) NOT NULL DEFAULT '',
      password VARCHAR(100) NOT NULL DEFAULT '',
      image_url TEXT DEFAULT '',
      is_open BOOLEAN DEFAULT true,
      order_type VARCHAR(20) DEFAULT 'both',
      priority INT DEFAULT 1,
      total_sales NUMERIC(12, 2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT '';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS password VARCHAR(100) DEFAULT '';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'both';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS priority INT DEFAULT 1;
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS total_sales NUMERIC(12, 2) DEFAULT 0.00;

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      image_url TEXT DEFAULT '',
      priority INT DEFAULT 1,
      in_stock BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS priority INT DEFAULT 1;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

    CREATE TABLE IF NOT EXISTS riders (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      cash_in_hand NUMERIC(10, 2) DEFAULT 0.00,
      online_total NUMERIC(10, 2) DEFAULT 0.00,
      cash_limit NUMERIC(10, 2) DEFAULT 2000.00,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE riders ADD COLUMN IF NOT EXISTS cash_in_hand NUMERIC(10, 2) DEFAULT 0.00;
    ALTER TABLE riders ADD COLUMN IF NOT EXISTS online_total NUMERIC(10, 2) DEFAULT 0.00;
    ALTER TABLE riders ADD COLUMN IF NOT EXISTS cash_limit NUMERIC(10, 2) DEFAULT 2000.00;
    ALTER TABLE riders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'riders' AND column_name = 'status' AND data_type = 'boolean'
      ) THEN
        ALTER TABLE riders ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE riders ALTER COLUMN status TYPE VARCHAR(20) USING (CASE WHEN status = true THEN 'active' ELSE 'locked' END);
        ALTER TABLE riders ALTER COLUMN status SET DEFAULT 'active';
      END IF;
    END $$;

    -- Admins & Sub-Admins টেবিল
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(120) UNIQUE NOT NULL,
      phone VARCHAR(20) DEFAULT '',
      password VARCHAR(100) NOT NULL,
      role VARCHAR(30) DEFAULT 'sub_admin',
      permissions TEXT[] DEFAULT ARRAY['orders', 'restaurants'],
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(120);
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS email VARCHAR(120);
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT '';
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS password VARCHAR(100);
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'sub_admin';
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY['orders', 'restaurants'];
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      address TEXT NOT NULL,
      area_id INT REFERENCES delivery_areas(id) ON DELETE SET NULL,
      street_house VARCHAR(255) DEFAULT '',
      delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
      discount_amount NUMERIC(10, 2) DEFAULT 0.00,
      coupon_code VARCHAR(50) DEFAULT '',
      restaurant_id INT REFERENCES restaurants(id) ON DELETE SET NULL,
      rider_id INT REFERENCES riders(id) ON DELETE SET NULL,
      total_amount NUMERIC(10, 2) NOT NULL,
      payment_method VARCHAR(20) DEFAULT 'COD',
      payment_status VARCHAR(20) DEFAULT 'Unpaid',
      status VARCHAR(30) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS area_id INT REFERENCES delivery_areas(id) ON DELETE SET NULL;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS street_house VARCHAR(255) DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 0.00;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT '';

    INSERT INTO settings (id, bkash_number, nagad_number, support_number)
    VALUES (1, '01700000000', '01800000000', '01900000000')
    ON CONFLICT (id) DO NOTHING;
  `;

  try {
    const client = await pool.connect();
    await client.query(queryText);
    client.release();
    console.log('PostgreSQL Database connected and schema synchronized successfully.');
  } catch (err) {
    console.error('Database Initialization Error:', err.message);
  }
};

initDB();

module.exports = pool;