const middleware = require('../../src/middlewares/templateMiddleware');
const UserInputError = require('../../src/errors/userInputError');
const db = require('../../src/services/dbService');

describe(`TemplateMiddleware`, () => {
  beforeEach(() => {
    db.upsert = jest.fn();
  });

  const errorMessage = 'customErrorText';
  describe(`IfNoTemplate`, () => {
    test(`Should throw UserInputError in case of no templates field`, async () => {
      const input = { user: { username: 'user' } };
      try {
        await middleware.ifNoTemplates(input, errorMessage);
      } catch(error) {
        expect(error).toBeInstanceOf(UserInputError);
        expect(error.message).toBe(errorMessage);
      }
    });
    test(`Should throw UserInputError in case of templates field is empty array`, async () => {
      const input = { user: { username: 'user' }, templates: [] };
      try {
        await middleware.ifNoTemplates(input, errorMessage);
      } catch(error) {
        expect(error).toBeInstanceOf(UserInputError);
        expect(error.message).toBe(errorMessage);
      }
    });
  });
  test(`IfTemplateNameBusy: Should throw UserInputError if typed name is already exists in the templates`, async () => {
    const input = {
      user: {
        chat_id: '123123213',
        username: 'user',
        templates: [{ name: 'unique', mates: [] }]
      },
      templateName: 'unique'
    };
    try {
      await middleware.ifTemplateNameBusy(input, errorMessage);
    } catch(error) {
      expect(error).toBeInstanceOf(UserInputError);
      expect(error.message).toBe(errorMessage);
    }
  });
  test(`defineTemplateFromState: Should claim if stated template is not in the templates of the user`, async () => {
    const input = {
      user: {
        username: 'user',
        templates: [],
        state: { templateName: 'notExistingTemplate' },
      }
    };
    try {
      await middleware.defineTemplateFromState(input, errorMessage);
    } catch(error) {
      expect(error).toBeInstanceOf(UserInputError);
      expect(error.message).toBe(errorMessage);
    }
  });
});