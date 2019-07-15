const db = require('../services/dbService.js');
const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');

const processInvitation = async function(row) {
  const user = await db.get('username', row.username, 'users');
  const invitation = user.invitations.find(i => i.is_active);
  if (!invitation) {
    /** @TODO warn data inconsistency here */
    return await db.delete(row.username, 'invitations');
  }
  const mate = invitation.list.find(m => !m.is_accepted && !m.is_declined);
  if (!mate) {
    invitation.is_active = false;
    return await Promise.all([
      db.delete(row.username, 'invitations'),
      db.upsert(row.username, user, 'users'),
      chat.sendMessage(messages.listEnded(user.username)),
    ]);
  }
  if (mate.asked_at) {
    const mSecInMinute = 60000;
    const timeout = Math.floor((+(new Date()) - mate.asked_at) / mSecInMinute);
    if (timeout < invitation.timeout) {
      return;
    } else {
      mate.is_declined = true;
      await db.upsert(row.username, user, 'users');
      return await processInvitation(row);
    }
  }
  await chat.sendMessage(messages.invitePending(mate.username, user.username, invitation),
    { inline_keyboard: [
      [
        { text: 'yes', callback_data: `/accept?username=${user.username}` },
        { text: 'no', callback_data: `/decline?username=${user.username}` },
      ]
    ]});
  mate.asked_at = +(new Date());
  await db.upsert(row.username, user, 'users');
}

module.exports = async () => {
  const invitations = await db.getAll({ filterExpression: '', expressionAttributes: {} }, 'invitations');
  await Promise.all(invitations.map(processInvitation));
}