const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const chatId = data.message.chat.id;
  const { username } = data.message.from;
  const user = await db.get('username', username, 'users');
  if (!user) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.nothingToStop });
    return;
  }
  const invitation = user.invitations.find(i => i.is_active);
  if (!invitation) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.nothingToStop });
    await db.delete(row.username, 'invitations');
    return;
  }
  invitation.is_active = false;
  await Promise.all([
    db.delete(user.username, 'invitations'),
    db.upsert(user.username, user, 'users'),
    telegram.send('sendMessage', {
      chat_id: user.chat_id,
      text: messages.stopped,
    }),
  ]);
}