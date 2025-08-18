import { pool } from '../../config/db.js';

// Function to add a new milk entry
export const addMilkEntry = async (entryData) => {
  const {
    user_id,
    farmer_name,
    mobile_number,
    date,
    timing,
    liters,
    fat,
    snf,
    degree,
    rate,
    total
  } = entryData;

  const query = `
    INSERT INTO milk_collection 
    (user_id, farmer_name, mobile_number, date, timing, liters, fat, snf, degree, rate, total, updated_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    RETURNING *;
  `;
  
  const values = [user_id, farmer_name, mobile_number, date, timing, liters, fat, snf, degree, rate, total];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Function to get all milk entries, ordered by date
export const getAllMilkEntries = async () => {
  const result = await pool.query('SELECT * FROM milk_collection ORDER BY date DESC, timing ASC');
  return result.rows;
};

// Function to get milk entries for a specific date
export const getMilkByDate = async (date) => {
  const result = await pool.query('SELECT * FROM milk_collection WHERE date = $1 ORDER BY timing ASC', [date]);
  return result.rows;
};

// Function to update an existing milk entry by its ID
export const updateMilkEntry = async (id, entryData) => {
  const {
    liters,
    fat,
    snf,
    degree,
    rate,
    total
  } = entryData;

  // Dynamically build the query based on provided fields
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (liters !== undefined) { fields.push(`liters = $${paramIndex++}`); values.push(liters); }
  if (fat !== undefined) { fields.push(`fat = $${paramIndex++}`); values.push(fat); }
  if (snf !== undefined) { fields.push(`snf = $${paramIndex++}`); values.push(snf); }
  if (degree !== undefined) { fields.push(`degree = $${paramIndex++}`); values.push(degree); }
  if (rate !== undefined) { fields.push(`rate = $${paramIndex++}`); values.push(rate); }
  if (total !== undefined) { fields.push(`total = $${paramIndex++}`); values.push(total); }
  
  if (fields.length === 0) {
    // Nothing to update, maybe return the existing entry or an error
    const existing = await pool.query('SELECT * from milk_collection WHERE id = $1', [id]);
    return existing.rows[0];
  }
  
  // Always update the 'updated_at' timestamp
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE milk_collection 
    SET ${fields.join(', ')} 
    WHERE id = $${paramIndex} 
    RETURNING *;
  `;
  
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Function to delete a milk entry by its ID
export const deleteMilkEntry = async (id) => {
  const result = await pool.query('DELETE FROM milk_collection WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};