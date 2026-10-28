import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DEMO_PASSWORD = 'Password123!';

async function clearDatabase() {
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.aiOutput.deleteMany();
  await prisma.post.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  if (process.env.SEED_IF_EMPTY === 'true') {
    if (await prisma.user.count()) {
      console.log('Database already contains users; skipping demo seed.');
      return;
    }
  } else {
    await clearDatabase();
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const demoUser = await prisma.user.create({
    data: { email: 'demo@smartcontent.test', passwordHash },
  });
  const freelancer = await prisma.user.create({
    data: { email: 'sarah@freelance.test', passwordHash },
  });

  const summerLaunch = await prisma.campaign.create({
    data: {
      name: 'Summer Product Launch',
      description: 'Launch campaign for the new summer collection.',
      userId: demoUser.id,
      posts: {
        create: [
          {
            title: 'Write launch announcement email',
            status: 'done',
            order: 0,
          },
          { title: 'Design hero banner copy', status: 'in_progress', order: 1 },
          { title: 'Schedule social posts', status: 'todo', order: 2 },
        ],
      },
      outputs: {
        create: [
          {
            type: 'ad',
            title: 'Summer collection launch ad',
            prompt: 'Write a Facebook ad for a new summer collection.',
            content:
              'Meet your new summer favorites: easy, colorful styles made for every sunny-day plan. Shop the collection today.',
          },
          {
            type: 'email',
            title: 'Summer launch email',
            prompt: 'Write a launch email for existing subscribers.',
            content:
              'Subject: Your summer starts here\n\nThe new collection is here. Explore fresh styles made for sunny days.',
          },
        ],
      },
    },
  });

  const bakeryRebrand = await prisma.campaign.create({
    data: {
      name: "Client: Baker's Delight Rebrand",
      description: 'Introduce the bakery’s refreshed brand to local customers.',
      userId: freelancer.id,
      posts: {
        create: [
          {
            title: 'Prepare brand announcement',
            status: 'in_progress',
            order: 0,
          },
          { title: 'Update Google Business profile', status: 'todo', order: 1 },
        ],
      },
      outputs: {
        create: [
          {
            type: 'caption',
            title: 'Bakery rebrand announcement',
            prompt: 'Write an Instagram caption announcing a bakery rebrand.',
            content:
              'Same family recipes, fresh new look. Baker’s Delight is ready to welcome you back!',
          },
        ],
      },
    },
  });

  await prisma.chatSession.createMany({
    data: [
      {
        userId: demoUser.id,
        campaignId: summerLaunch.id,
        title: 'Summer launch ideas',
      },
      {
        userId: freelancer.id,
        campaignId: bakeryRebrand.id,
        title: 'Rebrand announcement',
      },
    ],
  });

  const sessions = await prisma.chatSession.findMany({
    select: { id: true, userId: true },
  });
  await prisma.chatMessage.createMany({
    data: sessions.flatMap((session) => {
      const isSummerCampaign = session.userId === demoUser.id;
      return [
        {
          sessionId: session.id,
          role: 'user',
          content: isSummerCampaign
            ? 'How should we announce the summer collection?'
            : 'How can we introduce the bakery rebrand to regulars?',
        },
        {
          sessionId: session.id,
          role: 'assistant',
          content: isSummerCampaign
            ? 'Highlight the new collection with a launch email and social posts.'
            : 'Emphasize the familiar recipes and people behind the refreshed look.',
        },
      ];
    }),
  });

  console.log('Seeded 2 demo users, 2 campaigns, and related sample data.');
  console.log(`Demo password for both accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
