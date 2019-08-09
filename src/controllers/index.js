const controllers = [
  require('./basicsController.js'),
  require('./invitationsController.js'),
  require('./listsController.js'),
  require('./matesController.js'),
  require('./templatesController.js'),
  require('./usersController.js'),
];
const routesMap = controllers.reduce((memo, controller) => {
  for(const key in controller) {
    const action = controller[key];
    if (memo[action.route]) {
      throw `The route ${action.route} is already defined`;
    }
    memo[action.route] = action.pipe;
  }
  return memo;
}, {});

module.exports = routesMap;