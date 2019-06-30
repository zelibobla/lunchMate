const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const userId = data.message.chat.id;
  const name = data.message.chat.first_name;
  const chatId = data.message.chat.id;
  try {
    await db.upsert(userId, { first_name: name, chat_id: chatId }, 'users');
    await telegram.send('sendMessage', {
      chat_id: chatId,
      text: messages.start(name),
      reply_markup: { inline_keyboard: [
        [
          { text: 'yes', callback_data: '/create_list' },
          { text: 'no', callback_data: '/dont_create_list' },
        ]
      ]},
    });
    return { statusCode: 200 };
  } catch(error) {
    console.log(error);
    return { statusCode: 500 };
  }
}