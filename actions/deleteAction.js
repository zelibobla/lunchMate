const db = require('../services/dbService.js');
const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');

module.exports = async (data) => {
  const { username } = data.message.from;
  const name = data.message.chat.first_name;
  await db.delete(username, 'users');
  await chat.sendMessage(messages.delete(name));
  return { statusCode: 200 };
}