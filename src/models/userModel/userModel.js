import { pool } from '../../config/db.js';

export const createUser = async (mobile_number, email, hashedPassword, firstname, middlename, lastname, role = 'user', account_no = '') => {
  console.log('Creating user with:', { mobile_number, email, firstname, middlename, lastname, role, account_no });
  
  try {
    const res = await pool.query(
      `INSERT INTO users (mobile_number, email, password, firstname, middlename, lastname, role, account_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, mobile_number, email, firstname, middlename, lastname, role, account_no`,
      [mobile_number, email, hashedPassword, firstname, middlename, lastname, role, account_no]
    );
    
    console.log('User created successfully:', res.rows[0]);
    return res.rows[0];
  } catch (error) {
    console.error('Database error in createUser:', error);
    throw error;
  }
};

export const findUserByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
};

export const findUserByMobileNo = async (mobile_number) => {
  const res = await pool.query('SELECT * FROM users WHERE mobile_number = $1', [mobile_number]);
  return res.rows[0];
};

export const findUserById = async (id) => {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
};

export const updateUserById = async (id, userData) => {
  // This function is now handled in the service layer for better control
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
};

export const deleteUserById = async (id) => {
  const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  return res.rows[0];
};