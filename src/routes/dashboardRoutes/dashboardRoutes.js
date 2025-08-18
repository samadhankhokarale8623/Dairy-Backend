
import { fetchDashboardStats } from "../../controllers/dashboardController/dashboardController.js";

export default async function dashboardRoutes(fastify, opts) {

  fastify.get('/dashboard/stats', fetchDashboardStats);
}