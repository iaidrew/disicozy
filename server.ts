import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON parsing middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Desi Cozy Cafe API is running" });
  });

  // UPI deep link generation helper (mock/demo focus)
  app.post("/api/payment/upi", (req, res) => {
    const { amount, orderId, vpa = "desi.cozy@upi", name = "Desi Cozy Cafe" } = req.body;
    // Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tid=TRANSACTION_ID&tr=ORDER_ID&tn=NOTE&cu=INR
    const upiLink = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&tr=${orderId}&tn=${encodeURIComponent(`Order ${orderId}`)}&cu=INR`;
    res.json({ upiLink });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
