// src/index.js (नवीन आणि अंतिम दुरुस्त केलेला)

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
import debugRoutes from "./routes/debugRoute/debugRoutes.js"; // डीबगची आता गरज नाही

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // __dirname आता 'src' फोल्डरचा मार्ग देतो.

dotenv.config();
const app = Fastify({ logger: true });

// ===================================================================
// ==          हा अचूक मार्ग वापरा (Use this correct path)           ==
// ===================================================================
// 'public' फोल्डर आता 'src' च्या आत असल्यामुळे, हा मार्ग 100% काम करेल.
const publicPath = path.join(process.cwd(), 'public');

app.register(fastifyStatic, {
  root: publicPath,
  prefix: '/',
});
// ===================================================================

// CORS सेटिंग्ज
await app.register(cors, {
  origin: [
    "http://localhost:5173",
    "https://dairy-backend-3vlc.onrender.com",
    "https://baap-dairy-platform-frontend.onrender.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// Routes
app.register(authRoutes, { prefix: "/api/auth" });
app.register(dashboardRoutes, { prefix: "/api" });
app.register(milkRoutes, { prefix: "/api/milk" });
app.register(whatsAppRoutes, { prefix: "/api" });
app.register(debugRoutes, { prefix: "/api" });

const start = async () => {
  try {
    const port = process.env.PORT || 10000; // Render साठी 10000 वापरा
    await app.listen({ port: port, host: "0.0.0.0" });
    console.log(`✅ Server running on port ${port}`);
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
