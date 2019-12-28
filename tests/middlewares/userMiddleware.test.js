const middleware = require('../../src/middlewares/userMiddleware');
const UserInputError = require('../../src/errors/userInputError');
const db = require('../../src/services/dbService');

describe(`UserMiddleware`, () => {
  const errorMessage = 'customErrorText';
  describe(`defineUser`, () => {
    test(`Should throw UserInputError if message passed and no user found`, async () => {
      db.get = jest.fn().mockReturnValue(Promise.resolve(undefined));
      const input = { message: { from: { username: 'qweqwewe' } } };
      try {
        await middleware.defineUser(input, errorMessage);
      } catch(error) {
        expect(error).toBeInstanceOf(UserInputError);
        expect(error.message).toBe(errorMessage);
      }
    });
    test(`Should find the user`, async () => {
      db.get = jest.fn().mockReturnValue(Promise.resolve({ username: 'user'}));
      const input = { message: { from: { username: 'user' } } };
      const output = await middleware.defineUser(input);
      expect(output.user).toStrictEqual({ username: 'user' });
    });
  });
  describe(`defineUserFromQuery`, () => {
    test(`Should throw UserInputError if query_params invalid`, async () => {
      const input = { query_params: undefined };
      try {
        await middleware.defineUserFromQuery(input, errorMessage);
      } catch(error) {
        expect(error).toBeInstanceOf(UserInputError);
        expect(error.message).toBe(errorMessage);
      }
    });
    test(`Should throw UserInputError if query_params valid but user not found`, async () => {
      const user = { username: 'user' };
      const input = { query_params: user };
      db.get = jest.fn().mockReturnValue(Promise.resolve(undefined));
      try {
        await middleware.defineUserFromQuery(input, errorMessage);
      } catch(error) {
        expect(error).toBeInstanceOf(UserInputError);
        expect(error.message).toBe(errorMessage);
      }
    });
    test(`Should find the user query_params valid`, async () => {
      const user = { id: 1 };
      db.get = jest.fn().mockReturnValue(Promise.resolve(user));
      const input = { query_params: user };
      const output = await middleware.defineUserFromQuery(input, errorMessage);
      expect(output.queryUser).toStrictEqual(user);
    });
  });
  describe(`defineTypedUser`, () => {
    test(`Should throw UserInputError if no user found`, async () => {
      const input = { message: { text: 'qweqwewe' } };
      try {
        await middleware.defineUserFromTyped(input, errorMessage);
      } catch(error) {
        expect(error).toBeInstanceOf(UserInputError);
        expect(error.message).toBe(errorMessage);
      }
    });
    test(`Should find the user typed correctly`, async () => {
      db.get = jest.fn().mockReturnValue(Promise.resolve({ username: 'mate' }));
      const input = { message: { text: '@mate' } };
      const output = await middleware.defineUserFromTyped(input, errorMessage);
      expect(output.mate).toStrictEqual({ username: 'mate' });
    });
  });
});