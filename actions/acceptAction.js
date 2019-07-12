const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const chatId = data.message.chat.id;
  const mateUsername = data.from.username;
  const foundMate = await db.get('username', mateUsername, 'users');
  if (!foundMate) {
    /** @TODO warn data inconsistency here */
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.mateNotFound(mateUsername) });
    return;
  }
  if (!data.query_params ||
    !data.query_params.username) {
      /** @TODO warn data inconsistency here */
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.mateNotFound(username) });
    return;
  }
  const user = await db.get('username', data.query_params.username, 'users');
  if (!user) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.mateNotFound(username)});
    return;
  }
  const invitation = user.invitations.find(i => i.is_active);
  if (!invitation) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.invitationNotFound });
    await db.delete(user.username, 'invitations');
    return;
  }
  const mate = invitation.list.find(m => m.username === foundMate.username);
  if (!mate || mate.is_declined) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.listNotFound(user.username) });
    return;
  }
  mate.is_accepted = true;
  invitation.is_active = false;
  await Promise.all([
    await db.upsert(user.username, user, 'users'),
    await telegram.send('sendMessage', {
      chat_id: chatId,
      text: messages.youAccepted(user.username, foundMate.username),
    }),
    await telegram.send('sendMessage', {
      chat_id: chatId,
      text: messages.yourInvitationAccepted(user.username, foundMate.username),
    }),
  ]);
}