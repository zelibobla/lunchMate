const db = require('../services/dbService.js');
const chat = require('../middlewares/chatMiddleware.js');
const messages = require('../configs/messages.js');

module.exports = {
  create: {
    route: '/start',
    pipe: [
      chat.defineChatId,
      async (data) => {
        const { is_bot, first_name, username } = data.message.from;
        if (is_bot) {
          return await chat.sendMessage(messages.startFromBot(first_name));
        }
        if (!username) {
          return await chat.sendMessage(messages.usernameUndefined(first_name));
        }
        const user = data.message.from;
        user.chat_id = data.message.chat.id;
        await db.upsert(username, user, 'users');
        await chat.sendMessage(messages.start(username),
          { inline_keyboard: [
            [
              { text: 'yes', callback_data: '/create_list' },
              { text: 'no', callback_data: '/dont_create_list' },
            ]
          ]},
        );
      },
    ]
  },
  delete: {
    route: '/delete',
    pipe: [
      chat.defineChatId,
      async (data) => {
        const { username } = data.message.from;
        const name = data.message.chat.first_name;
        await db.delete(username, 'users');
        await chat.sendMessage(messages.delete(name));
      }
    ],
  }
}