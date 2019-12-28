const chat = require('../../src/middlewares/chatMiddleware');
const db = require('../../src/services/dbService');
const invitationsController = require('../../src/controllers/invitationsController');
const messages = require('../../src/configs/messages');
const telegram = require('../../src/services/telegramService');

describe(`Invitations controller`, () => {
  beforeEach(() => {
    chat.sendMessage = jest.fn();
    db.delete = jest.fn();
    telegram.send = jest.fn();
    db.upsert = jest.fn();
  });

  describe(`/accept route`, () => {
    test(`Should claim if found user has no invitations`, async () => {
      const input = {
        chatId: 1,
        user: { id: 1, username: 'mate' },
        queryUser: { id: 2, username: 'user', invitations: [] },
      };
      const output = await invitationsController.accept.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(output.chatId, messages.invitationNotFound);
      expect(db.delete).toHaveBeenCalledWith(output.queryUser.id, 'invitations');
    });
    test(`Should claim if mate is absent in the invitation list`, async () => {
      const input = {
        chatId: 1,
        user: { id: 1, first_name: 'mate' },
        queryUser: {
          id: 2,
          first_name: 'user',
          invitations: [{ is_active: true, list: { name: 'default', mates: [] } }],
        },
      };
      const output = await invitationsController.accept.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(output.chatId, messages.listNotFound(output.queryUser.first_name));
    });
    test(`Should claim if mate has already declined the invitation`, async () => {
      const input = {
        chatId: 1,
        user: { id: 1, first_name: 'mate' },
        queryUser: {
          id: 2,
          first_name: 'user',
          invitations: [{
            is_active: true,
            list: {
              name: 'default',
              mates: [{ id: 1, first_name: 'mate', is_declined: true }]
            }
          }]
        }
      };
      const output = await invitationsController.accept.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(output.chatId, messages.listNotFound(output.queryUser.first_name));
    });
    test(`Should report after the invitation acceptance processed`, async () => {
      const user = {
        chat_id: 123123,
        first_name: 'Bob',
        last_name: 'Marley',
        invitations: [{ is_active: true, list: { name: 'default', mates: [{ first_name: 'Steve', last_name: 'Brown' }] } }]
      };
      telegram.send = jest.fn();
      const input = { chatId: 1, user: { first_name: 'mate' }, queryUser: user };
      const output = await invitationsController.accept.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(
        output.chatId,
        messages.youAccepted(`${user.first_name} ${user.last_name}`, output.user.first_name)
      );
      expect(telegram.send).toHaveBeenCalledWith(
        'sendMessage',
        {
          chat_id: user.chat_id,
          text: messages.yourInvitationAccepted(user.first_name, `${output.user.first_name} ${output.user.last_name}`),
        }
      );
      expect(db.upsert).toHaveBeenCalledWith(user.id, output.queryUser, 'users')
    });
  });

  describe(`/decline route`, () => {
    test(`Should claim if mate has already accepted the invitation`, async () => {
      const mate = { id: 2, username: 'mate', is_accepted: true };
      const user = {
        id: 1,
        username: 'user',
        invitations: [{
          is_active: true,
          list: { name: 'default', mates: [mate] }
        }]
      };
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve({ id: 1 }))
        .mockReturnValueOnce(Promise.resolve(user));
      const input = { chatId: 1, user: mate, queryUser: user };
      await invitationsController.decline.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.listNotFound(input.query_params));
    });
    test(`Should report after the invitation declined and redispatch to '/process_invitations' route`, async () => {
      const mate = { id: 2, username: 'mate', first_name: 'Steve' };
      const user = {
        id: 1, 
        first_name: 'Bob',
        invitations: [{
          is_active: true,
          list: { name: 'default', mates: [mate] },
        }]
      };
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve(mate))
        .mockReturnValueOnce(Promise.resolve(user));
      const redispatch = jest.fn();
      const input = { chatId: 1, user: mate, queryUser: user };
      await invitationsController.decline.pipe[3](input, redispatch);
      expect(chat.sendMessage).toHaveBeenCalledWith(
        input.chatId,
        messages.youDeclined(user.first_name, input.user.first_name)
      );
      mate.is_declined = true;
      expect(db.upsert).toHaveBeenCalledWith(user.id, user, 'users');
      expect(redispatch).toHaveBeenCalledWith('/process_invitations');
    });
  });

  describe(`/process_invitations route`, () => {
    test(`Should delete invitation if no mates to ask left`, async () => {
      const invitations = [{ id: 1 }];
      const user = {
        id: 1,
        chat_id: '123123213',
        first_name: 'user',
        invitations: [{
          is_active: true,
          list: { name: 'default', mates: [{ username: 'mate', is_accepted: true }] },
        }]
      };
      db.getAll = jest.fn()
        .mockReturnValueOnce(Promise.resolve(invitations));
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve(user));
      await invitationsController.process.pipe[0]();
      expect(db.upsert).toHaveBeenCalledWith(user.id, user, 'users');
      expect(db.delete).toHaveBeenCalledWith(user.id, 'invitations');
      expect(telegram.send).toHaveBeenCalledWith('sendMessage',
        {
          chat_id: user.chat_id,
          text: messages.listEnded(user.first_name),
        }
      );
    });
    test(`Should keep waiting if mate.asked_at has value but timeout is not gone`, async () => {
      const invitations = [{ id: 1 }];
      const recently = +(new Date()) - 30000;
      const user = {
        id: 1,
        chat_id: '123123213',
        username: 'user',
        invitations: [{
          timeout: 1,
          is_active: true,
          list: { name: 'default', mates: [{ username: 'mate', asked_at: recently }] },
        }]
      };
      db.getAll = jest.fn()
        .mockReturnValueOnce(Promise.resolve(invitations));
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve(user));
      await invitationsController.process.pipe[0]();
      expect(db.upsert).toHaveBeenCalledTimes(0);
      expect(telegram.send).toHaveBeenCalledTimes(0);
    });
    test(`Should mark as declined mate who .asked_at timeout has gone; on recursive call invitations record should be deleted`, async () => {
      const invitations = [{ id: 1 }];
      const mate = { id: 2, username: 'mate', asked_at:  +(new Date()) - 70000 }
      const user = {
        id: 1,
        chat_id: '123123213',
        username: 'user',
        invitations: [{
          timeout: 1,
          is_active: true,
          list: { name: 'default', mates: [mate] },
        }]
      };
      db.getAll = jest.fn()
        .mockReturnValueOnce(Promise.resolve(invitations));
      db.get = jest.fn()
        .mockReturnValue(Promise.resolve(user));
      await invitationsController.process.pipe[0]();
      mate.is_declined = true;
      expect(db.upsert).toHaveBeenCalledWith(user.id, user, 'users');
      expect(db.delete).toHaveBeenCalledWith(user.id, 'invitations');
    });
    test(`Should ask mate who is not asked yet`, async () => {
      const invitations = [{ id: 1 }];
      const mate = { id: 2, chat_id: '345345345', first_name: 'Steve', last_name: 'Johnson' }
      const user = {
        id: 1,
        chat_id: '123123213',
        first_name: 'Bob',
        last_name: 'Marley',
        invitations: [{ timeout: 1, is_active: true, list: { name: 'default', mates: [mate] } }]
      };
      db.getAll = jest.fn()
        .mockReturnValueOnce(Promise.resolve(invitations));
      db.get = jest.fn()
        .mockReturnValue(Promise.resolve(user));
      await invitationsController.process.pipe[0]();
      mate.asked_at = new Date();
      expect(db.upsert).toHaveBeenCalledWith(user.id, user, 'users');
      expect(telegram.send).toHaveBeenCalledWith('sendMessage',
        {
          chat_id: mate.chat_id,
          text: messages.invitePending(
            `${user.first_name} ${user.last_name}`,
            mate.first_name,
            user.invitations[0],
          ),
          reply_markup: { inline_keyboard: [
            [
              { text: 'Yes', callback_data: `/accept?id=${user.id}` },
              { text: 'No', callback_data: `/decline?id=${user.id}` },
            ]
          ]}
        }
      );
    });
  });
});

