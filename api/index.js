// Vercel only auto-detects Serverless Functions inside /api, so this thin
// entry re-exports the actual Express app defined in backend/server.js.
module.exports = require('../backend/server.js');
