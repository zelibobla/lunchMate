const routesMap = require('../controllers/index.js');
const dispatch = async(route, data) => {
  if (!routesMap[route]) {
    route = '/undefined';
  }
  const pipe = routesMap[route];
  let prevResult = data;
  for(const act of pipe) {
    prevResult = await act(prevResult, dispatch);
  }
};
module.exports = dispatch;
