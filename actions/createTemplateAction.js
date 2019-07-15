const config = require('../configs/config.js');
const db = require('../services/dbService.js');
const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const username = data.message.from.username;
  const user = await db.get('username', username, 'users');
  if (!user) {
    return await chat.sendMessage(messages.registerFirst(username));
  }
  if (!data.query_params ||
    !data.query_params[0] ||
    !data.query_params[1]) {
    await chat.sendMessage(messages.invalidTemplate);
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
    chat.sendMessage(messages.templateCreated(template)),
  ]);
}