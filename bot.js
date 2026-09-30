const login = require("biar-fca");

let apiInstance = null;
let isRunning = false;
let startTime = null;

let targetAdminId = "";
let customReplies = ["āšō ķā", "ïyāķ ķā", "žāľā mō"];
let customSuffixes = ["[Bot System]", "~ 1-Week Nonstop"];

function getRandomDelay(min = 1500, max = 3500) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTrollMessage() {
  if (customReplies.length === 0) return "";
  
  const randomIndex = Math.floor(Math.random() * customReplies.length);
  const selectedWord = customReplies[randomIndex];

  if (customSuffixes.length === 0) {
    return selectedWord;
  }

  const randomSuffix = customSuffixes[Math.floor(Math.random() * customSuffixes.length)];
  return `${selectedWord} ${randomSuffix}`;
}

function updateBotSettings(adminId, repliesArray, suffixesArray) {
  if (adminId) {
    targetAdminId = adminId.trim();
  }
  if (Array.isArray(repliesArray) && repliesArray.length > 0) {
    customReplies = repliesArray;
  }
  if (Array.isArray(suffixesArray) && suffixesArray.length > 0) {
    customSuffixes = suffixesArray;
  }
}

function startBot(appState, callback) {
  if (isRunning) {
    return callback(new Error("Umiiral na ang Bot!"));
  }

  const loginOptions = {
    logLevel: "silent",
    forceLogin: true,
    listenEvents: true,
    selfListen: false,
    autoReconnect: true
  };

  login({ appState }, loginOptions, (err, api) => {
    if (err) {
      console.error("Login Error:", err);
      return callback(err);
    }

    apiInstance = api;
    isRunning = true;
    startTime = Date.now();

    api.setOptions({
      listenEvents: true,
      selfListen: false,
      autoMarkRead: true
    });

    console.log("Bot: Nakapag-login na at nakikinig na sa mga mensahe...");

    api.listenMqtt((listenErr, event) => {
      if (listenErr) {
        console.error("MQTT Error:", listenErr);
        return;
      }

      if (event.type === "message" || event.type === "message_reply") {
        // Filter: Makikinig LANG sa napiling Admin ID
        if (targetAdminId && event.senderID !== targetAdminId) {
          return;
        }

        const replyText = generateTrollMessage();
        if (!replyText) return;

        setTimeout(() => {
          api.sendMessage(replyText, event.threadID, (sendErr) => {
            if (sendErr) {
              console.error("Bigo sa pagpapadala ng message:", sendErr);
            } else {
              console.log(`[Replied to Admin ${event.senderID}]: ${replyText}`);
            }
          });
        }, getRandomDelay());
      }
    });

    callback(null, "Matagumpay na na-start ang Bot!");
  });
}

function stopBot() {
  if (apiInstance) {
    try {
      apiInstance.logout();
    } catch (e) {
      console.log("Logout note:", e.message);
    }
  }
  apiInstance = null;
  isRunning = false;
  startTime = null;
}

function getStatus() {
  return {
    running: isRunning,
    uptime: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0,
    adminId: targetAdminId,
    repliesCount: customReplies.length,
    suffixesCount: customSuffixes.length
  };
}

module.exports = {
  startBot,
  stopBot,
  getStatus,
  updateBotSettings
};
