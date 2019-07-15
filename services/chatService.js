const telegram = require('./telegramService.js');

module.exports = {
  setId(newChatId) {
    this.chatId = newChatId;
  },
  async sendMessage(text, reply_markup) {
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
