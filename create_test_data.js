const { getDB } = require('./db');

// Dutch/Belgian names and dog breeds
const firstNames = ['Jasper', 'Emma', 'Lars', 'Sophie', 'Ruben', 'Femke', 'Milan', 'Yara', 'Bram', 'Lotte', 'Sem', 'Eva', 'Daan', 'Sanne', 'Luuk', 'Anna', 'Niels', 'Julia', 'Kevin', 'Sara'];
const lastNames = ['de Jong', 'Janssen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Vries', 'van den Berg', 'van Dijk', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Boer', 'de Haan', 'van der Meer', 'Mulder'];
const dogBreeds = ['Golden Retriever', 'Labrador Retriever', 'Border Collie', 'Jack Russell Terrier', 'Duitse Herder', 'Beagle', 'Boxer', 'Hondengezelschapshond', 'Staffordshire Bull Terrier', 'Cavalier King Charles Spaniel', 'Poedel', 'Yorkshire Terrier', 'Shih Tzu', 'West Highland White Terrier', 'Berner Sennenhond'];
const dogNames = ['Max', 'Bella', 'Bobby', 'Luna', 'Sam', 'Daisy', 'Rocky', 'Lucy', 'Charlie', 'Lily', 'Duke', 'Molly', 'Bear', 'Coco', 'Zeus', 'Rosie', 'Buddy', 'Ruby', 'Jack', 'Sadie'];

async function createTestData() {
  try {
    const db = getDB();
    console.log('🚀 Starting to create test data...');

    // Create 20 regular users
    const users = [];
    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const password = 'password123';
      
      const response = await fetch('http://localhost:5003/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, isAdmin: false })
      });
      
      if (response.ok) {
        const userData = await response.json();
        users.push(userData);
        console.log(`✅ Created user: ${name}`);
      }
    }

    // Create 2 manager users
    for (let i = 0; i < 2; i++) {
      const name = `Manager${i + 1} Admin`;
      const password = 'manager123';
      
      const response = await fetch('http://localhost:5003/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, isAdmin: false })
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Update role to manager
        await db.collection('users').updateOne(
          { _id: userData._id },
          { $set: { role: 'manager' } }
        );
        users.push({ ...userData, role: 'manager' });
        console.log(`✅ Created manager: ${name}`);
      }
    }

    console.log(`🎉 Created ${users.length} users successfully!`);

    // Wait a bit before creating dogs
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create dogs for users
    let totalDogs = 0;
    for (const user of users) {
      const numDogs = Math.random() < 0.3 ? 2 : 1; // 30% chance of 2 dogs
      
      for (let d = 0; d < numDogs; d++) {
        const dogName = dogNames[Math.floor(Math.random() * dogNames.length)];
        const breed = dogBreeds[Math.floor(Math.random() * dogBreeds.length)];
        const age = Math.floor(Math.random() * 12) + 1; // 1-12 years old
        const weight = Math.floor(Math.random() * 30) + 5; // 5-35 kg
        
        const response = await fetch('http://localhost:5003/api/dogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: dogName, 
            breed, 
            age, 
            weight,
            userId: user._id 
          })
        });
        
        if (response.ok) {
          totalDogs++;
          console.log(`🐕 Created dog: ${dogName} for ${user.name}`);
        }
      }
    }

    console.log(`🎉 Created ${totalDogs} dogs successfully!`);
    console.log('✨ Test data creation complete!');
    
    // Show final stats
    const finalUserCount = await db.collection('users').countDocuments();
    const finalDogCount = await db.collection('dogs').countDocuments();
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`   Users: ${finalUserCount}`);
    console.log(`   Dogs: ${finalDogCount}`);
    console.log(`   Avg dogs per user: ${(finalDogCount / finalUserCount).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData };