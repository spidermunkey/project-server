const client = require('../connect.js');

async function deleteDocumentsWithPattern() {

  try {
    await client.connect();
    console.log('Connected to the database');

    const db = client.db('icons');
    const collection = db.collection('recent');

    // Define the regular expression pattern to match (#num)
    const regexPattern = /\(\d+\)/;

    // Delete documents where the name field matches the pattern
    const result = await collection.deleteMany({ name: { $regex: regexPattern } });

    console.log(`${result.deletedCount} documents were deleted`);
  } catch (error) {
    console.error('Error deleting documents:', error);
  } finally {
    await client.close();
  }
}

deleteDocumentsWithPattern();
