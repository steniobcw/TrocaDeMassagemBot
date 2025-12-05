import express from "express";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// --- seu código de comandos aqui (ex: bot.command, bot.on etc.) ---
// exemplo mínimo:
bot.command("queromassagem", ctx => ctx.reply("Comandos..."));

// -------------------------------------------------
// Express server to receive webhook requests
const app = express();

// If Render provides a path, use it; otherwise use '/'
app.use(express.json());

// Telegraf’s webhook callback:
app.use(bot.webhookCallback("/telegram-webhook"));

// Healthcheck
app.get("/", (req, res) => res.send("OK - Bot running"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Set webhook on start (Telegram needs full URL)
  // RENDER will give you a URL like https://your-service.onrender.com
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL;
  if (!RENDER_URL) {
    console.log("RENDER_EXTERNAL_URL / BASE_URL not set. Skipping setWebhook.");
    return;
  }

  const webhookUrl = `${RENDER_URL.replace(/\/$/, "")}/telegram-webhook`;
  try {
    await bot.telegram.setWebhook(webhookUrl);
    console.log("Webhook set to", webhookUrl);
  } catch (err) {
    console.error("Failed to set webhook:", err);
  }
});
