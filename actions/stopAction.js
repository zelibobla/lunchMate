const db = require('../services/dbService.js');
const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const { username } = data.message.from;
  const user = await db.get('username', username, 'users');
  if (!user) {
    return await chat.sendMessage(messages.nothingToStop);
  }
  const invitation = user.invitations.find(i => i.is_active);
  if (!invitation) {
    return Promise.all([
      chat.sendMessage(messages.nothingToStop),
      db.delete(row.username, 'invitations'),
    ]);
  }
  invitation.is_active = false;
  await Promise.all([
    db.delete(user.username, 'invitations'),
    db.upsert(user.username, user, 'users'),
    chat.send('sendMessage', {
      chat_id: user.chat_id,
      text: messages.stopped,
    }),
  ]);
}