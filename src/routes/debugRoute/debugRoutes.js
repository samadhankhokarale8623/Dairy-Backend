// src/routes/debugRoutes.js
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // path to /src/routes

export default async function debugRoutes(fastify, opts) {
  fastify.get('/debug/paths', async (request, reply) => {
    
    // Static file serving path from index.js
    const staticPathFromIndex = path.join(__dirname, '..', 'public');
    
    // File creation path from whatsappController.js
    const creationPathFromController = path.join(__dirname, '..', 'controllers', 'whatsappController', '..', '..', 'public', 'receipts');
    const simplifiedCreationPath = path.join(__dirname, '..', '..', 'public', 'receipts'); // Simplified version

    const response = {
      message: "Render Server Path Information (public is inside src)",
      paths: {
        static_serving_path_from_index: {
          path: staticPathFromIndex,
          exists: fs.existsSync(staticPathFromIndex)
        },
        file_creation_path_from_controller: {
          path: simplifiedCreationPath,
          exists: fs.existsSync(simplifiedCreationPath)
        }
      },
      directory_listing_of_public: fs.existsSync(staticPathFromIndex) ? fs.readdirSync(staticPathFromIndex) : "public directory does not exist"
    };
    reply.send(response);
  });
}