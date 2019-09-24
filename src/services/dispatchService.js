const routesMap = require('../controllers/index.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');

const dispatch = async(route, input) => {
  if (!routesMap[route]) {
    route = '/undefined';
  }
  const pipe = routesMap[route];
  let prevResult = input;
  for(const act of pipe) {
    try {
      prevResult = await act(prevResult, dispatch);
    } catch (error) {
      if (error.type && error.type === 'user_input') {
        return await chatMiddleware.sendMessage(prevResult.chatId, error.message);
      } else {
        throw error;
      }
    }
  }
};
module.exports = dispatch;
