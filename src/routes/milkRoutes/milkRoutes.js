// src/routes/milkRoutes/milkRoutes.js

import {
  addMilk,
  getAllMilk,
  getMilkByDateHandler,
  updateMilk,
  deleteMilk,
} from "../../controllers/milkController/milkController.js";

export default async function milkRoutes(fastify, opts) {
  fastify.post("/add", addMilk);                  // URL: /api/milk/add
  fastify.get("/all", getAllMilk);                // URL: /api/milk/all
  fastify.get("/filter", getMilkByDateHandler);   // URL: /api/milk/filter?date=...
  fastify.put("/update/:id", updateMilk);         // URL: /api/milk/update/:id
  fastify.delete("/delete/:id", deleteMilk);      // URL: /api/milk/delete/:id
}