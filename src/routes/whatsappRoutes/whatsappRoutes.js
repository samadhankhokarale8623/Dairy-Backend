// src/routes/whatsappRoutes/whatsappRoutes.js

import { sendReceiptHandler } from "../../controllers/whatsappController/whatsappController.js";

export default async function whatsAppRoutes(fastify, opts) {
  // URL: /api/whatsapp/send-receipt
  fastify.post("/whatsapp/send-receipt", sendReceiptHandler);
}