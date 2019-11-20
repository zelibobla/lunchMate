const chat = require('../../src/middlewares/chatMiddleware');
const db = require('../../src/services/dbService');
const usersController = require('../../src/controllers/usersController');
const messages = require('../../src/configs/messages');

describe(`Users controller`, () => {
  beforeEach(() => {
    chat.sendMessage = jest.fn();
    db.upsert = jest.fn();
    db.delete = jest.fn();
  });

  describe(`/start route`, () => {
    test(`Should create user and send message`, async () => {
      const input = {
        message: { from: { chatId: 1, username: 'user' } },
      };
      const output = await usersController.create.pipe[3](input);
      const inlineKeyboard = {"inline_keyboard": [[{"callback_data": "/create_list", "text": "Yes"}]]};
      expect(chat.sendMessage).toHaveBeenCalledWith(
        output.chatId,
        messages.start(output.message.from.username),
        inlineKeyboard,
      );
      expect(db.upsert).toHaveBeenCalledWith(output.message.from.username, output.message.from, 'users');
    });
  });

  describe(`/delete route`, () => {
    test(`Should delete user and send message`, async () => {
      const input = {
        message: { chat: { first_name: 'user' }, from: { chatId: 1, username: 'user' } },
      };
      const output = await usersController.delete.pipe[1](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(
        output.chatId,
        messages.delete(output.message.from.username),
      );
      expect(db.delete).toHaveBeenCalledWith(output.message.from.username, 'users');
    });
  });

});

