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
    test(`Should ask user phone`, async () => {
      const input = {
        message: { from: { chatId: 1, first_name: 'user', id: 1 } },
      };
      const output = await usersController.create.pipe[2](input);
      const inlineKeyboard = {
        keyboard: [[{ text: 'Show phone', request_contact: true, callback_data: '/start' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      };
      expect(chat.sendMessage).toHaveBeenCalledWith(
        output.chatId,
        messages.askPhone(output.message.from.first_name),
        inlineKeyboard,
      );
    });
  });

  describe(`/delete route`, () => {
    test(`Should delete user and send message`, async () => {
      const input = {
        message: { chat: { first_name: 'user' }, from: { id: 1, chatId: 1, username: 'user' } },
      };
      const output = await usersController.delete.pipe[1](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(
        output.chatId,
        messages.delete(output.message.from.first_name),
      );
      expect(db.delete).toHaveBeenCalledWith(output.message.from.id, 'users');
    });
  });

});

