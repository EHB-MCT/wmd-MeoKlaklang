const axios = require('axios');

// Dutch/Belgian names and dog breeds
const firstNames = ['Jasper', 'Emma', 'Lars', 'Sophie', 'Ruben', 'Femke', 'Milan', 'Yara', 'Bram', 'Lotte', 'Sem', 'Eva', 'Daan', 'Sanne', 'Luuk', 'Anna', 'Niels', 'Julia', 'Kevin', 'Sara'];
const lastNames = ['de Jong', 'Janssen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Vries', 'van den Berg', 'van Dijk', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Boer', 'de Haan', 'van der Meer', 'Mulder'];
const dogBreeds = ['Golden Retriever', 'Labrador Retriever', 'Border Collie', 'Jack Russell Terrier', 'Duitse Herder', 'Beagle', 'Boxer', 'Hondengezelschapshond', 'Staffordshire Bull Terrier', 'Cavalier King Charles Spaniel', 'Poedel', 'Yorkshire Terrier', 'Shih Tzu', 'West Highland White Terrier', 'Berner Sennenhond'];
const dogNames = ['Max', 'Bella', 'Bobby', 'Luna', 'Sam', 'Daisy', 'Rocky', 'Lucy', 'Charlie', 'Lily', 'Duke', 'Molly', 'Bear', 'Coco', 'Zeus', 'Rosie', 'Buddy', 'Ruby', 'Jack', 'Sadie'];

function getUniqueName(usedNames) {
  let name;
  do {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    name = `${firstName} ${lastName} ${randomNum}`;
  } while (usedNames.has(name));
  usedNames.add(name);
  return name;
}

async function createTestData() {
  try {
    console.log('🚀 Starting to create test data...');
    const usedNames = new Set();

    // Create 20 regular users
    const users = [];
    for (let i = 0; i < 20; i++) {
      const name = getUniqueName(usedNames);
      const password = 'password123';
      
      try {
        const response = await axios.post('http://localhost:5003/api/users/register', {
          name, password, isAdmin: false
        });
        
        users.push(response.data);
        console.log(`✅ Created user: ${name}`);
      } catch (error) {
        console.log(`⚠️ Skipped duplicate user: ${name}`);
      }
    }

    // Create 2 manager users
    for (let i = 0; i < 2; i++) {
      const name = `Manager${i + 1} Admin`;
      const password = 'manager123';
      
      try {
        const response = await axios.post('http://localhost:5003/api/users/register', {
          name, password, isAdmin: false
        });
        
        users.push({ ...response.data, role: 'manager' });
        console.log(`✅ Created manager: ${name}`);
      } catch (error) {
        console.log(`⚠️ Skipped duplicate manager: ${name}`);
      }
    }

    console.log(`🎉 Created ${users.length} users successfully!`);

    // Wait a bit before creating dogs
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create dogs for users
    let totalDogs = 0;
    for (const user of users) {
      const numDogs = Math.random() < 0.3 ? 2 : 1; // 30% chance of 2 dogs
      
      for (let d = 0; d < numDogs; d++) {
        const dogName = dogNames[Math.floor(Math.random() * dogNames.length)];
        const breed = dogBreeds[Math.floor(Math.random() * dogBreeds.length)];
        const age = Math.floor(Math.random() * 12) + 1; // 1-12 years old
        const weight = Math.floor(Math.random() * 30) + 5; // 5-35 kg
        
        try {
          const response = await axios.post('http://localhost:5003/api/dogs', {
            name: dogName,
            breed,
            age,
            weight,
            userId: user._id
          });
          
          totalDogs++;
          console.log(`🐕 Created dog: ${dogName} for ${user.name}`);
        } catch (error) {
          console.log(`⚠️ Failed to create dog for ${user.name}: ${error.response?.data?.error || error.message}`);
        }
      }
    }

    console.log(`🎉 Created ${totalDogs} dogs successfully!`);
    console.log('✨ Test data creation complete!');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

createTestData();