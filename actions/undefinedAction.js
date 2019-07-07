const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const chatId = data.message.chat.id;
  await telegram.send('sendMessage', { chat_id: chatId, text: messages.undefined });
}