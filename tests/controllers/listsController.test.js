const chat = require('../../src/middlewares/chatMiddleware');
const db = require('../../src/services/dbService');
const listsController = require('../../src/controllers/listsController');
const messages = require('../../src/configs/messages');

describe(`Invitations controller`, () => {
  beforeEach(() => {
    chat.sendMessage = jest.fn();
    db.upsert = jest.fn();
  });

  describe(`/create_list route`, () => {
    test(`Should trigger user into /add_user route`, async () => {
      const data = { user: {
        chat_id: '123123213',
        username: 'user',
      } };
      await listsController.create.pipe[2](data);
      expect(data.user.state.route).toBe('/add_user');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.createList);
    });
  });

  describe(`/add_user route`, () => {
    test(`Should try search typed mate`, async () => {
      const data = { user: { username: 'user' }, message: { text: 'mate' } };
      db.get = jest.fn().mockReturnValue(Promise.resolve(undefined));
      await listsController.add.pipe[2](data);
      expect(db.get).toBeCalledWith('username', 'mate', 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.mateNotFound('mate'));
    });
    test(`Should try search typed @mate`, async () => {
      const data = { user: { username: 'user' }, message: { text: '@mate' } };
      db.get = jest.fn().mockReturnValue(Promise.resolve(undefined));
      await listsController.add.pipe[2](data);
      expect(db.get).toBeCalledWith('username', 'mate', 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.mateNotFound('mate'));
    });
    test(`Should claim if user is not registered`, async () => {
      const data = { message: { text: '@mate' } };
      db.get = jest.fn().mockReturnValue(Promise.resolve({ username: 'mate' }));
      await listsController.add.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.registerFirst);
    });
    test(`Should add user into list if it's not there`, async () => {
      const data = { user: { username: 'user' }, message: { text: '@mate' } };
      db.get = jest.fn().mockReturnValue(Promise.resolve({ username: 'mate' }));
      await listsController.add.pipe[2](data);
      expect(data.user.list[0].username).toBe('mate');
      expect(db.upsert).toBeCalledWith('user', data.user, 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.added('mate', data.user.list));
    });
    test(`Should report user added even if it's already there`, async () => {
      const data = { user: { username: 'user', list: [{ username: 'mate' }] }, message: { text: '@mate' } };
      db.get = jest.fn().mockReturnValue(Promise.resolve({ username: 'mate' }));
      await listsController.add.pipe[2](data);
      expect(data.user.list[0].username).toBe('mate');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.added('mate', data.user.list));
    });
  });

  describe(`/dont_create_list route`, () => {
    test(`Should just report that always welcome to create`, async () => {
      await listsController.skip.pipe[1]();
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.dontCreateList);
    });
  });
});

