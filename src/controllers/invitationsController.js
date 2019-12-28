const db = require('../services/dbService.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

const processInvitation = async function(row) {
  const user = await db.get('id', row.id, 'users');
  const invitation = user.invitations.find(i => i.is_active);
  if (!invitation) {
    /** @TODO warn input inconsistency here */
    return await db.delete(row.id, 'invitations');
  }
  const mate = invitation.list.mates.find(m => !m.is_accepted && !m.is_declined);
  if (!mate) {
    invitation.is_active = false;
    return await Promise.all([
      db.delete(row.id, 'invitations'),
      db.upsert(row.id, user, 'users'),
      telegram.send('sendMessage', {
        chat_id: user.chat_id,
        text: messages.listEnded(user.first_name),
      }),
    ]);
  }
  if (mate.asked_at) {
    const timeout = Math.floor((+(new Date()) - mate.asked_at) / 60000 );
    if (timeout < invitation.timeout) {
      return;
    } else {
      mate.is_declined = true;
      await db.upsert(row.id, user, 'users');
      return await processInvitation(row);
    }
  }
  await telegram.send('sendMessage', {
    chat_id: mate.chat_id,
    text: messages.invitePending(`${user.first_name} ${user.last_name}`, mate.first_name, invitation),
    reply_markup: { inline_keyboard: [
      [
        { text: 'Yes', callback_data: `/accept?id=${user.id}` },
        { text: 'No', callback_data: `/decline?id=${user.id}` },
      ]
    ]}});
  mate.asked_at = +(new Date());
  await db.upsert(row.id, user, 'users');
}

module.exports = {
  accept: {
    route: '/accept',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.mateNotFound(input.from.first_name)),
      async input => await userMiddleware.defineUserFromQuery(input, messages.invalidQueryParams(input.query_params)),
      async input => {
        const output = JSON.parse(JSON.stringify(input));
        const foundMate = output.user;
        const user = output.queryUser;
        const invitation = user.invitations.find(i => i.is_active);
        if (!invitation) {
          await Promise.all([
            chatMiddleware.sendMessage(output.chatId, messages.invitationNotFound),
            db.delete(user.id, 'invitations'),
          ]);
          return output;
        }
        const mate = invitation.list.mates.find(m => m.id === foundMate.id);
        if (!mate || mate.is_declined) {
          await chatMiddleware.sendMessage(output.chatId, messages.listNotFound(user.first_name));
          return output;
        }
        mate.is_accepted = true;
        invitation.is_active = false;
        await Promise.all([
          db.upsert(user.id, user, 'users'),
          chatMiddleware.sendMessage(
            output.chatId,
            messages.youAccepted(`${user.first_name} ${user.last_name}`, foundMate.first_name),
          ),
          telegram.send('sendMessage', {
            chat_id: user.chat_id,
            text: messages.yourInvitationAccepted(
              user.first_name,
              `${foundMate.first_name} ${foundMate.last_name}`,
            ),
          }),
        ]);
        return output;
      },
    ],
  },
  decline: {
    route: '/decline',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.mateNotFound(input.from.first_name)),
      async input => await userMiddleware.defineUserFromQuery(input, messages.invalidQueryParams(input.query_params)),
      async (input, redispatch) => {
        const output = JSON.parse(JSON.stringify(input));
        const foundMate = output.user;
        const user = output.queryUser;
        const invitation = user.invitations.find(i => i.is_active);
        if (!invitation) {
          return await Promise.all([
            chatMiddleware.sendMessage(output.chatId, messages.invitationNotFound),
            db.delete(user.id, 'invitations'),
          ]);
        }
        const mate = invitation.list.mates.find(m => m.id === foundMate.id);
        if (!mate || mate.is_accepted) {
          return await chatMiddleware.sendMessage(output.chatId, messages.listNotFound(user.first_name));
        }
        mate.is_declined = true;
        await Promise.all([
          db.upsert(user.id, user, 'users'),
          chatMiddleware.sendMessage(input.chatId, messages.youDeclined(user.first_name, foundMate.first_name)),
        ]);
        await redispatch('/process_invitations');
      }
    ]
  },
  process: {
    route: '/process_invitations',
    pipe: [
      async () => {
        const invitations = await db.getAll({ filterExpression: '', expressionAttributes: {} }, 'invitations');
        await Promise.all(invitations.map(processInvitation));
      }
    ]
  },
  run: {
    route: '/run',
    pipe: [
      chatMiddleware.defineChatId,
      async input => await userMiddleware.defineUser(input, messages.registerFirst),
      async (input, redispatch) => {
        if (!input.user) {
          return await chatMiddleware.sendMessage(input.chatId, messages.registerFirst);
        }
        const { user } = input;
        const { first_name, id } = user;
        if (!user.lists || !user.lists.length) {
          return await chatMiddleware.sendMessage(input.chatId, messages.emptyList(first_name));
        }
        const query = input.query_params;
        let listIndex;
        if (input.user.lists.length === 1) {
          listIndex = 0;
        } else if (query && query.list_index) {
          listIndex = user.lists[query.list_index] ? query.list_index : 0;
        } else {
          const listsOptions = user.lists.map((l, index) => ([{
            text: l.name,
            callback_data: `/run?list_index=${index}`,
          }]));
          return await chatMiddleware.sendMessage(
            input.chatId,
            messages.chooseList,
            { inline_keyboard: listsOptions },
          );
        }
        const activeInvitation = await db.get('id', id, 'invitations');
        if (activeInvitation) {
          return await chatMiddleware.sendMessage(input.chatId, messages.alreadyRunning);
        }
        if (!user.templates || !user.templates.length) {
          return await chatMiddleware.sendMessage(
            input.chatId,
            messages.noTemplates,
            { inline_keyboard: [[{ text: 'Create template', callback_data: '/create_template' }]] }
          );
        }
        let templateIndex;
        if (input.user.templates.length === 1){
          templateIndex = 0;
        } else if (query && query.template_index) {
          templateIndex = user.templates[query.template_index] ? query.template_index : 0;
        } else {
          const templatesOptions = user.templates.map((t, index) => ([{
            text: messages.templateBrief(t),
            callback_data: `/run?template_index=${index}`,
          }]));
          return await chatMiddleware.sendMessage(
            input.chatId,
            messages.chooseTemplate,
            { inline_keyboard: templatesOptions },
          );
        }
        const template = user.templates[templateIndex];
        const list = user.lists[listIndex];
        if (!user.invitations) {
          user.invitations = [];
        }
        const invitation = {
          is_active: true,
          list,
          eat_place: template.eat_place,
          meet_place: template.meet_place,
          delay: template.delay,
          timeout: template.timeout,
        };
        user.invitations.push(invitation);
        await Promise.all([
          db.upsert(id, { id }, 'invitations'),
          db.upsert(id, user, 'users'),
        ]);
        await chatMiddleware.sendMessage(input.chatId, messages.run(first_name, invitation));
        await redispatch('/process_invitations');
      }
    ],
  },
  stop: {
    route: '/stop',
    pipe: [
      chatMiddleware.defineChatId,
      async input => {
        const { id } = input.message.from;
        const user = await db.get('id', id, 'users');
        if (!user) {
          return await chatMiddleware.sendMessage(input.chatId, messages.nothingToStop);
        }
        const invitation = user.invitations.find(i => i.is_active);
        if (!invitation) {
          return Promise.all([
            chatMiddleware.sendMessage(input.chatId, messages.nothingToStop),
            db.delete(user.id, 'invitations'),
          ]);
        }
        invitation.is_active = false;
        await Promise.all([
          db.delete(user.id, 'invitations'),
          db.upsert(user.id, user, 'users'),
          telegram.send('sendMessage', {
            chat_id: user.chat_id,
            text: messages.stopped,
          }),
        ]);
      }
    ]
  }
}