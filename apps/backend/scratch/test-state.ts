import { PrismaClient } from '../src/generated/prisma/client.js';
import * as dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Load environment variables for the test
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('1. Connecting to Supabase...');
  await prisma.$connect();

  console.log('2. Creating mock NextAuth user...');
  const user = await prisma.user.create({
    data: {
      email: `student-${Date.now()}@socratix.io`,
      name: 'Test Student',
    },
  });
  console.log(`✅ User created: ${user.id}`);

  console.log('3. Creating mock ChatSession (this simulates the "New Chat" button)...');
  const chatSession = await prisma.chatSession.create({
    data: {
      userId: user.id,
    },
  });
  console.log(`✅ ChatSession created: ${chatSession.id}`);

  console.log('4. Testing PrismaStateManagerService simulation (createState)...');
  const sessionState = await prisma.sessionState.create({
    data: {
      uid: chatSession.id,
      equation: '2x + 4 = 10',
      problemType: 'algebra',
      step: 1,
      history: [{ role: 'user', content: 'Can you help me solve this?' }],
      nextState: 'Planner',
    },
  });
  console.log('✅ State created successfully:', sessionState);

  console.log('5. Testing updateState...');
  const updatedState = await prisma.sessionState.update({
    where: { uid: sessionState.uid },
    data: {
      step: 2,
      nextState: 'Agent 1',
      history: [
        { role: 'user', content: 'Can you help me solve this?' },
        { role: 'assistant', content: 'Sure! Let us isolate the x.' }
      ]
    }
  });
  console.log('✅ State updated successfully:', updatedState);

  console.log('6. Cleaning up test data...');
  // Since we have ON DELETE CASCADE in our schema, deleting the user
  // will automatically delete the chatSession and the sessionState!
  await prisma.user.delete({ where: { id: user.id } });
  console.log('✅ Cleanup complete!');
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
