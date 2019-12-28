const db = require('../services/dbService.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const messages = require('../configs/messages.js');

module.exports = {
  create: {
    route: '/start',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.ifBot(input, messages.startFromBot),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const user = output.message.from;
        user.phone = output.message.contact ? output.message.contact.phone_number : undefined;
        user.chat_id = output.chatId;
        const existing = await db.get('id', user.id, 'users');
        if (existing) {
          await chatMiddleware.sendMessage(
            input.chatId,
            messages.startExisting(user.first_name)
          );
          return output;  
        }
        if (!user.phone) {
          await chatMiddleware.sendMessage(
            input.chatId,
            messages.askPhone(user.first_name),
            {
              keyboard: [[{ text: 'Show phone', request_contact: true, callback_data: '/start' }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          );
          return output;
        }
        await db.upsert(user.id, user, 'users', /** force = */ false);
        await chatMiddleware.sendMessage(
          input.chatId,
          messages.start(user.first_name),
          { inline_keyboard: [[{ text: 'Yes', callback_data: '/create_list' }]] },
        );
        return output;
      },
    ]
  },
  delete: {
    route: '/delete',
    pipe: [
      chatMiddleware.defineChatId,
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const { id, first_name } = output.message.from;
        await db.delete(id, 'users');
        await chatMiddleware.sendMessage(output.chatId, messages.delete(first_name));
        return output;
      }
    ],
  }
}