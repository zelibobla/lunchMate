const chatMiddleware = require('../middlewares/chatMiddleware.js');
const messages = require('../configs/messages.js');

module.exports = {
  undefined: {
    route: '/undefined',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await chatMiddleware.sendMessage(input.chatId, messages.undefined),
    ]
  },
  help: {
    route: '/help',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await chatMiddleware.sendMessage(input.chatId, messages.help),
    ]
  },
}
