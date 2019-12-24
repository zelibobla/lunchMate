const db = require('../services/dbService.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const listMiddleware = require('../middlewares/listMiddleware.js');
const messages = require('../configs/messages.js');

module.exports = {
  add: {
    route: '/add_user',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      listMiddleware.normalizeUserLists,
      listMiddleware.defineListToAddMates,
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        if (output.list) {
          output.user.state = { route: '/add_user_typed', listName: output.list.name };
          await Promise.all([
            chatMiddleware.sendMessage(output.chatId, messages.addUserToOneList(output.list.name)),
            db.upsert(output.user.id, output.user, 'users'),
          ]);
          return output;
        }
        output.user.state = { route: '/add_user_choose_list' };
        await Promise.all([
          chatMiddleware.sendMessage(output.chatId, messages.addUserChooseList(output.user.lists)),
          db.upsert(output.user.id, output.user, 'users'),
        ]);
        return output;
      }
    ],
  },
  addUserChooseList: {
    route: '/add_user_choose_list',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      listMiddleware.normalizeUserLists,
      async input => await listMiddleware.findListByTerm(
        input,
        messages.listNameNotFound(input.message.text, input.user.lists),
      ),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        output.user.state = { route: '/add_user_typed', listName: output.list.name };
        await Promise.all([
          chatMiddleware.sendMessage(output.chatId, messages.addUserToList(output.list.name)),
          db.upsert(output.user.id, output.user, 'users'),
        ]);
        return output;
      }
    ],
  },
  addUserTyped: {
    route: '/add_user_typed',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async input => await userMiddleware.defineUserFromTyped(
        input,
        messages.mateNotFound(input.message.text),
      ),
      async input => await listMiddleware.defineListFromState(input, messages.addUserToUndefinedList),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const list = output.user.lists.find(l => l.name === output.list.name);
        if (!list.mates) {
          list.mates = [];
        }
        if (!list.mates.find(u => u.id === output.mate.id)) {
          list.mates.push({
            id: output.mate.id,
            chat_id: output.mate.chat_id,
            first_name: output.mate.first_name,
            last_name: output.mate.last_name,
            phone: output.mate.phone,
            username: output.mate.username,
          });
          await db.upsert(output.user.id, output.user, 'users');
        }
        await chatMiddleware.sendMessage(
          output.chatId,
          messages.added(output.mate.first_name, list),
          { inline_keyboard: [[{ text: 'Run', callback_data: '/run' }]] },
        );
        return output;
      },
    ]
  }
}