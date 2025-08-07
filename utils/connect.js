const  { MongoClient } = require('mongodb');

const CONNECTION_STRING = process.env.CONNECTION_STRING,
    LOCAL_CONNECTION_STRING = process.env.LOCAL_CONNECTION_STRING,
    local_client = new MongoClient(LOCAL_CONNECTION_STRING),
    client = new MongoClient(CONNECTION_STRING); 

async function connection(db) {
  try {
    if (!client.isConnected?.())
    console.log('connecting', process.env.CONNECTION_STRING)

      await client.connect();
      if (db) return client.db(db);
      return client;
  } catch (error) {
      console.log('db connection error',error);
      return null;
  }
}

async function local_connection(db){
  try {
    if (!local_client.isConnected?.()){
    console.log('connecting local', process.env.LOCAL_CONNECTION_STRING)

      await local_client.connect();
      if (db) return (client.db(db));
      return local_client;
    }
  } catch (error) {
      console.log('local connection error',error)
      return false;
  }
}

const connection_manager = {
    connect:connection,
    connect_local:local_connection,
    client,
    local_client,
}

module.exports = connection_manager;