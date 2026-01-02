const { MongoClient } = require('mongodb');

// Configuration
const LOCAL_MONGO_URL = 'mongodb://localhost:27017/petlog';
const DOCKER_MONGO_URL = 'mongodb://localhost:27017/petlog'; // Same URL since Docker exposes port 27017

async function transferUsers() {
  let localClient;
  let dockerClient;
  
  try {
    // Connect to both databases
    localClient = new MongoClient(LOCAL_MONGO_URL);
    dockerClient = new MongoClient(DOCKER_MONGO_URL);
    
    await localClient.connect();
    await dockerClient.connect();
    
    console.log('Connected to both MongoDB instances');
    
    const localDb = localClient.db('petlog');
    const dockerDb = dockerClient.db('petlog');
    
    // Get all users from local database
    const localUsers = await localDb.collection('users').find({}).toArray();
    
    if (localUsers.length === 0) {
      console.log('No users found in local database');
      
      // Create default admin user in Docker
      const { createUser } = require('./images/Backend/models/User');
      await require('./images/Backend/db').connectDB();
      
      const adminUser = await createUser('admin', 'admin123', 'admin');
      console.log('Created default admin user:', adminUser);
      return;
    }
    
    console.log(`Found ${localUsers.length} users in local database`);
    
    // Transfer each user to Docker database
    for (const user of localUsers) {
      // Check if user already exists in Docker
      const existingUser = await dockerDb.collection('users').findOne({ name: user.name });
      
      if (existingUser) {
        console.log(`User '${user.name}' already exists in Docker, skipping...`);
        continue;
      }
      
      // Insert user into Docker database
      const result = await dockerDb.collection('users').insertOne(user);
      console.log(`Transferred user: ${user.name} (ID: ${result.insertedId})`);
    }
    
    console.log('User transfer completed successfully!');
    
  } catch (error) {
    console.error('Error transferring users:', error);
  } finally {
    if (localClient) await localClient.close();
    if (dockerClient) await dockerClient.close();
  }
}

// Run the transfer
transferUsers();