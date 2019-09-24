const db = require('../services/dbService.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const listMiddleware = require('../middlewares/listMiddleware.js');
const messages = require('../configs/messages.js');

module.exports = {
  create: {
    route: '/create_list',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        output.user.state = { route: '/create_list_typed' };
        await Promise.all([
          chatMiddleware.sendMessage(
            input.chatId,
            messages.createList,
            { inline_keyboard: [[{
                text: 'Skip',
                callback_data: `/list_name?list_name=default`,
              }]]
            }
          ),
          db.upsert(output.user.username, output.user, 'users'),
        ]);
        return output;
      }
    ],
  },
  createTyped: {
    route: '/list_name',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      listMiddleware.defineListName,
      async input => await listMiddleware.ifListNameBusy(input, messages.listNameBusy(input.listName)),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        output.user.lists.push({ name: output.listName, mates: [] });
        output.user.state = { route: '/add_user_typed', listName: output.listName };
        await Promise.all([
          chatMiddleware.sendMessage(input.chatId, messages.listCreated(output.listName)),
          db.upsert(output.user.username, output.user, 'users'),
        ]);
        return output;
      }
    ],
  },
  delete: {
    route: '/delete_list',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async input => await listMiddleware.ifNoList(input, messages.noListsToDelete),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        if (output.user.lists.length === 1) {
          return await chatMiddleware.sendMessage(input.chatId, messages.oneListShouldStay);
        }
        const listsOptions = output.user.lists.map(l => ([{
          text: l.name,
          callback_data: `/delete_list_typed?list_name=${l.name.toLowerCase()}`
        }]));
        await Promise.all([
          chatMiddleware.sendMessage(
            input.chatId,
            messages.chooseListToDelete,
            { inline_keyboard: listsOptions },
          )
        ]);
        return output;
      }
    ],
  },
  deleteTyped: {
    route: '/delete_list_typed',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async input => await listMiddleware.ifNoList(input, messages.noListsToDelete),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const name = output.query_params.list_name;
        if (output.user.lists.length === 1) {
          return await chatMiddleware.sendMessage(input.chatId, messages.oneListShouldStay);
        }
        output.user.lists = output.user.lists.filter(l => l.name.toLowerCase() !== name);
        output.user.state = {};
        await Promise.all([
          chatMiddleware.sendMessage(input.chatId, messages.listDeleted(name)),
          db.upsert(output.user.username, output.user, 'users'),
        ]);
        return output;
      }
    ],
  },
  show: {
    route: '/show_lists',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async input => await listMiddleware.ifNoList(input, messages.noListsToShow),
      async input => {
        await chatMiddleware.sendMessage(input.chatId, messages.showLists(input.user.lists));
        return input;
      }
    ],
  },
}