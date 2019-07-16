const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');

module.exports = {
  undefined: {
    route: '/undefined',
    pipe: [
      chat.defineChatId,
      async () => await chat.sendMessage(messages.undefined),
    ]
  },
  help: {
    route: '/help',
    pipe: [
      chat.defineChatId,
      async () => await chat.sendMessage(messages.help),
    ]
  },
}
