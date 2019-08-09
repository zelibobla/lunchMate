const db = require('../services/dbService.js');
const chat = require('../middlewares/chatMiddleware.js');
const userMiddleware = require('../middlewares/userMiddleware.js');
const telegram = require('../services/telegramService.js');
const messages = require('../configs/messages.js');

const processInvitation = async function(row) {
  const user = await db.get('username', row.username, 'users');
  const invitation = user.invitations.find(i => i.is_active);
  if (!invitation) {
    /** @TODO warn data inconsistency here */
    return await db.delete(row.username, 'invitations');
  }
  const mate = invitation.list.mates.find(m => !m.is_accepted && !m.is_declined);
  if (!mate) {
    invitation.is_active = false;
    return await Promise.all([
      db.delete(row.username, 'invitations'),
      db.upsert(row.username, user, 'users'),
      telegram.send('sendMessage', {
        chat_id: user.chat_id,
        text: messages.listEnded(user.username),
      }),
    ]);
  }
  if (mate.asked_at) {
    const timeout = Math.floor((+(new Date()) - mate.asked_at) / 60000 );
    if (timeout < invitation.timeout) {
      return;
    } else {
      mate.is_declined = true;
      await db.upsert(row.username, user, 'users');
      return await processInvitation(row);
    }
  }
  await telegram.send('sendMessage', {
    chat_id: mate.chat_id,
    text: messages.invitePending(user.username, mate.username, invitation),
    reply_markup: { inline_keyboard: [
      [
        { text: 'yes', callback_data: `/accept?username=${user.username}` },
        { text: 'no', callback_data: `/decline?username=${user.username}` },
      ]
    ]}});
  mate.asked_at = +(new Date());
  await db.upsert(row.username, user, 'users');
}

module.exports = {
  accept: {
    route: '/accept',
    pipe: [
      chat.defineChatId,
      async (data) => {
        const mateUsername = data.from.username;
        const foundMate = await db.get('username', mateUsername, 'users');
        if (!foundMate) {
          /** @TODO warn data inconsistency here */
          return await chat.sendMessage(messages.mateNotFound(mateUsername));
        }
        if (!data.query_params ||
          !data.query_params.username) {
            /** @TODO warn data inconsistency here */
          return await chat.sendMessage(messages.invalidQueryParams(data.query_params));
        }
        const user = await db.get('username', data.query_params.username, 'users');
        if (!user) {
          return await chat.sendMessage(messages.mateNotFound(data.query_params.username));
        }
        const invitation = user.invitations.find(i => i.is_active);
        if (!invitation) {
          return await Promise.all([
            chat.sendMessage(messages.invitationNotFound),
            db.delete(user.username, 'invitations'),
          ]);
        }
        const mate = invitation.list.mates.find(m => m.username === foundMate.username);
        if (!mate || mate.is_declined) {
          return await chat.sendMessage(messages.listNotFound(user.username));
        }
        mate.is_accepted = true;
        invitation.is_active = false;
        await Promise.all([
          db.upsert(user.username, user, 'users'),
          chat.sendMessage(messages.youAccepted(user.username, foundMate.username)),
          telegram.send('sendMessage', {
            chat_id: user.chat_id,
            text: messages.yourInvitationAccepted(user.username, foundMate.username),
          }),
        ]);
      },
    ],
  },
  decline: {
    route: '/decline',
    pipe: [
      chat.defineChatId,
      async (data, redispatch) => {
        const mateUsername = data.from.username;
        const foundMate = await db.get('username', mateUsername, 'users');
        if (!foundMate) {
          /** @TODO warn data inconsistency here */
          return await chat.sendMessage(messages.mateNotFound(mateUsername));
        }
        if (!data.query_params ||
          !data.query_params.username) {
            /** @TODO warn data inconsistency here */
          return await chat.sendMessage(messages.mateNotFound(username));
        }
        const user = await db.get('username', data.query_params.username, 'users');
        if (!user) {
          return await chat.sendMessage(messages.mateNotFound(username));
        }
        const invitation = user.invitations.find(i => i.is_active);
        if (!invitation) {
          return await Promise.all([
            chat.sendMessage(messages.invitationNotFound),
            db.delete(user.username, 'invitations'),
          ]);
        }
        const mate = invitation.list.mates.find(m => m.username === foundMate.username);
        if (!mate || mate.is_accepted) {
          return await chat.sendMessage(messages.listNotFound(user.username));
        }
        mate.is_declined = true;
        await Promise.all([
          db.upsert(user.username, user, 'users'),
          chat.sendMessage(messages.youDeclined(user.username, foundMate.username)),
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
      chat.defineChatId,
      userMiddleware.defineUser,
      async (data, redispatch) => {
        if (!data.user) {
          return await chat.sendMessage(messages.registerFirst);
        }
        const { user } = data;
        const { username } = user;
        if (!user.lists || !user.lists.length) {
          return await chat.sendMessage(messages.emptyList(username));
        }
        const query = data.query_params;
        let listIndex;
        if (data.user.lists.length === 1) {
          listIndex = 0;
        } else if (query && query.list_index) {
          listIndex = user.lists[query.list_index] ? query.list_index : 0;
        } else {
          const listsOptions = user.lists.map((l, index) => ([{
            text: l.name,
            callback_data: `/run?list_index=${index}`,
          }]));
          return await chat.sendMessage(messages.chooseList, { inline_keyboard: listsOptions });
        }
        const activeInvitation = await db.get('username', username, 'invitations');
        if (activeInvitation) {
          return await chat.sendMessage(messages.alreadyRunning);
        }
        if (!user.templates || !user.templates.length) {
          return await Promise.all([
            chat.sendMessage(messages.noTemplates),
          ]);
        }
        let templateIndex;
        if (data.user.templates.length === 1){
          templateIndex = 0;
        } else if (query && query.template_index) {
          templateIndex = user.templates[query.template_index] ? query.template_index : 0;
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
          db.upsert(username, { username }, 'invitations'),
          db.upsert(username, user, 'users'),
        ]);
        console.log('>>>', invitation);
        await chat.sendMessage(messages.run(username, invitation));
        await redispatch('/process_invitations');
      }
    ],
  },
  stop: {
    route: '/stop',
    pipe: [
      chat.defineChatId,
      async (data) => {
        const { username } = data.message.from;
        const user = await db.get('username', username, 'users');
        if (!user) {
          return await chat.sendMessage(messages.nothingToStop);
        }
        const invitation = user.invitations.find(i => i.is_active);
        if (!invitation) {
          return Promise.all([
            chat.sendMessage(messages.nothingToStop),
            db.delete(user.username, 'invitations'),
          ]);
        }
        invitation.is_active = false;
        await Promise.all([
          db.delete(user.username, 'invitations'),
          db.upsert(user.username, user, 'users'),
          telegram.send('sendMessage', {
            chat_id: user.chat_id,
            text: messages.stopped,
          }),
        ]);
      }
    ]
  }
}