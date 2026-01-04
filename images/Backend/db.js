const { MongoClient } = require("mongodb");

let db;

async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URL);

  await client.connect();
  console.log("Connected to MongoDB (native driver)");
  
  db = client.db("petlog");  
}

function getDB() {
  return db;
}

module.exports = { connectDB, getDB };
