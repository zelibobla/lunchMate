const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({ 'region': 'us-east-2' });

const get = (key, value, table) => {
  if (!table) throw 'table needed';
  if (typeof key !== 'string') throw `key was not string and was ${JSON.stringify(key)} on table ${table}`;
  if (typeof value !== 'string') throw `value was not string and was ${JSON.stringify(value)} on table ${table}`;
  return new Promise((resolve, reject) => {
    let params = { TableName: table, Key: { [key]: value } };
    documentClient.get(params, function(err, data) {    
      if (err) {        
        console.log(`There was an error fetching the data for ${key} ${value} on table ${table}`, err);
        return reject(err);
      }
      return resolve(data.Item);
    });
  })
}

const getAll = (params, table) => {
  if (!table) throw 'table needed';
  if (!params || typeof params.filterExpression === 'undefined' || params.expressionAttributes === 'undefined') {
    throw `params ${JSON.stringify(params)} are invalid`;
  }
  params.TableName = table;
  return new Promise((resolve, reject) => {
    documentClient.scan(params, function(err, data) {
      if (err) {
        console.log(`There was an error scanning the table ${table} with params ${JSON.stringify(params)}`, err);
        return reject(err);
      }
      return resolve(data.Items);
    });
  });
}

const upsert = (key, data, table, force = true) => {
  return new Promise((resolve, reject) => {
    if (typeof key !== 'string') return reject(`the id must be a string and not ${key}`);
    if (!data) return reject('data is needed');
    if (!table) return reject('table name is needed');
    const forceUpsert = () => {
      const params = { TableName: table, Item: { ...data, id: key } };
      documentClient.put(params, function(err, result) {
        if (err) {
          console.log("Err in writeForCall writing messages to dynamo:", err);
          return reject(err);
        }
        return resolve({ ...result.Attributes, ...params.Item });
      });
    }
    if (!force) {
      get('username', key, table).then(result => {
        if (result) {
          return resolve(result);
        } else {
          forceUpsert();
        }
      }).catch(e => {
        return reject(e);
      });
    } else {
      forceUpsert();
    }
  });
}

const del = (username, table) => {
  return new Promise((resolve, reject) => {
    if (typeof username !== 'string') throw `the id must be a string and not ${username}`;
    if (!table) throw 'table name is needed';
    let params = { TableName: table, Key: { username } };
    documentClient.delete(params, function(err, result) {
      if (err) {
        console.log("Err in writeForCall writing messages to dynamo:", err);
        return reject(err);
      }
      return resolve({ ...result.Attributes, ...params.Item });
    });
  });
}

module.exports = { get, getAll, upsert, delete: del };
