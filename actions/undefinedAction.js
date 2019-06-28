const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const chatId = data.message.chat.id;
  try {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.undefined });
    return { statusCode: 200 };
  } catch(error) {
    console.log(error);
    return { statusCode: 500 };
  }
}