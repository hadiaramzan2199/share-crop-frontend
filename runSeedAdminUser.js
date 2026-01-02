require('dotenv').config();
const pool = require('./db');

async function seedAdmin() {
  const email = 'admin@example.com';
  try {
    const exists = await pool.query('SELECT id, user_type FROM public.users WHERE email = $1 LIMIT 1', [email]);
    if (exists.rows.length > 0) {
      console.log('Admin user already exists:', exists.rows[0]);
      process.exit(0);
    }

    const colsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users'");
    const cols = colsRes.rows.map(r => r.column_name);
    const insertCols = [];
    const insertVals = [];
    const params = [];

    const add = (col, val) => { if (cols.includes(col)) { params.push(val); insertCols.push(col); insertVals.push(`$${params.length}`); } };

    add('name', 'Admin User');
    add('email', email);
    add('user_type', 'ADMIN');
    add('is_active', true);
    add('approval_status', 'approved');
    add('password', 'mock_password');
    add('created_at', new Date());

    if (insertCols.length === 0) throw new Error('Could not determine users table columns');

    const sql = `INSERT INTO public.users (${insertCols.join(',')}) VALUES (${insertVals.join(',')}) ON CONFLICT (email) DO NOTHING`;
    await pool.query(sql, params);
    console.log('Admin user seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin user:', err);
    process.exit(1);
  }
}

seedAdmin();

