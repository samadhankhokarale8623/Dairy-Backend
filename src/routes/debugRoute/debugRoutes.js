// src/routes/debugRoutes.js

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function debugRoutes(fastify, opts) {
  fastify.get('/debug/paths', async (request, reply) => {
    
    // आपण सर्व संभाव्य मार्ग तपासूया
    const pathFromCwd = path.join(process.cwd(), 'public');
    const pathFromSrcDirname = path.join(__dirname, '..', 'public'); // __dirname is in /routes, so go back one level to /src

    const response = {
      message: "Render Server Path Information",
      process_cwd: process.cwd(),
      dirname_of_this_file: __dirname,
      paths_we_are_testing: {
        from_cwd: {
          path: pathFromCwd,
          exists: fs.existsSync(pathFromCwd)
        },
        from_src_dirname: {
          path: pathFromSrcDirname,
          exists: fs.existsSync(pathFromSrcDirname)
        }
      }
    };

    reply.send(response);
  });
}