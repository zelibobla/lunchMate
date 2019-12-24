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
    test(`Should set /template_name route in the state`, async () => {
      const input = { id: 1, chatId: 1, user: { username: 'user' } };
      const output = await templatesController.create.pipe[2](input);
      expect(output.user.state.route).toBe('/template_name');
      expect(db.upsert).toHaveBeenCalledWith(output.user.id, output.user, 'users');
      const skipOption = { inline_keyboard: [[{
        text: 'Skip',
        callback_data: `/template_name?template_name=default`,
      }]]};
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.typeTemplateName, skipOption);
    });
  });

  describe(`/template_name route`, () => {
    test(`Should save typed name and set /template_eat_place route in the state`, async () => {
      const input = { id: 1, chatId: 1, user: { username: 'user', templates: [] } };
      const output = await templatesController.setName.pipe[4](input);
      expect(output.user.state.route).toBe('/template_eat_place');
      expect(db.upsert).toHaveBeenCalledWith(output.user.id, output.user, 'users');
      const skipOption = { inline_keyboard: [[{
        text: 'Skip',
        callback_data: `/template_eat_place?template_eat_place=our%20common%20place`,
      }]] };
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.typeEatPlace, skipOption);
    });
  });

  describe(`/template_eat_place route`, () => {
    test(`Should add template and set /template_eat_place route in the state`, async () => {
      const template = { name: 'default' };
      const input = {
        id: 1, 
        chatId: 1,
        user: { username: 'user', templates: [template], state: {} },
        message: { text: 'My Eat Place' },
        template,
      };
      const output = await templatesController.setEatPlace.pipe[3](input);
      expect(output.user.state.route).toBe('/template_meet_place');
      expect(output.user.templates[0].eat_place).toBe('My Eat Place');
      expect(db.upsert).toHaveBeenCalledWith(output.user.id, output.user, 'users');
      const skipOption = { inline_keyboard: [[{
        text: 'Skip',
        callback_data: `/template_meet_place?template_meet_place=as%20always`,
      }]] };
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.typeMeetPlace, skipOption);
    });
  });

  describe(`/template_meet_place route`, () => {
    test(`Should add meet place into template and set /template_delay route in the state`, async () => {
      const template = { name: 'default' };
      const input = {
        chatId: 1,
        user: { id: 1, username: 'user', templates: [template], state: {} },
        message: { text: 'My Meet Place' },
        template,
      };
      const output = await templatesController.setMeetPlace.pipe[3](input);
      expect(output.user.state.route).toBe('/template_delay');
      expect(output.user.templates[0].meet_place).toBe('My Meet Place');
      expect(db.upsert).toHaveBeenCalledWith(output.user.id, output.user, 'users');
      const skipOption = { inline_keyboard: [[{
        text: 'Skip',
        callback_data: `/template_delay?template_delay=5`,
      }]] };
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.typeDelay, skipOption);
    });
  });

  describe(`/template_delay route`, () => {
    test(`Should add delay into template and set /template_timeout route in the state`, async () => {
      const template = { name: 'default' };
      const input = {
        chatId: 1,
        user: { id: 1, username: 'user', templates: [template], state: {} },
        message: { text: '3' },
        template,
      };
      const output = await templatesController.setDelay.pipe[3](input);
      expect(output.user.state.route).toBe('/template_timeout');
      expect(output.user.templates[0].delay).toBe('3');
      expect(db.upsert).toHaveBeenCalledWith(output.user.id, output.user, 'users');
      const skipOption = { inline_keyboard: [[{
        text: 'Skip',
        callback_data: `/template_timeout?template_timeout=1`,
      }]] };
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.typeTimeout, skipOption);
    });
  });

  describe(`/template_timeout route`, () => {
    test(`Should add timeout into template and reset the state`, async () => {
      const template = { name: 'default' };
      const input = {
        chatId: 1,
        user: { id: 1, first_name: 'user', templates: [template], state: {} },
        message: { text: '5' },
        template,
      };
      const output = await templatesController.setTimeout.pipe[3](input);
      expect(output.user.state).toStrictEqual({});
      expect(output.user.templates[0].timeout).toBe('5');
      expect(db.upsert).toHaveBeenCalledWith(output.user.id, output.user, 'users');
      const inlineKeyboard = { inline_keyboard: [[{ text: 'Run', callback_data: `/run` }]]};
      expect(chat.sendMessage).toHaveBeenCalledWith(
        input.chatId,
        messages.templateCreated(input.user.first_name, { timeout: 5 }),
        inlineKeyboard,
      );
    });
  });

  describe(`/delete_template route`, () => {
  /*   test(`Should claim if trying to delete not existing template`, async () => {
      const input = { chatId: 1, user: { username: 'user', templates: [] }, query_params: { template_name: 'test' } };
      await templatesController.delete.pipe[2](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.templateNotFound);
    }); */
    test(`Should not delete specified template if it's the last one`, async () => {
      const template = { name: 'test', meet_place: 'A', eat_place: 'B', delay: 5, timeout: 1 };
      const input = { chatId: 1, user: { username: 'user', templates: [template] }, query_params: { template_name: 'test' } };
      await templatesController.deleteTyped.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.oneTemplateShouldStay);
    });
    test(`Should delete specified template`, async () => {
      const template0 = { name: 'test', meet_place: 'A', eat_place: 'B', delay: 5, timeout: 1 };
      const template1 = { name: 'test1', meet_place: 'A', eat_place: 'B', delay: 5, timeout: 1 };
      const input = { chatId: 1, user: { username: 'user', templates: [template0, template1] }, query_params: { template_name: 'test' } };
      await templatesController.deleteTyped.pipe[3](input);
      expect(chat.sendMessage).toHaveBeenCalledWith(input.chatId, messages.templateDeleted(template0.name));
    });
  });

});

