// src/controllers/whatsappController.js (अंतिम आणि 100% बरोबर)

import twilio from 'twilio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePdfReceipt, generateExcelReceipt } from '../../utils/receiptGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // __dirname आता '.../controllers/whatsappController' चा मार्ग देतो.

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const baseUrl = process.env.BASE_URL;
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export const sendReceiptHandler = async (req, reply) => {
  try {
    if (!client) {
        return reply.code(500).send({ error: 'Twilio configuration is missing on the server.' });
    }

    const { receiptData } = req.body;
    if (!receiptData || !receiptData.user || !receiptData.user.mobile_number) {
      return reply.code(400).send({ error: 'Receipt data or user mobile number is missing.' });
    }

    // __dirname पासून दोन फोल्डर मागे जाऊन ('src' मध्ये) 'public/receipts' शोधायचे आहे.
    const receiptsDir = path.join(__dirname, '..', '..', 'public', 'receipts');

    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    // बाकीचा कोड जसा आहे तसाच...
    const timestamp = Date.now();
    const farmerName = `${receiptData.user.firstname}_${receiptData.user.lastname}`.replace(/\s+/g, '_');
    const baseFilename = `${farmerName}_${timestamp}`;

    const pdfFilename = `${baseFilename}.pdf`;
    const pdfFilePath = path.join(receiptsDir, pdfFilename);
    await generatePdfReceipt(receiptData, pdfFilePath);
    const pdfUrl = `${baseUrl}/receipts/${pdfFilename}`;

    const excelFilename = `${baseFilename}.xlsx`;
    const excelFilePath = path.join(receiptsDir, excelFilename);
    await generateExcelReceipt(receiptData, excelFilePath);
    const excelUrl = `${baseUrl}/receipts/${excelFilename}`;

    const userMobile = receiptData.user.mobile_number;
    const toWhatsAppNumber = `whatsapp:+91${userMobile.replace(/\s+/g, '')}`;
    const messageBody = `Namaste ${receiptData.user.firstname},\n\nTumchi ${receiptData.period} kaalavadhi chi pavati sobat jodli ahe.\n\nTotal Liters: ${receiptData.totalLiters} L\nTotal Amount: ₹${receiptData.totalAmount}\n\nDhanyavad!`;

    await client.messages.create({
      from: twilioWhatsAppNumber,
      to: toWhatsAppNumber,
      body: messageBody,
      mediaUrl: [pdfUrl, excelUrl],
    });

    reply.code(200).send({ message: 'WhatsApp message with receipt sent successfully.' });

  } catch (err) {
    console.error("❌❌❌ TWILIO API CALL FAILED ❌❌❌");
    console.error("Error Message:", err.message);
    reply.code(500).send({ error: 'Failed to send WhatsApp message.', details: err.message });
  }
};