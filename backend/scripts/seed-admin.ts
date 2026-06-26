/**
 * Promote (or create) a user as admin/creator.
 *   npx tsx scripts/seed-admin.ts <email> [role] [displayName]
 *   e.g. npx tsx scripts/seed-admin.ts you@example.com admin "Your Name"
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User';

dotenv.config();

async function main() {
  const [email, role = 'admin', displayName] = process.argv.slice(2);
  if (!email || !['user', 'creator', 'admin'].includes(role)) {
    console.error('Usage: npx tsx scripts/seed-admin.ts <email> [user|creator|admin] [displayName]');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI!);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = role as 'user' | 'creator' | 'admin';
    if (displayName) existing.displayName = displayName;
    await existing.save();
    console.log(`Updated ${email} → role: ${role}`);
  } else {
    await User.create({
      email,
      displayName: displayName || email.split('@')[0],
      role,
    });
    console.log(`Created ${email} with role: ${role}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
