// Vercel serverless wrapper - imports the *built* handler, not the raw package
import handler from '../dist/server/server.js'
export default handler
