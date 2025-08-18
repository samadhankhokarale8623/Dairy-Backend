// src/index.js

import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import path from "path";
import { fileURLToPath } from "url";
import fastifyStatic from "@fastify/static";

// Routes
import authRoutes from "./routes/authRoute/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes/dashboardRoutes.js";
import milkRoutes from "./routes/milkRoutes/milkRoutes.js";
import whatsAppRoutes from "./routes/whatsappRoutes/whatsappRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = Fastify({ logger: true });

// Register static file server for public assets like receipts
// This requires a 'public' folder inside the 'src' directory.
app.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/", // Files will be accessible from the root URL, e.g., /receipts/farmer.pdf
});

// Enable CORS for frontend
await app.register(cors, {
  origin: [
    "http://localhost:5173",
    "https://baap-dairy-backend.trycloudflare.com",
    "https://baap-dairy-backend-123.trycloudflare.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// Register all routes with their respective prefixes
app.register(authRoutes, { prefix: "/api/auth" });
app.register(dashboardRoutes, { prefix: "/api" }); // URL: /api/dashboard/stats
app.register(milkRoutes, { prefix: "/api/milk" });
app.register(whatsAppRoutes, { prefix: "/api" }); // URL: /api/whatsapp/send-receipt

const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await app.listen({ port: port, host: "0.0.0.0" });
    console.log(`✅ Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// import Fastify from 'fastify';
// import dotenv from 'dotenv';
// import authRoutes from './routes/authRoutes.js';

// dotenv.config();
// const app = Fastify({ logger: true });

// app.register(authRoutes, { prefix: '/api/auth' });

// const start = async () => {
//   try {
//     await app.listen({ port: process.env.PORT });
//     console.log('Server started');
//   } catch (err) {
//     app.log.error(err);
//     process.exit(1);
//   }
// };

// start();
