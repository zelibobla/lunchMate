const telegram = require('../services/telegramService.js');

module.exports = {
  defineChatId: (input) => {
    const output = JSON.parse(JSON.stringify(input));
    try {
      output.chatId = output.message.chat.id;
    } catch(error) {
      console.log(`Was unable to define chatId from ${JSON.stringify(output)}`);
    }
    return output;
  },
  sendMessage: async (chatId, text, reply_markup) => {
    if (!chatId) {
      throw `chatId is mandatory`;
    }
    const params = { chat_id: chatId, text };
    if (reply_markup) {
      params.reply_markup = reply_markup;
    }
    await telegram.send('sendMessage', params);
  },
}
