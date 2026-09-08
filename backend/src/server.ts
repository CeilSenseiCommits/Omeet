import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import organizationRoutes from "./routes/organizationRoutes";
import invitationRoutes from "./routes/invitationRoutes";
import meetingRoutes from "./routes/meetingRoutes";
import friendRoutes from "./routes/friendRoutes";
import personalChatRoutes from "./routes/personalChatRoutes";
import { initializeDatabase } from "./db/init";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Normalize repeated slashes in URLs e.g. //api/... -> /api/...
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/organizations/:id/invitations", invitationRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/personal", personalChatRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", service: "OMeet Backend", timestamp: new Date().toISOString() });
});

// Boot server and auto-initialize Neon database
async function startServer() {
  try {
    // Automatically ensures tables and indexes exist in Neon cloud PostgreSQL
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`🚀 OMeet Backend listening on http://localhost:${PORT}`);
      console.log(`🐘 Connected to Neon Cloud PostgreSQL`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error("Failed to start OMeet backend server:", error);
    process.exit(1);
  }
}

startServer();
