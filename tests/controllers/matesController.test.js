const chat = require('../../src/middlewares/chatMiddleware');
const db = require('../../src/services/dbService');
const matesController = require('../../src/controllers/matesController');
const messages = require('../../src/configs/messages');

describe(`Mates controller`, () => {
  beforeEach(() => {
    chat.sendMessage = jest.fn();
    db.upsert = jest.fn();
  });

  describe(`/add_user route`, () => {
    test(`If no lists, default should be created; /add_user_typed route should be pushed`, async () => {
      const data = { user: { username: 'user' }, message: { text: 'mate' } };
      await matesController.add.pipe[2](data);
      expect(data.user.lists).toStrictEqual([{ name: 'default' }]);
      expect(data.user.state.route).toBe('/add_user_typed');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.addUserToDefault);
      expect(db.upsert).toHaveBeenCalledWith(data.user.username, data.user, 'users');
    });
    test(`If only one list, should fix it; /add_user_typed route should be pushed`, async () => {
      const data = {
        user: { username: 'user', lists: [{ name: 'default', mates: [] }] }, 
        message: { text: 'mate' },
      };
      await matesController.add.pipe[2](data);
      expect(data.user.state).toStrictEqual({ route: '/add_user_typed', listName: 'default' });
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.addUserToOneList('default'));
      expect(db.upsert).toHaveBeenCalledWith(data.user.username, data.user, 'users');
    });
    test(`If several lists, should prompt to choose`, async () => {
      const lists = [
        { name: 'default', mates: [] },
        { name: 'unique', mates: [] },
      ];
      const data = {
        user: { username: 'user', lists }, 
        message: { text: 'mate' },
      };
      await matesController.add.pipe[2](data);
      expect(data.user.state).toStrictEqual({ route: '/add_user_choose_list' });
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.addUserChooseList(lists));
      expect(db.upsert).toHaveBeenCalledWith(data.user.username, data.user, 'users');
    });
  });

  describe(`/add_user_choose_list route`, () => {
    test(`Should claim if typed list not found`, async () => {
      const data = { user: { username: 'user' }, message: { text: 'someNotExistingList' } };
      await matesController.addUserChooseList.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.listNameNotFound(data.message.text));
    });
    test(`Should set the list if typed correctly`, async () => {
      const data = {
        user: { username: 'user', lists: [{ name: 'default', mates: [] }] },
        message: { text: 'default' },
      };
      await matesController.addUserChooseList.pipe[2](data);
      expect(data.user.state).toStrictEqual({ route: '/add_user_typed', listName: 'default' });
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.addUserToList('default'));
    });
  });
 
  describe(`/add_user_typed route`, () => {
    test(`Should try search typed mate`, async () => {
      const data = { user: { username: 'user' }, message: { text: 'mate' } };
      db.get = jest.fn().mockReturnValue(Promise.resolve(undefined));
      await matesController.addUserTyped.pipe[2](data);
      expect(db.get).toBeCalledWith('username', 'mate', 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.mateNotFound('mate'));
    });
    test(`Should try search typed @mate`, async () => {
      const data = { user: { username: 'user' }, message: { text: '@mate' } };
      db.get = jest.fn().mockReturnValue(Promise.resolve(undefined));
      await matesController.addUserTyped.pipe[2](data);
      expect(db.get).toBeCalledWith('username', 'mate', 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.mateNotFound('mate'));
    });
    test(`Should claim if user has no lists`, async () => {
      const data = { message: { text: '@mate' }, user: { username: 'user', state: {} } };
      db.get = jest.fn().mockReturnValue(Promise.resolve({ username: 'mate' }));
      await matesController.addUserTyped.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.addUserToUndefinedList);
    });
    test(`Should claim if stated list is not in the lists of the user`, async () => {
      const data = {
        user: {
          username: 'user',
          lists: [],
          state: { route: '/add_user_typed', listName: 'notExistingList' },
        },
        message: { text: '@mate' },
      };
      db.get = jest.fn().mockReturnValue(Promise.resolve({ username: 'mate' }));
      await matesController.addUserTyped.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.addUserToUndefinedList);
    });
    test(`Should add user into defined list`, async () => {
      const list = { name: 'default', mates: [] };
      const data = {
        user: {
          username: 'user',
          lists: [ list ],
          state: { route: '/add_user_typed', listName: 'default' },
        },
        message: { text: '@mate' },
      };
      db.get = jest.fn().mockReturnValue(Promise.resolve({ username: 'mate', chat_id: '12123' }));
      await matesController.addUserTyped.pipe[2](data);
      expect(data.user.lists[0].mates).toStrictEqual([{ username: 'mate', chat_id: '12123' }]);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.added('mate', list));
    });
  });
});

