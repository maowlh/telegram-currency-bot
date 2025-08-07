const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '8131767206:AAFGgmTv6YkbQxRCK5bW9irrg_v8RZSuv3I'; // BotFather token
const bot = new TelegramBot(token, { polling: true });

const currencyMap = {
  "تتر": { key: "USDT", type: "crypto" },
  "ترون": { key: "TRX", type: "crypto" },
  "تون": { key: "TON", type: "crypto" },
  "بیت کوین": { key: "BTC", type: "crypto" },
  "دلار": { key: "usd", type: "fiat" },
  "یورو": { key: "eur", type: "fiat" },
  "لیر": { key: "try", type: "fiat" },
  "پوند": { key: "gbp", type: "fiat" },
};

const userState = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = {};

  bot.sendMessage(chatId, "🪙 ارز مورد نظر را انتخاب کن:", {
    reply_markup: {
      keyboard: [
        ["تتر", "دلار", "لیر"],
        ["یورو", "پوند", "ترون"],
        ["تون", "بیت کوین"]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '/start') return;

  // انتخاب ارز
  if (!userState[chatId]?.currency && currencyMap[text]) {
    userState[chatId] = { currency: text };
    bot.sendMessage(chatId, `✅ مقدار ${text} را وارد کن:`);
    return;
  }

  // مقدار ارز
  if (userState[chatId]?.currency && !userState[chatId]?.amount) {
    const amount = parseFloat(text.replace(/,/g, ".").replace(/[^\d.]/g, ""));
    if (isNaN(amount) || amount <= 0) {
      bot.sendMessage(chatId, "❗ لطفاً یک عدد معتبر وارد کن:");
      return;
    }

    const selected = currencyMap[userState[chatId].currency];
    const url = `https://api.alanchand.com/?type=${selected.type === "crypto" ? "crypto" : "currencies"}&token=zYAMhyxJUJyB0w3qn24R`;

    try {
      const response = await axios.get(url);
      const data = response.data;
      const item = data[selected.key];

      let rate = selected.type === "crypto" ? item.toman : item.sell;

      const toman = Math.round(amount * rate);
      bot.sendMessage(chatId,
        `💱 معادل ${amount} ${userState[chatId].currency} برابر است با:\n\n💰 ${toman.toLocaleString()} تومان`
      );

      delete userState[chatId];
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "⛔ خطا در دریافت نرخ ارز. لطفاً بعداً امتحان کن.");
    }
  }
});
