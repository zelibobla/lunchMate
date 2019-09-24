const routesMap = require('../controllers/index.js');
const chatMiddleware = require('../middlewares/chatMiddleware.js');

const dispatch = async(route, data) => {
  if (!routesMap[route]) {
    route = '/undefined';
  }
  const pipe = routesMap[route];
  let prevResult = data;
  for(const act of pipe) {
    try {
      prevResult = await act(prevResult, dispatch);
    } catch (error) {
      if (error.type && error.type === 'user_input') {
        return await chatMiddleware.sendMessage(data.chatId, error.message);
      } else {
        throw error;
      }
    }
  }
};
module.exports = dispatch;
