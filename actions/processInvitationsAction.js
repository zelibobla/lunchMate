const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

const processInvitation = async function(row) {
  const user = await db.get('username', row.username, 'users');
  const invitation = user.invitations.find(i => i.is_active);
  if (!invitation) {
    /** @TODO warn data inconsistency here */
    await db.delete(row.username, 'invitations');
    return;
  }
  const mate = invitation.list.find(m => !m.is_accepted && !m.is_declined);
  if (!mate) {
    invitation.is_active = false;
    await Promise.all([
      db.delete(row.username, 'invitations'),
      db.upsert(row.username, user, 'users'),
      telegram.send('sendMessage', {
        chat_id: user.chat_id,
        text: messages.listEnded(user.username),
      }),
    ]);
    return;
  }
  if (mate.asked_at) {
    const mSecInMinute = 60000;
    const timeout = Math.floor((+(new Date()) - mate.asked_at) / mSecInMinute);
    if (timeout < invitation.timeout) {
      return;
    } else {
      mate.is_declined = true;
      await db.upsert(row.username, user, 'users');
      await processInvitation(row);
      return;
    }
  }
  await telegram.send('sendMessage', {
    chat_id: mate.chat_id,
    text: messages.invitePending(mate.username, user.username, invitation),
    reply_markup: { inline_keyboard: [
      [
        { text: 'yes', callback_data: `/accept?username=${user.username}` },
        { text: 'no', callback_data: `/decline?username=${user.username}` },
      ]
    ]}
  });
  mate.asked_at = +(new Date());
  await db.upsert(row.username, user, 'users');
}

module.exports = async () => {
  const invitations = await db.getAll({ filterExpression: '', expressionAttributes: {} }, 'invitations');
  await Promise.all(invitations.map(processInvitation));
}