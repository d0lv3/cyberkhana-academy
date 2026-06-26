/**
 * Dev utility: print a short-lived JWT for a user (by email) so API endpoints
 * can be exercised from the shell via `Authorization: Bearer <token>`.
 *   node scripts/issue-test-token.js <email>
 */
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/issue-test-token.js <email>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await mongoose.connection.db
    .collection('users')
    .findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }
  const token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });
  console.log(JSON.stringify({ id: String(user._id), email: user.email, role: user.role, token }));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
