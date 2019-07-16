const config = require('../configs/config.js');
const db = require('../services/dbService.js');
const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');
const dispatch = require('../services/dispatchService.js');

module.exports = {
  create: {
    route: '/create_template',
    pipe: [
      chat.defineChatId,
      async (data) => {
        const username = data.message.from.username;
        const user = await db.get('username', username, 'users');
        if (!user) {
          return await chat.sendMessage(messages.registerFirst(username));
        }
        if (!data.query_params ||
          !data.query_params[0] ||
          !data.query_params[1]) {
          await chat.sendMessage(messages.invalidTemplate);
          return;
        }
        if (!user.templates) {
          user.templates = [];
        }
        let [ meet_place, eat_place, delay, timeout ] = data.query_params;
        const template = {
          meet_place,
          eat_place,
          delay: delay || config.defaults.delay,
          timeout: timeout || config.defaults.timeout,
        };
        user.templates.push(template);
        await Promise.all([
          db.upsert(username, user, 'users'),
          chat.sendMessage(messages.templateCreated(template)),
        ]);
      },
    ],
  },
  delete: {
    route: '/delete_template',
    pipe: [
      chat.defineChatId,
      async (data) => {
        const { username } = data.from ? data.from : data.message.from;
        const user = await db.get('username', username, 'users');
        if (!user) {
          return await chat.sendMessage(messages.registerFirst(username));
        }
        if (!data.query_params ||
          !data.query_params.template_index ||
          !user.templates ||
          !user.templates[data.query_params.template_index]) {
          return await chat.sendMessage(messages.templateNotFound);
        }
        const [ template ] = user.templates.splice(data.query_params.template_index, 1);
        await Promise.all([
          db.upsert(username, user, 'users'),
          chat.sendMessage(messages.templateDeleted(template)),
        ]);
        delete data.query_params.template_index;
        await dispatch('/run', data);
      }
    ],
  },
}