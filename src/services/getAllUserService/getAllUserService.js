// import { pool } from '../../config/db.js';

// export const getAllUserService = async () => {
//   try {
//     const query = `SELECT id, username, email, role, firstname, middlename, lastname FROM users`;
//     const { rows } = await pool.query(query);
//     return rows;
//   } catch (err) {
//     throw new Error("Error retrieving users: " + err.message);
//   }
// };
