import express from "express";
import cors from "cors";
import connectionsRouter from "./routes/connections";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === "production") {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
} else {
  app.use(cors());
}

app.use(express.json());

app.use("/api/connections", connectionsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
