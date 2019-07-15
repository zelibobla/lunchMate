const db = require('../services/dbService.js');
const chat = require('../services/chatService.js');
const messages = require('../configs/messages.js');
const runAction = require('../actions/runAction.js');

module.exports = async (data) => {
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
  await runAction(data);
}