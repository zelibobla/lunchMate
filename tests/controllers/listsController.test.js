const chat = require('../../src/middlewares/chatMiddleware');
const db = require('../../src/services/dbService');
const listsController = require('../../src/controllers/listsController');
const messages = require('../../src/configs/messages');

describe(`Lists controller`, () => {
  beforeEach(() => {
    chat.sendMessage = jest.fn();
    db.upsert = jest.fn();
  });

  describe(`/create_list route`, () => {
    test(`Should trigger user into /create_list_typed route`, async () => {
      const input = {
        chatId: 1,
        user: {
          chat_id: '123123213',
          username: 'user',
        },
      };
      const output = await listsController.create.pipe[2](input);
      expect(output.user.state.route).toBe('/create_list_typed');
      const params = { inline_keyboard: [[
        { callback_data: "/list_name?list_name=default", text: "Skip" }
      ]]};
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.createList, params);
    });
  });

  describe(`/list_name route`, () => {
    test(`Should add the list with unique name and set the state to /add_user_typed`, async () => {
      const input = {
        chatId: 1,
        listName: 'unique',
        user: {
          chat_id: '123123213',
          username: 'user',
          lists: [{ name: 'default', mates: [] }]
        }
      };
      const output = await listsController.createTyped.pipe[4](input);
      expect(output.user.state).toStrictEqual({ listName: 'unique', route: '/add_user_typed' });
      expect(output.user.lists).toStrictEqual([{name: 'default', mates: []}, {name: 'unique', mates: []}]);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.listCreated('unique'));
      expect(db.upsert).toHaveBeenCalledWith(output.user.username, output.user, 'users');
    });
  });

  describe(`/delete_list route`, () => {
    test(`Should claim if only one list element left`, async () => {
      const input = {
        chatId: 1,
        user: {
          chat_id: '123123213',
          username: 'user',
          lists: [{ name: 'default', mates: [] }]
        }
      };
      await listsController.delete.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.oneListShouldStay);
    });
    test(`Should prompt user with lists to delete`, async () => {
      const input = {
        chatId: 1,
        user: {
          chat_id: '123123213',
          username: 'user',
          lists: [
            { name: 'default', mates: [] },
            { name: 'unique', mates: [] },
          ]
        }
      };
      await listsController.delete.pipe[3](input);
      const options = { inline_keyboard: [
        [{ callback_data: "/delete_list_typed?list_name=default", text: "default" }],
        [{ callback_data: "/delete_list_typed?list_name=unique", text: "unique" }],
      ]};
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.chooseListToDelete, options);
    });
  });

  describe(`/delete_list_typed route`, () => {
    test(`Should claim if only one list element left`, async () => {
      const input = {
        chatId: 1,
        user: {
          chat_id: '123123213',
          username: 'user',
          lists: [{ name: 'default', mates: [] }]
        },
        query_params: { list_name: 'unique' }
      };
      await listsController.deleteTyped.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.oneListShouldStay);
    });
    test(`Should delete typed list and reset the state`, async () => {
      const input = {
        chatId: 1,
        user: {
          chat_id: '123123213',
          username: 'user',
          lists: [
            { name: 'default', mates: [] },
            { name: 'unique', mates: [] },
          ]
        },
        query_params: { list_name: 'unique' }
      };
      const output = await listsController.deleteTyped.pipe[3](input);
      expect(output.user.state).toStrictEqual({});
      expect(output.user.lists).toStrictEqual([{ name: 'default', mates: [] }]);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.listDeleted('unique'));
    });
  });

  describe(`/show_lists route`, () => {
    test(`Should show lists`, async () => {
      const input = {
        chatId: 1,
        user: {
          chat_id: '123123213',
          username: 'user',
          lists: [{ name: 'qqq', mates: []}, { name: 'eee', mates: []}],
        }
      };
      const output = await listsController.show.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.showLists(output.user.lists));
    });
  });

});

