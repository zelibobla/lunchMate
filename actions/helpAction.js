const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');

module.exports = async () => await chat.sendMessage(messages.help);
