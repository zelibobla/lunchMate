const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const userId = data.message.chat.id;
  const name = data.message.chat.first_name;
  const chatId = data.message.chat.id;
  try {
    await db.upsert(userId, { first_name: name, chat_id: chatId }, 'users');
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.start(name) });
    return { statusCode: 200 };
  } catch(error) {
    console.log(error);
    return { statusCode: 500 };
  }
}