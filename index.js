const db = require('./db');
const telegram = require('./telegram');

exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const data = JSON.parse(event.body);
  const userId = data.message.chat.id;
  const name = data.message.chat.first_name;
  const chatId = data.message.chat.id;
  try {
    await db.upsert(userId, { first_name: name, chat_id: chatId }, 'users');
    await telegram.send('sendMessage', { chat_id: chatId, text: name });
    return { statusCode: 200 };
  } catch(error) {
    console.log(error);
    return { statusCode: 500 };
  }
};
