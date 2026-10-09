const express = require('express');
const router = express.Router();

// ১. সব রেস্টুরেন্টের তালিকা পাওয়ার রাউট
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// ২. রেস্টুরেন্ট লগইন রাউট
router.post('/login', async (req, res) => {
  try {
    const { restaurant_id, password } = req.body;
    const result = await pool.query('SELECT * FROM restaurants WHERE id = $1', [restaurant_id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Restaurant not found' });
    }

    const restaurant = result.rows[0];

    // পাসওয়ার্ড যাচাই (প্রয়োজনে সরাসরি বা হ্যাশ মিলিয়ে দেখতে পারেন)
    if (restaurant.password !== password) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    res.json({
      success: true,
      token: 'rest_token_' + restaurant.id,
      restaurant
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// ৩. রেস্টুরেন্ট ওপেন/ক্লোজ স্ট্যাটাস আপডেট করার রাউট
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_open } = req.body;

    const query = 'UPDATE restaurants SET is_open = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [is_open, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      restaurant: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error while updating status' });
  }
});

// ৪. লোগো আপডেট করার রাউট
router.put('/:id/logo', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url } = req.body;

    const query = 'UPDATE restaurants SET image_url = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [image_url, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({
      success: true,
      restaurant: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update logo' });
  }
});

// ৫. রেস্টুরেন্টের নিজস্ব অর্ডার পাওয়ার রাউট
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    // আপনার ডাটাবেজ স্ট্রাকচার অনুযায়ী অর্ডারের কোয়েরি এখানে কাজ করবে
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;