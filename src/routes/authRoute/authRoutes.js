// src/routes/authRoute/authRoutes.js

import {
  registerHandler,
  loginHandler,
  getAllUsersHandler,
  updateUserHandler,
  deleteUserHandler,
} from "../../controllers/authcontroller/authController.js";

// async वापरल्यामुळे 'done' ची गरज नाही.
export default async function authRoutes(fastify) {
  fastify.post("/register", registerHandler);
  fastify.post("/login", loginHandler);
  fastify.get("/users", getAllUsersHandler); // URL: /api/auth/users
  fastify.put("/users/:id", updateUserHandler);
  fastify.delete("/users/:id", deleteUserHandler);
}