const config = require('../configs/config.js');
const db = require('../services/dbService.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const messages = require('../configs/messages.js');
const dispatch = require('../services/dispatchService.js');

module.exports = {
  create: {
    route: '/create_template',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        if (!data.user) {
          return await chatMiddleware.sendMessage(messages.registerFirst);
        }
        data.user.state = { route: '/add_eat_place' };
        await Promise.all([
          db.upsert(data.user.username, data.user, 'users'),
          chatMiddleware.sendMessage(messages.typeEatPlace),
        ]);
      },
    ],
  },
  addEatPlace: {
    route: '/add_eat_place',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        if (!data.user) {
          return await chatMiddleware.sendMessage(messages.registerFirst);
        }
        if (!data.user.templates) {
          data.user.templates = [];
        }
        let template = data.user.templates.find(t => t.is_creating);
        if (!template) {
          template = { is_creating: true };
          data.user.templates.push(template);
        }
        template.eat_place = data.message.text;
        data.user.state = { route: '/add_meet_place' };
        await Promise.all([
          db.upsert(data.user.username, data.user, 'users'),
          chatMiddleware.sendMessage(messages.typeMeetPlace),
        ]);
      },
    ],
  },
  addMeetPlace: {
    route: '/add_meet_place',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        if (!data.user) {
          return await chatMiddleware.sendMessage(messages.registerFirst);
        }
        if (!data.user.templates) {
          data.user.templates = [];
        }
        let template = data.user.templates.find(t => t.is_creating);
        if (!template) {
          template = { is_creating: true };
          data.user.templates.push(template);
        }
        template.meet_place = data.message.text;
        data.user.state = { route: '/add_delay' };
        await Promise.all([
          db.upsert(data.user.username, data.user, 'users'),
          chatMiddleware.sendMessage(messages.typeDelay),
        ]);
      },
    ],
  },
  addDelay: {
    route: '/add_delay',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        if (!data.user) {
          return await chatMiddleware.sendMessage(messages.registerFirst);
        }
        if (!data.user.templates) {
          data.user.templates = [];
        }
        let template = data.user.templates.find(t => t.is_creating);
        if (!template) {
          template = { is_creating: true };
          data.user.templates.push(template);
        }
        template.delay = data.message.text;
        data.user.state = { route: '/add_timeout' };
        await Promise.all([
          db.upsert(data.user.username, data.user, 'users'),
          chatMiddleware.sendMessage(messages.typeTimeout),
        ]);
      },
    ],
  },
  addTimeout: {
    route: '/add_timeout',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async (data) => {
        if (!data.user) {
          return await chatMiddleware.sendMessage(messages.registerFirst);
        }
        if (!data.user.templates) {
          data.user.templates = [];
        }
        let template = data.user.templates.find(t => t.is_creating);
        if (!template) {
          template = { is_creating: true };
          data.user.templates.push(template);
        }
        template.timeout = data.message.text;
        data.user.state = {};
        await Promise.all([
          db.upsert(data.user.username, data.user, 'users'),
          chatMiddleware.sendMessage(messages.templateCreated(template)),
        ]);
      },
    ],
  },
  delete: {
    route: '/delete_template',
    pipe: [
      chatMiddleware.defineChatId,
      async (data) => {
        const { username } = data.from ? data.from : data.message.from;
        const user = await db.get('username', username, 'users');
        if (!user) {
          return await chatMiddleware.sendMessage(messages.registerFirst);
        }
        if (!data.query_params ||
          !data.query_params.template_index ||
          !user.templates ||
          !user.templates[data.query_params.template_index]) {
          return await chatMiddleware.sendMessage(messages.templateNotFound);
        }
        const [ template ] = user.templates.splice(data.query_params.template_index, 1);
        await Promise.all([
          db.upsert(username, user, 'users'),
          chatMiddleware.sendMessage(messages.templateDeleted(template)),
        ]);
        delete data.query_params.template_index;
        await dispatch('/run', data);
      }
    ],
  },
}