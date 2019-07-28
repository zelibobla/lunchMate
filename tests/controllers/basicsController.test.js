const chat = require('../../src/middlewares/chatMiddleware');
const basicsController = require('../../src/controllers/basicsController');
const messages = require('../../src/configs/messages');

describe(`Basics controller`, () => {
  chat.sendMessage = jest.fn();

  test(`For /undefined route returns text "${messages.undefined}"`, async () => {
    await basicsController.undefined.pipe[1]();
    expect(chat.sendMessage).toHaveBeenCalledWith(messages.undefined);
  });
  
  test(`For /help route returns text "${messages.help}"`, async () => {
    await basicsController.help.pipe[1]();
    expect(chat.sendMessage).toHaveBeenCalledWith(messages.help);
  });
});
