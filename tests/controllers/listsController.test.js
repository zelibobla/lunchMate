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
      const data = { user: {
        chat_id: '123123213',
        username: 'user',
      } };
      await listsController.create.pipe[2](data);
      expect(data.user.state.route).toBe('/create_list_typed');
      const params = { inline_keyboard: [[
        { callback_data: "/create_list_typed?list_name=default", text: "Skip" }
      ]]};
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.createList, params);
    });
  });

  describe(`/create_list_typed route`, () => {
    test(`Should claim if typed name is already exists in the lists`, async () => {
      const data = {
        message: { text: 'unique' },
        user: {
          chat_id: '123123213',
          username: 'user',
          lists: [{ name: 'unique', mates: [] }]
        }
      };
      await listsController.createTyped.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.listNameBusy('unique'));
    });
    test(`Should add the list with unique name and set the state to /add_user_typed`, async () => {
      const data = {
        message: { text: 'unique' },
        user: {
          chat_id: '123123213',
          username: 'user',
          lists: [{ name: 'default', mates: [] }]
        }
      };
      await listsController.createTyped.pipe[2](data);
      expect(data.user.state).toStrictEqual({ listName: 'unique', route: '/add_user_typed' });
      expect(data.user.lists).toStrictEqual([{name: 'default', mates: []}, {name: 'unique', mates: []}]);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.listCreated('unique'));
      expect(db.upsert).toHaveBeenCalledWith(data.user.username, data.user, 'users');
    });
  });

  describe(`/delete_list route`, () => {
    test(`Should claim if no lists yet`, async () => {
      const data = { user: {
        chat_id: '123123213',
        username: 'user'
      } };
      await listsController.delete.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.noListsToDelete);
    });
    test(`Should claim if only one list element left`, async () => {
      const data = { user: {
        chat_id: '123123213',
        username: 'user',
        lists: [{ name: 'default', mates: [] }]
      } };
      await listsController.delete.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.oneListShouldStay);
    });
    test(`Should prompt user with lists to delete`, async () => {
      const data = { user: {
        chat_id: '123123213',
        username: 'user',
        lists: [
          { name: 'default', mates: [] },
          { name: 'unique', mates: [] },
        ]
      } };
      await listsController.delete.pipe[2](data);
      const options = { inline_keyboard: [
        [{ callback_data: "/delete_list_typed?list_name=default", text: "default" }],
        [{ callback_data: "/delete_list_typed?list_name=unique", text: "unique" }
      ]]};
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.chooseListToDelete, options);
    });
  });

  describe(`/delete_list_typed route`, () => {
    test(`Should claim if no lists yet`, async () => {
      const data = {
        user: {
          chat_id: '123123213',
          username: 'user'
        },
        query_params: { list_name: 'unique' }
      };
      await listsController.deleteTyped.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.noListsToDelete);
    });
    test(`Should claim if only one list element left`, async () => {
      const data = {
        user: {
          chat_id: '123123213',
          username: 'user',
          lists: [{ name: 'default', mates: [] }]
        },
        query_params: { list_name: 'unique' }
      };
      await listsController.deleteTyped.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.oneListShouldStay);
    });
    test(`Should delete typed list and reset the state`, async () => {
      const data = {
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
      await listsController.deleteTyped.pipe[2](data);
      expect(data.user.state).toStrictEqual({});
      expect(data.user.lists).toStrictEqual([{ name: 'default', mates: [] }]);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.listDeleted('unique'));
    });
  });

});

