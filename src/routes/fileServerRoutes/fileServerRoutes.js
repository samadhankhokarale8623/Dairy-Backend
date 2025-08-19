// src/routes/fileServerRoutes.js
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // path to /src/routes

export default async function fileServerRoutes(fastify, opts) {
  
  // हा मार्ग /receipts/some-file-name.pdf अशा विनंत्या हाताळेल
  fastify.get('/receipts/:fileName', async (request, reply) => {
    try {
      const { fileName } = request.params;
      
      // आपल्या public/receipts फोल्डरचा अचूक मार्ग तयार करा
      const filePath = path.join(__dirname, '..', 'public', 'receipts', fileName);

      // फाईल अस्तित्वात आहे का ते तपासा
      if (fs.existsSync(filePath)) {
        // फाईलचा प्रवाह (stream) तयार करा आणि प्रतिसाद म्हणून पाठवा
        const stream = fs.createReadStream(filePath);
        
        // फाईलच्या प्रकारानुसार Content-Type सेट करा
        if (fileName.endsWith('.pdf')) {
          reply.header('Content-Type', 'application/pdf');
        } else if (fileName.endsWith('.xlsx')) {
          reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        }
        
        return reply.send(stream);
      } else {
        // फाईल सापडली नाही, तर 404 पाठवा
        console.error(`[File Server] File not found at path: ${filePath}`);
        return reply.code(404).send({ error: 'File not found' });
      }
    } catch (err) {
      console.error('[File Server] Error serving file:', err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}