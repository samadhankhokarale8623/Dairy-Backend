import { pool } from "../../config/db.js";

export const fetchDashboardStats = async (req, reply) => {
  try {
    const client = await pool.connect();

    // 1. Get Today's Milk Collection
    const todayMilkQuery = await client.query(
      `SELECT COALESCE(SUM(liters), 0) as total_liters FROM milk_collection WHERE date = CURRENT_DATE`
    );
    const todayMilk = parseFloat(todayMilkQuery.rows[0].total_liters).toFixed(2);

    // 2. Get Total Farmers
    const farmerCountQuery = await client.query(
      `SELECT COUNT(id) as total_farmers FROM users WHERE role = 'user'`
    );
    const totalFarmers = parseInt(farmerCountQuery.rows[0].total_farmers);
    
    // *** FIX: 'payments' टेबल अस्तित्वात नसल्यामुळे तात्पुरते कमेंट केले आहे ***
    // जोपर्यंत तुम्ही 'payments' टेबल तयार करत नाही, तोपर्यंत ही क्वेरी एरर देईल.
    // const paymentQuery = await client.query(
    //     `SELECT COALESCE(SUM(amount), 0) as total_due FROM payments WHERE status = 'pending'`
    // );
    // const pendingPayments = parseFloat(paymentQuery.rows[0].total_due).toFixed(2);
    
    // *** FIX: 'pendingPayments' साठी तात्पुरती डीफॉल्ट व्हॅल्यू सेट केली आहे ***
    const pendingPayments = "0.00";

    // 4. Last 7 days milk collection for the chart
    const milkLast7DaysQuery = await client.query(`
      SELECT 
        to_char(date, 'Dy') as day, 
        SUM(liters) as liters
      FROM milk_collection
      WHERE date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY date
      ORDER BY date ASC
    `);

    // 5. Top 5 Farmers by milk amount for the bar chart
    const topFarmersQuery = await client.query(`
      SELECT 
        farmer_name, 
        SUM(total) as total_amount
      FROM milk_collection
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY farmer_name
      ORDER BY total_amount DESC
      LIMIT 5
    `);

    client.release();

    reply.send({
      stats: {
        todayMilk,
        pendingPayments,
        totalFarmers,
      },
      charts: {
        milkLast7Days: milkLast7DaysQuery.rows,
        topFarmers: topFarmersQuery.rows,
      },
      labels: {
        header: "Milk Collection Overview",
        milkLabel: "Today's Milk Collection",
        paymentLabel: "Pending Payments",
        farmerLabel: "Total Farmers",
      }
    });

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    // Erro चा प्रतिसाद बदललेला नाही, कारण फ्रंटएन्ड यावर अवलंबून असू शकतो.
    reply.status(500).send({ error: "Failed to fetch dashboard data" });
  }
};