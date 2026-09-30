const express = require("express");
const session = require("express-session");
const path = require("path");
const bot = require("./bot");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "biar_fca_troll_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
  })
);

app.post("/api/start", (req, res) => {
  const { adminId, appStateInput, replies, suffixes } = req.body;

  if (!appStateInput) {
    return res.status(400).json({ success: false, message: "Kailangan ang C3C AppState JSON!" });
  }

  if (!adminId) {
    return res.status(400).json({ success: false, message: "Kailangan ang Admin Facebook UID!" });
  }

  const replyList = replies ? replies.split("\n").map(r => r.trim()).filter(Boolean) : [];
  const suffixList = suffixes ? suffixes.split("\n").map(s => s.trim()).filter(Boolean) : [];

  bot.updateBotSettings(adminId, replyList, suffixList);

  let parsedAppState;
  try {
    parsedAppState = JSON.parse(appStateInput);
  } catch (e) {
    return res.status(400).json({ success: false, message: "Invalid JSON / C3C AppState Format!" });
  }

  bot.startBot(parsedAppState, (err, msg) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message || "Bigo sa pag-start ng bot" });
    }
    return res.json({ success: true, message: msg });
  });
});

app.post("/api/stop", (req, res) => {
  bot.stopBot();
  return res.json({ success: true, message: "Napatigil na ang Bot." });
});

app.get("/api/status", (req, res) => {
  return res.json(bot.getStatus());
});

// Compatible sa Railway at iba pang cloud platforms (0.0.0.0 host binding)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dashboard running on port ${PORT}`);
});
