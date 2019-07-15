const db = require('../services/dbService.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');
const createTemplateAction = require('./createTemplateAction.js');
const processInvitationsAction = require('./processInvitationsAction.js');

module.exports = async (data) => {
  console.log('>>>', data);
  const chatId = data.message.chat.id;
  const { username } = data.from ? data.from : data.message.from;
  const user = await db.get('username', username, 'users');
  if (!user) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.registerFirst(username)});
    return;
  }
  if (!user.list) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.emptyList(username)});
    return;
  }
  const activeInvitation = await db.get('username', username, 'invitations');
  if (activeInvitation) {
    await telegram.send('sendMessage', { chat_id: chatId, text: messages.alreadyRunning });
    return;
  }
  if (!user.templates || !user.templates.length) {
    await Promise.all([
      telegram.send('sendMessage', { chat_id: chatId, text: messages.noTemplates }),
      createTemplateAction(data),
    ]);
    return;
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
    }]));
    await telegram.send('sendMessage', {
      chat_id: chatId,
      text: messages.chooseTemplate,
      reply_markup: { inline_keyboard: templatesOptions }
    });
    return;
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
  await telegram.send('sendMessage', { chat_id: chatId, text: messages.run(username, invitation)});
  await processInvitationsAction();
}