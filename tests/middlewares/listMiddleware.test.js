const middleware = require('../../src/middlewares/listMiddleware');
const UserInputError = require('../../src/errors/userInputError');
const db = require('../../src/services/dbService');

describe(`ListMiddleware`, () => {
  beforeEach(() => {
    db.upsert = jest.fn();
  });

  const errorMessage = 'customErrorText';
  test(`IfNoList: Should throw UserInputError in case of no list or empty list`, async () => {
    const input = { user: { username: 'user' } };
    try {
      await middleware.ifNoList(input, errorMessage);
    } catch(error) {
      expect(error).toBeInstanceOf(UserInputError);
      expect(error.message).toBe(errorMessage);
    }
  });
  test(`IfListNameBusy: Should throw UserInputError if typed name is already exists in the lists`, async () => {
    const input = {
      user: {
        chat_id: '123123213',
        username: 'user',
        lists: [{ name: 'unique', mates: [] }]
      },
      listName: 'unique'
    };
    try {
      await middleware.ifListNameBusy(input, errorMessage);
    } catch(error) {
      expect(error).toBeInstanceOf(UserInputError);
      expect(error.message).toBe(errorMessage);
    }
  });
  test(`normalizeUserLists: If no lists, default should be created`, async () => {
    const input = { user: { id: 1, username: 'user' }, message: { text: 'mate' } };
    const output = await middleware.normalizeUserLists(input);
    expect(output.user.lists).toStrictEqual([{ name: 'default' }]);
    expect(db.upsert).toHaveBeenCalledWith(output.user.id, output.user, 'users');
  });
  test(`defineListToAddMates: If only one list, should choose it`, async () => {
    const list = { name: 'default', mates: [] };
    const input = {
      user: { username: 'user', lists: [list] }, 
      message: { text: 'mate' },
    };
    const output = await middleware.defineListToAddMates(input);
    expect(output.list).toStrictEqual(list);
  });
  test(`defineListFromState: Should claim if stated list is not in the lists of the user`, async () => {
    const input = {
      user: {
        username: 'user',
        lists: [],
        state: { listName: 'notExistingList' },
      }
    };
    try {
      await middleware.defineListFromState(input, errorMessage);
    } catch(error) {
      expect(error).toBeInstanceOf(UserInputError);
      expect(error.message).toBe(errorMessage);
    }
  });
});