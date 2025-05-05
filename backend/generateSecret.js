const crypto = require('crypto');

// Generate a random 64-byte string
const generateSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const secret = generateSecret();
console.log('Your JWT Secret:');
console.log(secret);
console.log('\nCopy this secret and add it to your .env file as:');
console.log(`JWT_SECRET=${secret}`); 