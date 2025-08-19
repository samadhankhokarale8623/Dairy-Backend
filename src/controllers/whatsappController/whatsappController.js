// src/controllers/whatsappController/whatsappController.js

import twilio from 'twilio';
import { v2 as cloudinary } from 'cloudinary';
import { generatePdfReceiptBuffer, generateExcelReceiptBuffer } from '../../utils/receiptGenerator.js';

// Twilio Client Setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

// Cloudinary Configuration (हे स्वतःच Environment Variables मधून माहिती घेते)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// फाईल Cloudinary वर अपलोड करण्यासाठी एक सोपे फंक्शन
const uploadToCloudinary = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        resource_type: "raw", // PDF/XLSX सारख्या फाईल्ससाठी 'raw' वापरा
        public_id: fileName   // Cloudinary वर फाईलला काय नाव द्यायचे
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result); // यशस्वी झाल्यास परिणाम परत करा
      }
    );
    uploadStream.end(buffer);
  });
};

export const sendReceiptHandler = async (req, reply) => {
  try {
    if (!client) {
        return reply.code(500).send({ error: 'Twilio configuration is missing.' });
    }
    const { receiptData } = req.body;
    if (!receiptData || !receiptData.user) {
      return reply.code(400).send({ error: 'Receipt data is missing.' });
    }

    const timestamp = Date.now();
    const farmerName = `${receiptData.user.firstname}_${receiptData.user.lastname}`.replace(/\s+/g, '_');
    
    // 1. PDF तयार करून Cloudinary वर अपलोड करा
    console.log("Generating PDF buffer...");
    const pdfBuffer = await generatePdfReceiptBuffer(receiptData);
    const pdfFilename = `${farmerName}_${timestamp}`; // .pdf लावण्याची गरज नाही
    console.log("Uploading PDF to Cloudinary...");
    const pdfUploadResult = await uploadToCloudinary(pdfBuffer, pdfFilename);
    const pdfUrl = pdfUploadResult.secure_url; // ही आहे तुमची सार्वजनिक URL
    console.log(`PDF uploaded successfully: ${pdfUrl}`);

    // 2. Excel तयार करून Cloudinary वर अपलोड करा
    console.log("Generating Excel buffer...");
    const excelBuffer = await generateExcelReceiptBuffer(receiptData);
    const excelFilename = `${farmerName}_${timestamp}`; // .xlsx लावण्याची गरज नाही
    console.log("Uploading Excel to Cloudinary...");
    const excelUploadResult = await uploadToCloudinary(excelBuffer, excelFilename);
    const excelUrl = excelUploadResult.secure_url; // ही आहे तुमची सार्वजनिक URL
    console.log(`Excel uploaded successfully: ${excelUrl}`);

    // 3. Twilio ला Cloudinary च्या URLs पाठवा
    const userMobile = receiptData.user.mobile_number;
    const toWhatsAppNumber = `whatsapp:+91${userMobile.replace(/\s+/g, '')}`;
    const messageBody = `Namaste ${receiptData.user.firstname},\n\nTumchi ${receiptData.period} kaalavadhi chi pavati sobat jodli ahe.\n\nTotal Liters: ${receiptData.totalLiters} L\nTotal Amount: ₹${receiptData.totalAmount}\n\nDhanyavad!`;

    console.log("Sending message via Twilio...");
    await client.messages.create({
      from: twilioWhatsAppNumber,
      to: toWhatsAppNumber,
      body: messageBody,
      mediaUrl: [pdfUrl, excelUrl], // आता आपण Cloudinary च्या URLs वापरत आहोत
    });

    reply.code(200).send({ message: 'WhatsApp message sent successfully via Cloudinary.' });

  } catch (err) {
    console.error("❌ FAILED TO PROCESS AND SEND VIA CLOUDINARY ❌", err);
    reply.code(500).send({ error: 'Failed to send WhatsApp message.', details: err.message });
  }
};