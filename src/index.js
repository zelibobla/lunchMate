const router = require('./services/routerService.js');
const dispatch = require('./services/dispatchService.js');
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  try {
    const { route, data } = await router.parseRouteAndData(event);
    await dispatch(route, data);
    return { statusCode: 200 };
  } catch (error) {
    console.warn('Exception catched:', error);
    return { statusCode: 200 };
  }
};
