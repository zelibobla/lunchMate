const chat = require('../../src/middlewares/chatMiddleware');
const db = require('../../src/services/dbService');
const templatesController = require('../../src/controllers/templatesController');
const messages = require('../../src/configs/messages');

describe(`Templates controller`, () => {
  beforeEach(() => {
    chat.sendMessage = jest.fn();
    db.upsert = jest.fn();
  });

  describe(`/create_template route`, () => {
    test(`Should claim if not registered yet`, async () => {
      await templatesController.create.pipe[2]({});
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.registerFirst);
    });
    test(`Should set /add_eat_place route in the state`, async () => {
      const data = { user: { username: 'user' } };
      await templatesController.create.pipe[2](data);
      expect(data.user.state.route).toBe('/add_eat_place');
      expect(db.upsert).toHaveBeenCalledWith(data.user.username, data.user, 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.typeEatPlace);
    });
  });

  describe(`/add_eat_place route`, () => {
    test(`Should claim if not registered yet`, async () => {
      await templatesController.addEatPlace.pipe[2]({});
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.registerFirst);
    });
    test(`Should add template and set /add_meet_place route in the state`, async () => {
      const data = { user: { username: 'user' }, message: { text: 'My Eat Place' } };
      await templatesController.addEatPlace.pipe[2](data);
      expect(data.user.state.route).toBe('/add_meet_place');
      expect(data.user.templates[0].is_creating).toBe(true);
      expect(data.user.templates[0].eat_place).toBe('My Eat Place');
      expect(db.upsert).toHaveBeenCalledWith(data.user.username, data.user, 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.typeMeetPlace);
    });
  });

  describe(`/add_meet_place route`, () => {
    test(`Should claim if not registered yet`, async () => {
      await templatesController.addEatPlace.pipe[2]({});
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.registerFirst);
    });
    test(`Should add meet place into template and set /add_delay route in the state`, async () => {
      const data = { user: { username: 'user' }, message: { text: 'My Meet Place' } };
      await templatesController.addMeetPlace.pipe[2](data);
      expect(data.user.state.route).toBe('/add_delay');
      expect(data.user.templates[0].is_creating).toBe(true);
      expect(data.user.templates[0].meet_place).toBe('My Meet Place');
      expect(db.upsert).toHaveBeenCalledWith(data.user.username, data.user, 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.typeDelay);
    });
  });

  describe(`/add_delay route`, () => {
    test(`Should claim if not registered yet`, async () => {
      await templatesController.addEatPlace.pipe[2]({});
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.registerFirst);
    });
    test(`Should add delay into template and set /add_timeout route in the state`, async () => {
      const data = { user: { username: 'user' }, message: { text: '3' } };
      await templatesController.addDelay.pipe[2](data);
      expect(data.user.state.route).toBe('/add_timeout');
      expect(data.user.templates[0].is_creating).toBe(true);
      expect(data.user.templates[0].delay).toBe('3');
      expect(db.upsert).toHaveBeenCalledWith(data.user.username, data.user, 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.typeTimeout);
    });
  });

  describe(`/add_timeout route`, () => {
    test(`Should claim if not registered yet`, async () => {
      await templatesController.addEatPlace.pipe[2]({});
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.registerFirst);
    });
    test(`Should add timeout into template and reset the state`, async () => {
      const data = { user: { username: 'user' }, message: { text: '5' } };
      await templatesController.addTimeout.pipe[2](data);
      expect(data.user.state).toStrictEqual({});
      expect(data.user.templates[0].is_creating).toBe(false);
      expect(data.user.templates[0].timeout).toBe('5');
      expect(db.upsert).toHaveBeenCalledWith(data.user.username, data.user, 'users');
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.templateCreated({ timeout: 5 }));
    });
  });

  describe(`/delete_template route`, () => {
    test(`Should claim if not registered yet`, async () => {
      await templatesController.addEatPlace.pipe[2]({});
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.registerFirst);
    });
    test(`Should claim if trying to delete not existing template`, async () => {
      const data = { user: { username: 'user', templates: [] }, query_params: { template_index: '5' } };
      await templatesController.delete.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.templateNotFound);
    });
    test(`Should delete specified template`, async () => {
      const template = { meet_place: 'A', eat_place: 'B', delay: 5, timeout: 1 };
      const data = { user: { username: 'user', templates: [template] }, query_params: { template_index: '0' } };
      await templatesController.delete.pipe[2](data);
      expect(chat.sendMessage).toHaveBeenCalledWith(messages.templateDeleted(template));
    });
  });

});

