const db = require('../services/dbService.js');
const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');
const processInvitationsAction = require('./processInvitationsAction.js');

module.exports = async (data) => {
  const mateUsername = data.from.username;
  const foundMate = await db.get('username', mateUsername, 'users');
  if (!foundMate) {
    /** @TODO warn data inconsistency here */
    return await chat.sendMessage(messages.mateNotFound(mateUsername));
  }
  if (!data.query_params ||
    !data.query_params.username) {
      /** @TODO warn data inconsistency here */
    return await chat.sendMessage(messages.mateNotFound(username));
  }
  const user = await db.get('username', data.query_params.username, 'users');
  if (!user) {
    return await chat.sendMessage(messages.mateNotFound(username));
  }
  const invitation = user.invitations.find(i => i.is_active);
  if (!invitation) {
    return await Promise.all([
      chat.sendMessage(messages.invitationNotFound),
      db.delete(user.username, 'invitations'),
    ]);
  }
  const mate = invitation.list.find(m => m.username === foundMate.username);
  if (!mate || mate.is_declined) {
    return await chat.sendMessage(messages.listNotFound(user.username));
  }
  mate.is_declined = true;
  await Promise.all([
    db.upsert(user.username, user, 'users'),
    chat.sendMessage(messages.youDeclined(user.username, foundMate.username)),
  ]);
  await processInvitationsAction();
}