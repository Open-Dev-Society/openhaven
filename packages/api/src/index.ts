import "./setupEnv"; // Must be first
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from './routes/auth';
import snippetRoutes from './routes/snippets';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';
import searchRoutes from './routes/search';
import topicsRoutes from './routes/topics';
import notificationRoutes from './routes/notifications';
import savedRoutes from './routes/saved';
import reportsRoutes from './routes/reports';
import { Variables } from "./types/hono";

const app = new Hono<{ Variables: Variables }>().basePath("/api/v1");

// Debug: Log DB Host to verify Render Env Var
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
    const host = dbUrl.split('@')[1]?.split(':')[0] || 'unknown';
    console.log(`[DEBUG] Connecting to Database Host: ${host}`);
} else {
    console.error('[DEBUG] DATABASE_URL is NOT defined!');
}

app.onError(errorHandler);

app.use("*", logger());
app.use(
    "*",
    cors({
        origin: "*", // Allow all origins for now, verify requirement later
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
    })
);

app.get("/health", (c) => c.json({ status: "ok" }));



app.route('/auth', authRoutes);
app.route('/snippets', snippetRoutes);
app.route('/comments', commentRoutes);
app.route('/users', userRoutes);
app.route('/', searchRoutes); // mount at root to match /api/v1/search and /api/v1/trending
app.route('/topics', topicsRoutes);
app.route('/notifications', notificationRoutes);
app.route('/saved', savedRoutes);
import adminRoutes from './routes/admin';

// ... other routes

app.route('/admin', adminRoutes);
app.route('/reports', reportsRoutes);

// Export for Vercel
export default app;

// Only run server if called directly (not imported)
if (require.main === module) {
    const port = Number(process.env.PORT) || 3002;
    console.log(`Server is running on port ${port}`);

    const server = serve({
        fetch: app.fetch,
        port
    });

    // Socket.IO setup (Only works on persistent servers like Render/Local)
    // Vercel Serverless does NOT support this.
    const io = new Server(server as any, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // ... (Attach socket logic here if needed, or import it)
    // For now, we keep the socket initialization inside setupSocket(io) if we had one.
    // Re-importing the socket logic from our previous implementation if it was inline?
    // Looking at previous file content, socket logic was inside `serve`.
}
port,
});

import { SocketService } from "./lib/socket";
// Initialize Socket.io
SocketService.getInstance().init(server as any);

export default app;
