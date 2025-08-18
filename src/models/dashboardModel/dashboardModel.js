const db = require("../config/db");

exports.getMilkStats = async () => {
  const result = await db.query("SELECT date, liters FROM milk_stats ORDER BY id");
  return result.rows;
};

exports.getPayments = async () => {
  const result = await db.query("SELECT farmer, amount FROM payments ORDER BY amount DESC");
  return result.rows;
};
