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
        data.user.state = { route: '/create_list_typed' };
        await Promise.all([
          chatMiddleware.sendMessage(
            messages.createList,
            { inline_keyboard: [[{
                text: 'Skip',
                callback_data: `/create_list_typed?list_name=default`,
              }]]
            }
          ),
          db.upsert(data.user.username, data.user, 'users'),
        ]);
      }
    ],
  },
  createTyped: {
    route: '/create_list_typed',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        let name;
        if (data.query_params && data.query_params.list_name){
          name = data.query_params.list_name;
        } else {
          name = data.message.text;
        }
        if (!data.user.lists) {
          data.user.lists = [];
        }
        if (data.user.lists.find(l => l.name === name)) {
          return await chatMiddleware.sendMessage(messages.listNameBusy(name));
        }
        data.user.lists.push({ name, mates: [] });
        data.user.state = { route: '/add_user_typed', listName: name };
        await Promise.all([
          chatMiddleware.sendMessage(messages.listCreated(name)),
          db.upsert(data.user.username, data.user, 'users'),
        ]);
      }
    ],
  },
  delete: {
    route: '/delete_list',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        if (!data.user.lists || !data.user.lists.length) {
          return await chatMiddleware.sendMessage(messages.noListsToDelete);
        }
        if (data.user.lists.length === 1) {
          return await chatMiddleware.sendMessage(messages.oneListShouldStay);
        }
        const listsOptions = data.user.lists.map(l => ([{
          text: l.name,
          callback_data: `/delete_list_typed?list_name=${l.name.toLowerCase()}`
        }]));
        await Promise.all([
          chatMiddleware.sendMessage(
            messages.chooseListToDelete,
            { inline_keyboard: listsOptions },
          )
        ]);
      }
    ],
  },
  deleteTyped: {
    route: '/delete_list_typed',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        const name = data.query_params.list_name;
        if (!data.user.lists || !data.user.lists.length) {
          return await chatMiddleware.sendMessage(messages.noListsToDelete);
        }
        if (data.user.lists.length === 1) {
          return await chatMiddleware.sendMessage(messages.oneListShouldStay);
        }
        data.user.lists = data.user.lists.filter(l => l.name.toLowerCase() !== name);
        data.user.state = {};
        await Promise.all([
          chatMiddleware.sendMessage(messages.listDeleted(name)),
          db.upsert(data.user.username, data.user, 'users'),
        ]);
      }
    ],
  },
  show: {
    route: '/show_lists',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        if (!data.user.lists || !data.user.lists.length) {
          return await chatMiddleware.sendMessage(messages.noListsToShow);
        }
        await chatMiddleware.sendMessage(messages.showLists(data.user.lists));
      }
    ],
  },
}