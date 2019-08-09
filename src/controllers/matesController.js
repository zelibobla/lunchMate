const db = require('../services/dbService.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const messages = require('../configs/messages.js');

module.exports = {
  add: {
    route: '/add_user',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        if (!data.user.lists) {
          data.user.lists = [{ name: 'default' }];
          data.user.state = { route: '/add_user_typed' };
          await Promise.all([
            chatMiddleware.sendMessage(messages.addUserToDefault),
            db.upsert(data.user.username, data.user, 'users'),
          ]);
        } else if (data.user.lists.length === 1) {
          const list = data.user.lists[0];
          data.user.state = { route: '/add_user_typed', listName: list.name };
          await Promise.all([
            chatMiddleware.sendMessage(messages.addUserToOneList(list.name)),
            db.upsert(data.user.username, data.user, 'users'),
          ]);
        } else {
          data.user.state = { route: '/add_user_choose_list' };
          await Promise.all([
            chatMiddleware.sendMessage(messages.addUserChooseList(data.user.lists)),
            db.upsert(data.user.username, data.user, 'users'),
          ]);
        }
      }
    ],
  },
  addUserChooseList: {
    route: '/add_user_choose_list',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        const name = data.message.text;
        if (!data.user.lists) {
          data.user.lists = [];
        }
        const list = data.user.lists.find(l => l.name.toLowerCase() === name.toLowerCase());
        if (!list) {
          return await chatMiddleware.sendMessage(messages.listNameNotFound(name, data.user.lists));
        }
        data.user.state = { route: '/add_user_typed', listName: list.name };
          await Promise.all([
            chatMiddleware.sendMessage(messages.addUserToList(list.name)),
            db.upsert(data.user.username, data.user, 'users'),
          ]);
      }
    ],
  },
  addUserTyped: {
    route: '/add_user_typed',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        const searchedMateUsername = data.message.text.replace(/^@/, '').toLowerCase();
        const foundMate = await db.get('username', searchedMateUsername, 'users');
        if (!foundMate) {
          return await chatMiddleware.sendMessage(messages.mateNotFound(searchedMateUsername));
        }
        if (!data.user.state.listName) {
          return await chatMiddleware.sendMessage(messages.addUserToUndefinedList);
        }
        const { listName } = data.user.state;
        if (!listName) {
          return await chatMiddleware.sendMessage(messages.addUserToUndefinedList);
        }
        const list = data.user.lists.find(l => l.name === listName);
        if (!list) {
          return await chatMiddleware.sendMessage(messages.addUserToUndefinedList);
        }
        if (!list.mates) {
          list.mates = [];
        }
        if (!list.mates.find(u => u.username === foundMate.username)) {
          list.mates.push({ username: foundMate.username, chat_id: foundMate.chat_id });
          await db.upsert(data.user.username, data.user, 'users');
        }
        await chatMiddleware.sendMessage(messages.added(foundMate.username, list));
      },
    ]
  }
}