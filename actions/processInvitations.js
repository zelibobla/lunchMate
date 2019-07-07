const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async () => {
  const invitations = await db.getAll({ filterExpression: '', expressionAttributes: {} }, 'invitations');
  await Promise.all(invitations.map(async row => {
    const user = await db.get('username', row.username, 'users');
    const invitation = user.invitations.find(i => i.isActive);
    const mate = user.list.find(u => !u.is_asked);
    console.log('>>>', invitation, mate);
    await telegram.send('sendMessage', {
      chat_id: mate.chat_id,
      text: messages.invitePending(mate.username, user.username, invitation),
      reply_markup: { inline_keyboard: [
        [
          { text: 'yes', callback_data: '/accept' },
          { text: 'no', callback_data: '/decline' },
        ]
      ]}
    });
  }));
}