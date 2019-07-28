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
    test(`Should claim if mate not found`, async () => {
      db.get = jest.fn().mockReturnValue(Promise.resolve(undefined));
      const data = { from: { username: 'mate' } };
      await invitationsController.accept.pipe[1](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.mateNotFound(data.from.username));
    });
    test(`Should claim if mate found, but no query_params provided`, async () => {
      db.get = jest.fn().mockReturnValue(Promise.resolve({ username: 'mate' }));
      const data = { from: { username: 'mate' }, query_params: undefined };
      await invitationsController.accept.pipe[1](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.invalidQueryParams(data.query_params));
    });
    test(`Should claim if user not found`, async () => {
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve({ username: 'mate' }))
        .mockReturnValueOnce(Promise.resolve(undefined));
      const data = { from: { username: 'mate' }, query_params: { username: 'user' } };
      await invitationsController.accept.pipe[1](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.mateNotFound(data.query_params.username));
    });
    test(`Should claim if found user has no invitations`, async () => {
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve({ username: 'mate' }))
        .mockReturnValueOnce(Promise.resolve({ username: 'user', invitations: [] }));
      const data = { from: { username: 'mate' }, query_params: { username: 'user' } };
      await invitationsController.accept.pipe[1](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.invitationNotFound);
      expect(db.delete).toHaveBeenCalledWith(data.query_params.username, 'invitations');
    });
    test(`Should claim if mate is absent in the invitation list`, async () => {
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve({ username: 'mate' }))
        .mockReturnValueOnce(Promise.resolve({
          username: 'user',
          invitations: [{ is_active: true, list: [] }]
        },
      ));
      const data = { from: { username: 'mate' }, query_params: { username: 'user' } };
      await invitationsController.accept.pipe[1](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.listNotFound(data.query_params.username));
    });
    test(`Should claim if mate has already declined the invitation`, async () => {
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve({ username: 'mate' }))
        .mockReturnValueOnce(Promise.resolve({
          username: 'user',
          invitations: [{ is_active: true, list: [{ username: 'mate', is_declined: true }] }]
        },
      ));
      const data = { from: { username: 'mate' }, query_params: { username: 'user' } };
      await invitationsController.accept.pipe[1](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.listNotFound(data.query_params.username));
    });
    test(`Should report after the invitation acceptance processed`, async () => {
      const user = {
        username: 'user',
        invitations: [{ is_active: true, list: [{ username: 'mate' }] }]
      };
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve({ username: 'mate' }))
        .mockReturnValueOnce(Promise.resolve(user));
      telegram.send = jest.fn();
      const data = { from: { username: 'mate' }, query_params: { username: 'user' } };
      await invitationsController.accept.pipe[1](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(
        messages.youAccepted(user.username, data.from.username)
      );
      /* expect(chat.sendMessage).toHaveBeenCalledWith(
        messages.yourInvitationAccepted(user.username, data.from.username)
      ); */
      expect(db.upsert).toHaveBeenCalledWith(user.username, user, 'users')
    });
  });

  describe(`/decline route`, () => {
    test(`Should claim if mate has already accepted the invitation`, async () => {
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve({ username: 'mate' }))
        .mockReturnValueOnce(Promise.resolve({
          username: 'user',
          invitations: [{ is_active: true, list: [{ username: 'mate', is_accepted: true }] }]
        },
      ));
      const data = { from: { username: 'mate' }, query_params: { username: 'user' } };
      await invitationsController.decline.pipe[1](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.listNotFound(data.query_params.username));
    });
    test(`Should report after the invitation declined and redispatch to '/process_invitations' route`, async () => {
      const user = {
        username: 'user',
        invitations: [{ is_active: true, list: [{ username: 'mate' }] }]
      };
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve({ username: 'mate' }))
        .mockReturnValueOnce(Promise.resolve(user));
      const redispatch = jest.fn();
      const data = { from: { username: 'mate' }, query_params: { username: 'user' } };
      await invitationsController.decline.pipe[1](data, redispatch);
      expect(chat.sendMessage).toHaveBeenCalledWith(
        messages.youDeclined(user.username, data.from.username)
      );
      expect(db.upsert).toHaveBeenCalledWith(user.username, user, 'users');
      expect(redispatch).toHaveBeenCalledWith('/process_invitations');
    });
  });

  describe(`/process_invitations route`, () => {
    test(`Should delete invitation if no mates to ask left`, async () => {
      const invitations = [{
        username: 'user'
      }];
      const user = {
        chat_id: '123123213',
        username: 'user',
        invitations: [{ is_active: true, list: [{ username: 'mate', is_accepted: true }] }]
      };
      db.getAll = jest.fn()
        .mockReturnValueOnce(Promise.resolve(invitations));
      db.get = jest.fn()
        .mockReturnValueOnce(Promise.resolve(user));
      await invitationsController.process.pipe[0]();
      expect(db.upsert).toHaveBeenCalledWith(user.username, user, 'users');
      expect(db.delete).toHaveBeenCalledWith(user.username, 'invitations');
      expect(telegram.send).toHaveBeenCalledWith('sendMessage',
        {
          chat_id: user.chat_id,
          text: messages.listEnded(user.username),
        }
      );
    });
    test(`Should keep waiting if mate.asked_at has value but timeout is not gone`, async () => {
      const invitations = [{
        username: 'user'
      }];
      const recently = +(new Date()) - 30000;
      const user = {
        chat_id: '123123213',
        username: 'user',
        invitations: [{ timeout: 1, is_active: true, list: [{ username: 'mate', asked_at: recently }] }]
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
      const invitations = [{
        username: 'user'
      }];
      const mate = { username: 'mate', asked_at:  +(new Date()) - 70000 }
      const user = {
        chat_id: '123123213',
        username: 'user',
        invitations: [{ timeout: 1, is_active: true, list: [mate] }]
      };
      db.getAll = jest.fn()
        .mockReturnValueOnce(Promise.resolve(invitations));
      db.get = jest.fn()
        .mockReturnValue(Promise.resolve(user));
      await invitationsController.process.pipe[0]();
      mate.is_declined = true;
      expect(db.upsert).toHaveBeenCalledWith('user', user, 'users');
      expect(db.delete).toHaveBeenCalledWith(user.username, 'invitations');
    });
    test(`Should ask mate who is not asked yet`, async () => {
      const invitations = [{
        username: 'user'
      }];
      const mate = { chat_id: '345345345', username: 'mate' }
      const user = {
        chat_id: '123123213',
        username: 'user',
        invitations: [{ timeout: 1, is_active: true, list: [mate] }]
      };
      db.getAll = jest.fn()
        .mockReturnValueOnce(Promise.resolve(invitations));
      db.get = jest.fn()
        .mockReturnValue(Promise.resolve(user));
      await invitationsController.process.pipe[0]();
      mate.asked_at = new Date();
      expect(db.upsert).toHaveBeenCalledWith('user', user, 'users');
      expect(telegram.send).toHaveBeenCalledWith('sendMessage',
        {
          chat_id: mate.chat_id,
          text: messages.invitePending(user.username, mate.username, user.invitations[0]),
          reply_markup: { inline_keyboard: [
            [
              { text: 'yes', callback_data: `/accept?username=${user.username}` },
              { text: 'no', callback_data: `/decline?username=${user.username}` },
            ]
          ]}
        }
      );
    });
  });
});

