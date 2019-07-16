const db = require('../services/dbService.js');
const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');

module.exports = {
  create: {
    route: '/create_list',
    pipe: [
      chat.defineChatId,
      async () => await chat.sendMessage(messages.createList),
    ],
  },
  add: {
    route: '/add',
    pipe: [
      chat.defineChatId,
      async (data) => {
        const { username } = data.message.from;
        const searchedMateUsername = data.message.text.split(' ')[1].replace(/^@/, '');
        const foundMate = await db.get('username', searchedMateUsername, 'users');
        if (!foundMate) {
          return await chat.sendMessage(messages.mateNotFound(searchedMateUsername));
        }
        const user = await db.get('username', username, 'users');
        if (!user) {
          return await chat.sendMessage(messages.registerFirst(username));
        }
        if (!user.list) {
          user.list = [];
        }
        user.list.push(foundMate);
        await db.upsert(username, user, 'users');
        await chat.sendMessage(messages.added(foundMate.username));
      },
    ]
  },
  skip: {
    route: '/dont_create_list',
    pipe: [
      chat.defineChatId,
      async () => await chat.sendMessage(messages.dontCreateList),
    ],
  },
}