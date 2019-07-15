const config = require('../configs/config.js');
const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const chatId = data.message.chat.id;
  const username = data.message.from.username;
  const user = await db.get('username', username, 'users');
  if (!user) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.registerFirst(username)});
    return;
  }
  if (!data.query_params ||
    !data.query_params[0] ||
    !data.query_params[1]) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.invalidTemplate });
    return;
  }
  if (!user.templates) {
    user.templates = [];
  }
  let [ meet_place, eat_place, delay, timeout ] = data.query_params;
  const template = {
    meet_place,
    eat_place,
    delay: delay || config.defaults.delay,
    timeout: timeout || config.defaults.timeout,
  };
  user.templates.push(template);
  await Promise.all([
    db.upsert(username, user, 'users'),
    telegram.send('sendMessage', {
      chat_id: chatId,
      text: messages.templateCreated(template),
    }),
  ]);
}