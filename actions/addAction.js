const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const chatId = data.message.chat.id;
  const { username } = data.message.from;
  const searchedMateUsername = data.message.text.split(' ')[1].replace(/^@/, '');
  const foundMate = await db.get('username', searchedMateUsername, 'users');
  if (!foundMate) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.mateNotFound(searchedMateUsername) });
    return;
  }
  const user = await db.get('username', username, 'users');
  if (!user) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.registerFirst(username)});
    return;
  }
  if (!user.list) {
    user.list = [];
  }
  user.list.push(foundMate);
  await db.upsert(username, user, 'users');
  await telegram.send('sendMessage', { chat_id: chatId, text: messages.added(foundMate.username) });
}