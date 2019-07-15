const db = require('../services/dbService.js');
const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');
const createTemplateAction = require('./createTemplateAction.js');
const processInvitationsAction = require('./processInvitationsAction.js');

module.exports = async (data) => {
  const { username } = data.from ? data.from : data.message.from;
  const user = await db.get('username', username, 'users');
  if (!user) {
    return await chat.sendMessage(messages.registerFirst(username));
  }
  if (!user.list) {
    return await chat.sendMessage(messages.emptyList(username));
  }
  const activeInvitation = await db.get('username', username, 'invitations');
  if (activeInvitation) {
    return await chat.sendMessage(messages.alreadyRunning);
  }
  if (!user.templates || !user.templates.length) {
    return await Promise.all([
      chat.sendMessage(messages.noTemplates),
      createTemplateAction(data),
    ]);
  }
  let templateIndex;
  if (user.templates.length === 1){
    templateIndex = 0;
  } else if (data.query_params && data.query_params.template_index) {
    templateIndex = user.templates[data.query_params.template_index] ? data.query_params.template_index : 0;
  } else {
    const templatesOptions = user.templates.map((t, index) => ([{
      text: messages.templateBrief(t),
      callback_data: `/run?template_index=${index}`,
    }, {
      text: 'x',
      callback_data: `/delete_template?template_index=${index}`
    }]));
    return await chat.sendMessage(messages.chooseTemplate, { inline_keyboard: templatesOptions });
  }
  const template = user.templates[templateIndex];
  if (!user.invitations) {
    user.invitations = [];
  }
  const invitation = {
    is_active: true,
    list: user.list,
    eat_place: template.eat_place,
    meet_place: template.meet_place,
    delay: template.delay,
    timeout: template.timeout,
  };
  user.invitations.push(invitation);
  await Promise.all([
    db.upsert(username, { username }, 'invitations'),
    db.upsert(username, user, 'users'),
  ]);
  await chat.sendMessage(messages.run(username, invitation));
  await processInvitationsAction();
}