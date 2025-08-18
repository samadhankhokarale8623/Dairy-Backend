// src/controllers/whatsappController/whatsappController.js

import twilio from "twilio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  generatePdfReceipt,
  generateExcelReceipt,
} from "../../utils/receiptGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- तुमच्या .env फाइलमधील व्हॅल्यूज इथे लॉग करून तपासा ---
console.log("--- Loading Twilio Config ---");
console.log(
  "TWILIO_ACCOUNT_SID:",
  process.env.TWILIO_ACCOUNT_SID
    ? `...${process.env.TWILIO_ACCOUNT_SID.slice(-4)}`
    : "MISSING!"
);
console.log(
  "TWILIO_AUTH_TOKEN:",
  process.env.TWILIO_AUTH_TOKEN ? "Loaded" : "MISSING!"
);
console.log(
  "TWILIO_WHATSAPP_NUMBER:",
  process.env.TWILIO_WHATSAPP_NUMBER || "MISSING!"
);
console.log("BASE_URL:", process.env.BASE_URL || "MISSING!");
console.log("---------------------------------");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const baseUrl = process.env.BASE_URL;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const sendReceiptHandler = async (req, reply) => {
  try {
    if (!client) {
      console.error("FATAL: Twilio client not initialized. Check .env file.");
      return reply
        .code(500)
        .send({ error: "Twilio configuration is missing on the server." });
    }

    const { receiptData } = req.body;
    if (!receiptData || !receiptData.user || !receiptData.user.mobile_number) {
      return reply
        .code(400)
        .send({ error: "Receipt data or user mobile number is missing." });
    }

    const receiptsDir = path.join(__dirname, "..", "..", "public", "receipts");

    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const farmerName =
      `${receiptData.user.firstname}_${receiptData.user.lastname}`.replace(
        /\s+/g,
        "_"
      );
    const baseFilename = `${farmerName}_${timestamp}`;

    // Generate files
    const pdfFilename = `${baseFilename}.pdf`;
    const pdfFilePath = path.join(receiptsDir, pdfFilename);
    await generatePdfReceipt(receiptData, pdfFilePath);
    const pdfUrl = `${baseUrl}/receipts/${pdfFilename}`;

    const excelFilename = `${baseFilename}.xlsx`;
    const excelFilePath = path.join(receiptsDir, excelFilename);
    await generateExcelReceipt(receiptData, excelFilePath);
    const excelUrl = `${baseUrl}/receipts/${excelFilename}`;

    const userMobile = receiptData.user.mobile_number;
    const toWhatsAppNumber = `whatsapp:+91${userMobile.replace(/\s+/g, "")}`;
    const messageBody = `Namaste ${receiptData.user.firstname},\n\nTumchi ${receiptData.period} kaalavadhi chi pavati sobat jodli ahe.\n\nTotal Liters: ${receiptData.totalLiters} L\nTotal Amount: ₹${receiptData.totalAmount}\n\nDhanyavad!`;

    // --- LOG DATA BEFORE SENDING TO TWILIO ---
    console.log(">>> Preparing to send message via Twilio <<<");
    console.log("To:", toWhatsAppNumber);
    console.log("From:", twilioWhatsAppNumber);
    console.log("PDF Media URL:", pdfUrl);
    console.log("Excel Media URL:", excelUrl);
    // ---

    await client.messages.create({
      from: twilioWhatsAppNumber,
      to: toWhatsAppNumber,
      body: messageBody,
      mediaUrl: [pdfUrl, excelUrl],
    });

    console.log("✅ Twilio API call successful. Message should be sent.");
    reply
      .code(200)
      .send({ message: "WhatsApp message with receipt sent successfully." });
  } catch (err) {
    // --- IMPROVED ERROR LOGGING ---
    console.error("❌❌❌ TWILIO API CALL FAILED ❌❌❌");
    console.error("Twilio Error Code:", err.code); // उदा. 21211 (Invalid 'To' phone number)
    console.error("Twilio Error Status:", err.status); // उदा. 400
    console.error("Error Message:", err.message); // सविस्तर मेसेज
    console.error("More Info Link:", err.more_info); // अधिक माहितीसाठी लिंक
    console.error("--------------------------------------");

    reply.code(500).send({
      error: "Failed to send WhatsApp message.",
      details: err.message, // Send Twilio's error message to the frontend
      code: err.code,
    });
  }
};
