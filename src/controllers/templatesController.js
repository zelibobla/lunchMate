const db = require('../services/dbService.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const templateMiddleware = require('../middlewares/templateMiddleware.js');
const messages = require('../configs/messages.js');
const dispatch = require('../services/dispatchService.js');

module.exports = {
  create: {
    route: '/create_template',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        output.user.state = { route: '/template_name' };
        await Promise.all([
          chatMiddleware.sendMessage(
            output.chatId,
            messages.typeTemplateName,
            { inline_keyboard: [[{
              text: 'Skip',
              callback_data: `/template_name?template_name=default`,
            }]]
          }),
          db.upsert(output.user.username, output.user, 'users'),
        ]);
        return output;
      },
    ],
  },
  setName: {
    route: '/template_name',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      templateMiddleware.defineTemplateName,
      async input => await templateMiddleware.ifTemplateNameBusy(
        input,
        messages.templateNameBusy(input.templateName),
      ),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const template = { name: output.templateName }
        output.user.templates.push(template);
        output.user.state = { route: '/template_eat_place', templateName: template.name };
        await Promise.all([
          db.upsert(output.user.username, output.user, 'users'),
          chatMiddleware.sendMessage(
            output.chatId,
            messages.typeEatPlace,
            { inline_keyboard: [[{
              text: 'Skip',
              callback_data: `/template_eat_place?template_eat_place=our%20common%20place`,
            }]] },
          ),
        ]);
        return output;
      },
    ],
  },
  setEatPlace: {
    route: '/template_eat_place',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async input => await templateMiddleware.defineTemplateFromState(input, messages.templateNotFound),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const template = output.user.templates.find(t => t.name === output.template.name);
        template.eat_place = output.message.text;
        output.user.state = { route: '/template_meet_place', templateName: template.name };
        await Promise.all([
          db.upsert(output.user.username, output.user, 'users'),
          chatMiddleware.sendMessage(
            output.chatId,
            messages.typeMeetPlace,
            { inline_keyboard: [[{
              text: 'Skip',
              callback_data: `/template_meet_place?template_meet_place=as%20always`,
            }]] },
          ),
        ]);
        return output;
      },
    ],
  },
  setMeetPlace: {
    route: '/template_meet_place',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async input => await templateMiddleware.defineTemplateFromState(input, messages.templateNotFound),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const template = output.user.templates.find(t => t.name === output.template.name);
        template.meet_place = output.message.text;
        output.user.state = { route: '/template_delay', templateName: template.name };
        await Promise.all([
          db.upsert(output.user.username, output.user, 'users'),
          chatMiddleware.sendMessage(
            output.chatId,
            messages.typeDelay,
            { inline_keyboard: [[{
              text: 'Skip',
              callback_data: `/template_delay?template_delay=5`,
            }]] },
          ),
        ]);
        return output;
      },
    ],
  },
  setDelay: {
    route: '/template_delay',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async input => await templateMiddleware.defineTemplateFromState(input, messages.templateNotFound),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const template = output.user.templates.find(t => t.name === output.template.name);
        template.delay = output.message.text;
        output.user.state = { route: '/template_timeout' };
        await Promise.all([
          db.upsert(output.user.username, output.user, 'users'),
          chatMiddleware.sendMessage(
            output.chatId,
            messages.typeTimeout,
            { inline_keyboard: [[{
              text: 'Skip',
              callback_data: `/template_timeout?template_timeout=1`,
            }]] },
          ),
        ]);
        return output;
      },
    ],
  },
  setTimeout: {
    route: '/template_timeout',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async input => await templateMiddleware.defineTemplateFromState(input, messages.templateNotFound),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const template = output.user.templates.find(t => t.name === output.template.name);
        template.timeout = output.message.text;
        output.user.state = {};
        await Promise.all([
          db.upsert(output.user.username, output.user, 'users'),
          chatMiddleware.sendMessage(output.chatId, messages.templateCreated(template)),
        ]);
        return output;
      },
    ],
  },
  delete: {
    route: '/delete_template',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        if (!output.user) {
          return await chatMiddleware.sendMessage(output.chatId, messages.registerFirst);
        }
        if (!output.query_params ||
          !output.query_params.template_index ||
          !output.user.templates ||
          !output.user.templates[output.query_params.template_index]) {
          return await chatMiddleware.sendMessage(output.chatId, messages.templateNotFound);
        }
        const [ template ] = output.user.templates.splice(output.query_params.template_index, 1);
        await Promise.all([
          db.upsert(output.user.username, output.user, 'users'),
          chatMiddleware.sendMessage(output.chatId, messages.templateDeleted(template)),
        ]);
        delete output.query_params.template_index;
        await dispatch('/run', output);
      }
    ],
  },
  show: {
    route: '/show_templates',
    pipe: [
      chatMiddleware.defineChatId,
      userMiddleware.defineUser,
      async input => await templateMiddleware.ifNoTemplates(input, messages.noTemplates),
      async input => await chatMiddleware.sendMessage(input.chatId, messages.showTemplates(input.user.templates)),
    ],
  },
}