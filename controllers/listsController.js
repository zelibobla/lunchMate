const db = require('../services/dbService.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const messages = require('../configs/messages.js');

module.exports = {
  create: {
    route: '/create_list',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        data.user.state = { route: '/add_user' };
        await Promise.all([
          chatMiddleware.sendMessage(messages.createList),
          db.upsert(data.user.username, data.user, 'users'),
        ]);
      }
    ],
  },
  add: {
    route: '/add_user',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        const searchedMateUsername = data.message.text.replace(/^@/, '');
        const foundMate = await db.get('username', searchedMateUsername, 'users');
        if (!foundMate) {
          return await chatMiddleware.sendMessage(messages.mateNotFound(searchedMateUsername));
        }
        if (!data.user) {
          return await chatMiddleware.sendMessage(messages.registerFirst);
        }
        if (!data.user.list) {
          data.user.list = [];
        }
        if (!data.user.list.find(u => u.username === foundMate.username)) {
          data.user.list.push(foundMate);
          await db.upsert(data.user.username, data.user, 'users');
        }
        await chatMiddleware.sendMessage(messages.added(foundMate.username, data.user.list));
      },
    ]
  },
  skip: {
    route: '/dont_create_list',
    pipe: [
      chatMiddleware.defineChatId,
      async () => await chatMiddleware.sendMessage(messages.dontCreateList),
    ],
  },
}