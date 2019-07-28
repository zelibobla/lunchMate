const telegram = require('../services/telegramService.js');

module.exports = {
  defineChatId: (data) => {
    try {
      this.chatId = data.message.chat.id;
    } catch(error) {
      console.warn(`Was unable to define chatId from ${JSON.stringify(data)}`);
    }
    return data;
  },
  sendMessage: async (text, reply_markup) => {
    if (!this.chatId) {
      throw `chatId is not defined; use telegramService.setChatId(Number) first`;
    }
    const params = { chat_id: this.chatId, text };
    if (reply_markup) {
      params.reply_markup = reply_markup;
    }
    await telegram.send('sendMessage', params);
  },
}
