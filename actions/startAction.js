const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const chatId = data.message.chat.id;
  const { is_bot, first_name, username } = data.message.from;
  if (is_bot) {
    await telegram.send('sendMessage', {
      chat_id: chatId,
      text: messages.startFromBot(first_name),
    });
    return;
  }
  if (!username) {
    await telegram.send('sendMessage', {
      chat_id: chatId,
      text: messages.usernameUndefined(first_name),
    });
    return;
  }
  const user = data.message.from;
  user.chat_id = chatId;
  await db.upsert(username, user, 'users');
  await telegram.send('sendMessage', {
    chat_id: chatId,
    text: messages.start(username),
    reply_markup: { inline_keyboard: [
      [
        { text: 'yes', callback_data: '/create_list' },
        { text: 'no', callback_data: '/dont_create_list' },
      ]
    ]},
  });
}