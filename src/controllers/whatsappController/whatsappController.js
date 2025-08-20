// src/controllers/whatsappController/whatsappController.js

import twilio from 'twilio';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { generatePdfReceiptBuffer, generateExcelReceiptBuffer } from '../../utils/receiptGenerator.js';

// ... Twilio आणि Cloudinary Configuration जसेच्या तसे ठेवा ...

// फाईल Cloudinary वर अपलोड करण्यासाठी फंक्शन
const uploadToCloudinary = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", public_id: fileName, access_mode: 'public' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// थांबण्यासाठी फंक्शन
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// URL तयार आहे की नाही हे तपासण्यासाठी फंक्शन
const checkUrlIsReady = async (url) => {
  console.log(`Checking URL readiness: ${url}`);
  for (let i = 0; i < 5; i++) {
    try {
      const response = await axios.head(url);
      const contentLength = response.headers['content-length'];
      console.log(`Attempt ${i+1}: URL is accessible. Content-Length: ${contentLength}`);
      if (contentLength && parseInt(contentLength, 10) > 100) {
        console.log("URL is ready!");
        return true;
      }
    } catch (error) {
      console.warn(`Attempt ${i+1}: URL not ready yet. Error: ${error.message}`);
    }
    await delay(2000);
  }
  throw new Error(`File at ${url} was not ready after several attempts.`);
};

export const sendReceiptHandler = async (req, reply) => {
  try {
    const { receiptData } = req.body;
    const timestamp = Date.now();
    const farmerName = `${receiptData.user.firstname}_${receiptData.user.lastname}`.replace(/\s+/g, '_');
    
    // ----- फक्त PDF तयार करणे आणि अपलोड करणे -----
    console.log("Generating PDF buffer...");
    const pdfBuffer = await generatePdfReceiptBuffer(receiptData);
    if (!pdfBuffer || pdfBuffer.length === 0) throw new Error("Generated PDF file was empty.");
    const pdfFilename = `${farmerName}_${timestamp}.pdf`;
    const pdfUploadResult = await uploadToCloudinary(pdfBuffer, pdfFilename);
    const pdfUrl = pdfUploadResult.secure_url;
    
    // Excel चा भाग आपण तात्पुरता काढून टाकला आहे
    // console.log("Generating Excel buffer...");
    // const excelBuffer = await generateExcelReceiptBuffer(receiptData);
    // if (!excelBuffer || excelBuffer.length === 0) throw new Error("Generated Excel file was empty.");
    // const excelFilename = `${farmerName}_${timestamp}.xlsx`;
    // const excelUploadResult = await uploadToCloudinary(excelBuffer, excelFilename);
    // const excelUrl = excelUploadResult.secure_url;

    // ----- आता आपण फक्त PDF ची खात्री करणार आहोत -----
    await checkUrlIsReady(pdfUrl);
    // await checkUrlIsReady(excelUrl); // Excel ची तपासणी काढून टाकली
    
    // Twilio ला मेसेज पाठवणे
    const userMobile = receiptData.user.mobile_number;
    const toWhatsAppNumber = `whatsapp:+91${userMobile.replace(/\s+/g, '')}`;
    const messageBody = `Namaste ${receiptData.user.firstname},\n\nTumchi ${receiptData.period} kaalavadhi chi pavati sobat jodli ahe.\n\nTotal Liters: ${receiptData.totalLiters} L\nTotal Amount: ₹${receiptData.totalAmount}\n\nDhanyavad!`;

    console.log("PDF is ready on Cloudinary. Sending message to Twilio...");
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: toWhatsAppNumber,
      body: messageBody,
      mediaUrl: [pdfUrl], // <<-- हा सर्वात महत्त्वाचा बदल आहे (फक्त PDF URL)
    });

    console.log("Message with only PDF sent successfully!");
    reply.code(200).send({ message: 'WhatsApp message with only PDF sent successfully.' });

  } catch (err) {
    console.error("❌ FINAL ATTEMPT FAILED ❌", err);
    reply.code(500).send({ 
        error: 'Failed to send WhatsApp message.', 
        details: err.message
    });
  }
};