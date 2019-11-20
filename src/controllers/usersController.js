const db = require('../services/dbService.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const messages = require('../configs/messages.js');

module.exports = {
  create: {
    route: '/start',
    pipe: [
      chatMiddleware.defineChatId,
      (input) => userMiddleware.ifBot(input, messages.startFromBot),
      (input) => userMiddleware.ifNoUsername(
        input,
        messages.usernameUndefined(input.message.from.first_name),
      ),
      async (input) => {
        const output = JSON.parse(JSON.stringify(input));
        const user = output.message.from;
        user.chat_id = output.chatId;
        await db.upsert(user.username, user, 'users');
        await chatMiddleware.sendMessage(
          input.chatId,
          messages.start(user.username),
          { inline_keyboard: [[{ text: 'Yes', callback_data: '/create_list' }]] },
        );
        return output;
      },
    ]
  },
  delete: {
    route: '/delete',
    pipe: [
      chatMiddleware.defineChatId,
      async (input) => {
        const output = JSON.parse(JSON.stringify(input));
        const { username } = output.message.from;
        const name = output.message.chat.first_name;
        await db.delete(username, 'users');
        await chatMiddleware.sendMessage(input.chatId, messages.delete(name));
        return output;
      }
    ],
  }
}