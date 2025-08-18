import { 
  createUser, 
  findUserByEmail, 
  findUserByMobileNo,
  updateUserById,
  deleteUserById
} from '../../models/userModel/userModel.js';
import { hashPassword, comparePasswords, generateToken } from '../../utils/hash.js';
import { pool } from '../../config/db.js';

export const registerService = async (mobile_number, email, password, firstname, middlename, lastname, role = 'user', account_number = '') => {
  // Check if email already exists
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) throw new Error('Email already exists');

  // Check if mobile number already exists
  const existingMobile = await findUserByMobileNo(mobile_number);
  if (existingMobile) throw new Error('Mobile number already exists');

  const hashed = await hashPassword(password);
  return await createUser(mobile_number, email, hashed, firstname, middlename, lastname, role, account_number);
};

export const loginService = async (identifier, password) => {
  let user = null;
  
  const isMobileNumber = /^\d+$/.test(identifier);
  
  if (isMobileNumber) {
    user = await findUserByMobileNo(identifier);
  } else {
    user = await findUserByEmail(identifier);
  }
  
  if (!user) throw new Error('User not found');

  const isValid = await comparePasswords(password, user.password);
  if (!isValid) throw new Error('Invalid password');

  const token = generateToken(user);
  return {
    user: {
      id: user.id,
      mobile_number: user.mobile_number,
      email: user.email,
      firstname: user.firstname,
      middlename: user.middlename,
      lastname: user.lastname,
      role: user.role,
      account_no: user.account_no
    },
    token
  };
};

export const getAllUserService = async () => {
  try {
    const query = `
      SELECT 
        id, 
        mobile_number, 
        email, 
        firstname, 
        middlename, 
        lastname, 
        role, 
        account_no,
        created_at,
        updated_at
      FROM users 
      ORDER BY id DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  } catch (err) {
    throw new Error("Error retrieving users: " + err.message);
  }
};

export const updateUserService = async (id, userData) => {
  try {
    console.log('Update service - ID:', id, 'Data:', userData);
    
    const {
      mobileno,
      email,
      password,
      firstName,
      middleName,
      lastName,
      role,
      account_number
    } = userData;

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      throw new Error('User not found');
    }

    // Check if email is taken by another user
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        throw new Error('Email is already taken by another user');
      }
    }

    // Check if mobile is taken by another user
    if (mobileno) {
      const mobileCheck = await pool.query('SELECT id FROM users WHERE mobile_number = $1 AND id != $2', [mobileno, id]);
      if (mobileCheck.rows.length > 0) {
        throw new Error('Mobile number is already taken by another user');
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let valueIndex = 1;

    if (mobileno) {
      updates.push(`mobile_number = $${valueIndex++}`);
      values.push(mobileno);
    }
    if (email) {
      updates.push(`email = $${valueIndex++}`);
      values.push(email);
    }
    if (firstName) {
      updates.push(`firstname = $${valueIndex++}`);
      values.push(firstName);
    }
    if (middleName !== undefined) {
      updates.push(`middlename = $${valueIndex++}`);
      values.push(middleName);
    }
    if (lastName) {
      updates.push(`lastname = $${valueIndex++}`);
      values.push(lastName);
    }
    if (role) {
      updates.push(`role = $${valueIndex++}`);
      values.push(role);
    }
    if (account_number !== undefined) {
      updates.push(`account_no = $${valueIndex++}`);
      values.push(account_number);
    }
    if (password && password.trim() !== '') {
      const hashedPassword = await hashPassword(password);
      updates.push(`password = $${valueIndex++}`);
      values.push(hashedPassword);
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add WHERE clause
    values.push(id);
    
    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${valueIndex} 
      RETURNING id, mobile_number, email, firstname, middlename, lastname, role, account_no
    `;

    console.log('Update query:', query);
    console.log('Update values:', values);

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Update user service error:', error);
    throw error;
  }
};

export const deleteUserService = async (id) => {
  try {
    console.log('Delete service - ID:', id);
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return { message: 'User deleted successfully' };
  } catch (error) {
    console.error('Delete user service error:', error);
    throw error;
  }
};