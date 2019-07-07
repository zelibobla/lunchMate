const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const chatId = data.message.chat.id;
  const { username } = data.message.from;
  const user = await db.get('username', username, 'users');
  if (!user) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.registerFirst(username)});
    return;
  }
  if (!user.list) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.emptyList(username)});
    return;
  }
  const invitation = await db.get('username', username, 'invitations');
  if (invitation) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.alreadyRunning });
    return;
  }
  await db.upsert(username, { username }, 'invitations');
  if (!user.invitations) {
    user.invitations = [];
  }
  user.invitations.push({
    isActive: true,
    list: 'default',
    eatPlace: 'Panini Restaurant',
    meetPlace: 'First floor',
    delay: 5,
    timeout: 1,
  });
  await db.upsert(username, user, 'users');
  await telegram.send('sendMessage', { chat_id: chatId, text: messages.run(username)});
}