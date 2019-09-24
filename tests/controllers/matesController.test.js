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
    test(`If list to add mates defined route should be pushed`, async () => {
      const input = {
        chatId: 1,
        user: { username: 'user', lists: [{ name: 'default', mates: [] }] }, 
        list: { name: 'default', mates: []},
      };
      const output = await matesController.add.pipe[4](input);
      expect(output.user.state).toStrictEqual({ route: '/add_user_typed', listName: 'default' });
      expect(chat.sendMessage).toHaveBeenCalledWith(output.chatId, messages.addUserToOneList('default'));
      expect(db.upsert).toHaveBeenCalledWith(output.user.username, output.user, 'users');
    });
    test(`If several lists, should prompt to choose`, async () => {
      const lists = [
        { name: 'default', mates: [] },
        { name: 'unique', mates: [] },
      ];
      const input = {
        chatId: 1,
        user: { username: 'user', lists }, 
        message: { text: 'mate' },
      };
      const output = await matesController.add.pipe[4](input);
      expect(output.user.state).toStrictEqual({ route: '/add_user_choose_list' });
      expect(chat.sendMessage).toHaveBeenCalledWith(output.chatId, messages.addUserChooseList(lists));
      expect(db.upsert).toHaveBeenCalledWith(output.user.username, output.user, 'users');
    });
  });

  describe(`/add_user_choose_list route`, () => {
    test(`Should set the list if typed correctly`, async () => {
      const input = {
        chatId: 1,
        user: { username: 'user', lists: [{ name: 'default', mates: [] }] },
        message: { text: 'default' },
        list: { name: 'default', mates: [] },
      };
      const output = await matesController.addUserChooseList.pipe[4](input);
      expect(output.user.state).toStrictEqual({ route: '/add_user_typed', listName: 'default' });
      expect(chat.sendMessage).toHaveBeenCalledWith(output.chatId, messages.addUserToList('default'));
    });
  });
 
  describe(`/add_user_typed route`, () => {
    test(`Should add user into defined list`, async () => {
      const list = { name: 'default', mates: [] };
      const mate = { username: 'mate', chat_id: 123123 };
      const input = {
        chatId: 1,
        user: {
          username: 'user',
          lists: [ list ],
          state: { route: '/add_user_typed', listName: 'default' },
        },
        mate,
        list,
      };
      const output = await matesController.addUserTyped.pipe[4](input);
      expect(output.user.lists[0].mates).toStrictEqual([mate]);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.added('mate', output.user.lists[0]));
    });
  });
});

