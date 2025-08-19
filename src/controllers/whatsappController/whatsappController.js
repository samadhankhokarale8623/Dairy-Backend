// src/controllers/whatsappController/whatsappController.js

import twilio from "twilio";
import { v2 as cloudinary } from "cloudinary";
import {
  generatePdfReceiptBuffer,
  generateExcelReceiptBuffer,
} from "../../utils/receiptGenerator.js";

// Twilio Client Setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// फाईल Cloudinary वर अपलोड करण्यासाठी अचूक फंक्शन
const uploadToCloudinary = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: fileName,
        access_mode: "public", // <<-- हा सर्वात महत्त्वाचा आणि अंतिम बदल आहे
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};
// 2 सेकंद थांबण्यासाठी एक सोपे फंक्शन
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const sendReceiptHandler = async (req, reply) => {
  try {
    if (!client) {
      return reply
        .code(500)
        .send({ error: "Twilio configuration is missing." });
    }
    const { receiptData } = req.body;
    if (!receiptData || !receiptData.user) {
      return reply.code(400).send({ error: "Receipt data is missing." });
    }

    const timestamp = Date.now();
    const farmerName =
      `${receiptData.user.firstname}_${receiptData.user.lastname}`.replace(
        /\s+/g,
        "_"
      );

    // 1. PDF तयार करून Cloudinary वर अपलोड करा
    console.log("Generating PDF buffer...");
    const pdfBuffer = await generatePdfReceiptBuffer(receiptData);

    // ================== सुरक्षा तपासणी (Safety Check) START ==================
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error("CRITICAL ERROR: Generated PDF buffer is empty!");
      throw new Error("Generated PDF file was empty. Cannot upload.");
    }
    console.log(`Generated PDF buffer size: ${pdfBuffer.length} bytes.`);
    // ================== सुरक्षा तपासणी (Safety Check) END ==================

    const pdfFilename = `${farmerName}_${timestamp}.pdf`;
    console.log("Uploading PDF to Cloudinary...");
    const pdfUploadResult = await uploadToCloudinary(pdfBuffer, pdfFilename);
    const pdfUrl = pdfUploadResult.secure_url;
    console.log(`PDF uploaded to Cloudinary: ${pdfUrl}`);

    // 2. Excel तयार करून Cloudinary वर अपलोड करा
    console.log("Generating Excel buffer...");
    const excelBuffer = await generateExcelReceiptBuffer(receiptData);

    // ================== सुरक्षा तपासणी (Safety Check) START ==================
    if (!excelBuffer || excelBuffer.length === 0) {
      console.error("CRITICAL ERROR: Generated Excel buffer is empty!");
      throw new Error("Generated Excel file was empty. Cannot upload.");
    }
    console.log(`Generated Excel buffer size: ${excelBuffer.length} bytes.`);
    // ================== सुरक्षा तपासणी (Safety Check) END ==================

    const excelFilename = `${farmerName}_${timestamp}.xlsx`;
    console.log("Uploading Excel to Cloudinary...");
    const excelUploadResult = await uploadToCloudinary(
      excelBuffer,
      excelFilename
    );
    const excelUrl = excelUploadResult.secure_url;
    console.log(`Excel uploaded to Cloudinary: ${excelUrl}`);
    // ================== हा महत्त्वाचा बदल आहे ==================
    // console.log(
    //   "Waiting for 6 seconds to allow Cloudinary to process the files..."
    // );
    // await delay(6000); // 2000 milliseconds = 2 seconds
    // =========================================================

    // 3. Twilio ला Cloudinary URLs पाठवा
    const userMobile = receiptData.user.mobile_number;
    const toWhatsAppNumber = `whatsapp:+91${userMobile.replace(/\s+/g, "")}`;
    const messageBody = `Namaste ${receiptData.user.firstname},\n\nTumchi ${receiptData.period} kaalavadhi chi pavati sobat jodli ahe.\n\nTotal Liters: ${receiptData.totalLiters} L\nTotal Amount: ₹${receiptData.totalAmount}\n\nDhanyavad!`;

    await client.messages.create({
      from: twilioWhatsAppNumber,
      to: toWhatsAppNumber,
      body: messageBody,
      mediaUrl: [pdfUrl, excelUrl],
    });

    reply
      .code(200)
      .send({ message: "WhatsApp message sent successfully via Cloudinary." });
  } catch (err) {
    console.error("❌ FAILED TO PROCESS AND SEND VIA CLOUDINARY ❌", err);
    reply.code(500).send({
      error: "Failed to send WhatsApp message.",
      details: err.message,
    });
  }
};
