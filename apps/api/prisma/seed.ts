import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { CAMPAIGN_POOL, pick, pickMany, randomStatus } from './data-utils';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

// Demo credentials (all users):
//   Password: Password123!

//   demo@smartcontent.test  — 3 campaigns, 2 chat sessions
//   sarah@freelance.test    — 2 client campaigns, 1 chat session

// Records created: {
//   users: 2,
//   campaigns: 5,
//   posts: 18,
//   aiOutputs: 9,
//   chatSessions: 3,
//   chatMessages: 8,
// }

// Sample campaign ID (Summer Launch): d77f0a61-06a5-4397-a4e2-868e2f4aa3ed
// Sample chat session ID: 35e01068-fac5-4062-afc4-054e054855d1

const DEMO_PASSWORD = 'Password123!';

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Generate and persist `count` random campaigns for the given `userId`.
 * Each campaign is drawn from CAMPAIGN_POOL (with repetition allowed when
 * count > pool size). Posts get randomised statuses; all outputs from the
 * template are included so the data feels realistic.
 *
 * @example
 *   await generateRandomCampaigns(demoUser.id, 12);
 */
async function generateRandomCampaigns(userId: string, count: number) {
  console.log(`  → Generating ${count} random campaigns for user ${userId}…`);
 
  const created: string[] = [];
 
  for (let i = 0; i < count; i++) {
    const template = pick(CAMPAIGN_POOL);
 
    // Pick 3–5 posts and assign random statuses
    const selectedPosts = pickMany(template.posts, 3, 5).map((title) => ({
      title,
      status: randomStatus(),
    }));
 
    const campaign = await prisma.campaign.create({
      data: {
        name: template.name,
        description: template.description ?? null,
        userId,
        posts: { create: selectedPosts },
        outputs: {
          create: template.outputs.map((o) => ({
            type: o.type,
            prompt: o.prompt,
            content: o.content,
          })),
        },
      },
    });
 
    created.push(campaign.name);
  }
 
  console.log(`  ✓ Created: ${created.join(', ')}`);
  return created;
}

async function clearDatabase() {
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.aiOutput.deleteMany();
  await prisma.post.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('Seeding database...');

  await clearDatabase();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@smartcontent.test',
      passwordHash,
    },
  });

  const freelancer = await prisma.user.create({
    data: {
      email: 'sarah@freelance.test',
      passwordHash,
    },
  });

  // demo user campaigns
  const summerLaunch = await prisma.campaign.create({
    data: {
      name: 'Summer Product Launch',
      userId: demoUser.id,
      posts: {
        create: [
          { title: 'Write launch announcement email', status: 'done' },
          { title: 'Design hero banner copy', status: 'in_progress' },
          { title: 'Schedule social posts', status: 'todo' },
          { title: 'Prepare press release', status: 'todo' },
        ],
      },
      outputs: {
        create: [
          {
            type: 'ad',
            prompt:
              'Write a Facebook ad for our new summer collection targeting millennials',
            content:
              'Summer is here — and so is our boldest collection yet.\n\n' +
              'Discover lightweight fabrics, vibrant colors, and styles made for adventure.\n\n' +
              'Shop the Summer Launch → Free shipping over $50\n\n' +
              '#SummerStyle #NewCollection',
          },
          {
            type: 'caption',
            prompt: 'Instagram caption for summer launch carousel',
            content:
              'Sun-kissed days call for sun-kissed styles\n\n' +
              'Our Summer Collection just dropped — 40+ pieces designed for heat, movement, and making memories.\n\n' +
              'Which look is your favorite? Drop a wave emoji in the comments!\n\n' +
              '#SummerVibes #OOTD #FashionLaunch',
          },
          {
            type: 'email',
            prompt: 'Launch email for existing subscribers',
            content:
              "Subject: You're invited — Summer Collection launches today\n\n" +
              'Hi there,\n\n' +
              'The wait is over. Our Summer Collection is live, and as a loyal subscriber, you get early access to our bestsellers before they sell out.\n\n' +
              '→ Shop Early Access\n\n' +
              'See you in the sun,\nThe Team',
          },
        ],
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: 'Holiday Email Series',
      userId: demoUser.id,
      posts: {
        create: [
          { title: 'Outline 5-email sequence', status: 'done' },
          { title: 'Draft Email 1 — Teaser', status: 'in_progress' },
          { title: 'Draft Email 2 — Early access', status: 'todo' },
          { title: 'Draft Email 3 — Last chance', status: 'todo' },
        ],
      },
      outputs: {
        create: [
          {
            type: 'email',
            prompt: 'Holiday teaser email for VIP list',
            content:
              'Subject: Something special is coming…\n\n' +
              'Our biggest sale of the year starts soon. VIP members get 24-hour early access.\n\n' +
              "Mark your calendar — you won't want to miss this.",
          },
        ],
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: 'Instagram Growth Q2',
      userId: demoUser.id,
      posts: {
        create: [
          { title: 'Audit top-performing posts', status: 'done' },
          { title: 'Create Reels content calendar', status: 'done' },
          { title: 'Engage with competitor audiences', status: 'done' },
        ],
      },
      outputs: {
        create: [
          {
            type: 'caption',
            prompt: 'Reel hook for behind-the-scenes content',
            content:
              "POV: It's 6 AM and we're already obsessing over the details\n\n" +
              'Follow for more BTS — link in bio!',
          },
        ],
      },
    },
  });

  await generateRandomCampaigns(demoUser.id, 10);

  // freelancer campaigns
  await prisma.campaign.create({
    data: {
      name: "Client: Baker's Delight Rebrand",
      userId: freelancer.id,
      posts: {
        create: [
          { title: 'Brand voice guidelines', status: 'done' },
          { title: 'New logo announcement posts', status: 'in_progress' },
          { title: 'Update Google Business profile', status: 'todo' },
        ],
      },
      outputs: {
        create: [
          {
            type: 'ad',
            prompt: 'Local bakery grand reopening ad',
            content:
              "Fresh out of the oven — Baker's Delight is back!\n\n" +
              'Same family recipes. Bold new look. Grand reopening this Saturday.\n\n' +
              'First 50 customers get a free croissant. See you on Main Street!',
          },
          {
            type: 'caption',
            prompt: 'Rebrand reveal Instagram post',
            content:
              "We've been kneading this for months… and today we rise!\n\n" +
              "Welcome to the new Baker's Delight — same heart, fresh identity.\n\n" +
              '#GrandReopening #LocalBakery #FreshBaked',
          },
        ],
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: 'Client: TechStart SaaS Launch',
      userId: freelancer.id,
      posts: {
        create: [
          { title: 'Landing page hero copy', status: 'done' },
          { title: 'LinkedIn launch post', status: 'in_progress' },
          { title: 'Product Hunt submission', status: 'todo' },
          { title: 'Founder story blog post', status: 'todo' },
        ],
      },
      outputs: {
        create: [
          {
            type: 'ad',
            prompt: 'LinkedIn sponsored post for B2B SaaS launch',
            content:
              'Stop juggling five tools to manage one project.\n\n' +
              'TechStart unifies task management, docs, and team chat — so your startup ships faster.\n\n' +
              'Join 2,000+ teams on the waitlist. Launch week: 30% off annual plans.',
          },
          {
            type: 'email',
            prompt: 'Waitlist conversion email',
            content:
              'Subject: TechStart is live — your early-bird pricing expires Friday\n\n' +
              'You signed up for early access. Today, TechStart is officially open.\n\n' +
              'As a waitlist member, lock in 30% off your first year before Friday midnight.\n\n' +
              '→ Claim your spot',
          },
        ],
      },
    },
  });

  // demo user chat session
  const demoChatSession = await prisma.chatSession.create({
    data: {
      userId: demoUser.id,
      messages: {
        create: [
          {
            role: 'user',
            content:
              'I need ideas for a summer product launch campaign. Target audience is 25–35 urban professionals.',
          },
          {
            role: 'assistant',
            content:
              'Great target audience! Here are three angles:\n\n' +
              '1. **"Upgrade Your Summer"** — Position products as essentials for work-life balance (commute-friendly, weekend-ready).\n' +
              '2. **Limited drop urgency** — 48-hour early access for email subscribers.\n' +
              '3. **UGC challenge** — #MySummerUpgrade with a branded hashtag.\n\n' +
              'Want me to draft ad copy for any of these?',
          },
          {
            role: 'user',
            content:
              'Yes, draft ad copy for angle 1 — keep it under 100 words.',
          },
          {
            role: 'assistant',
            content:
              'Your 9-to-5 just got a summer upgrade.\n\n' +
              'Lightweight. Professional. Ready for whatever the season throws at you — boardroom to rooftop bar.\n\n' +
              'Shop the Summer Collection. Free returns, always.\n\n' +
              'Want a shorter version for Instagram Stories?',
          },
        ],
      },
    },
  });

  await prisma.chatSession.create({
    data: {
      userId: demoUser.id,
      messages: {
        create: [
          {
            role: 'user',
            content:
              'Help me plan a 5-email holiday sequence for an e-commerce brand.',
          },
          {
            role: 'assistant',
            content:
              "Here's a proven 5-email arc:\n\n" +
              '1. **Teaser** (2 weeks out) — "Something big is coming"\n' +
              '2. **Early access** (1 week out) — VIP preview + code\n' +
              '3. **Launch** (Day 0) — Full sale announcement\n' +
              '4. **Social proof** (Day 3) — Bestsellers + reviews\n' +
              '5. **Last chance** (Final day) — Urgency + cart abandoners\n\n' +
              'Shall I draft Email 1?',
          },
        ],
      },
    },
  });

  // freelancer user chatsession
  await prisma.chatSession.create({
    data: {
      userId: freelancer.id,
      messages: {
        create: [
          {
            role: 'user',
            content:
              'My bakery client is rebranding. How do I announce it without losing their loyal local following?',
          },
          {
            role: 'assistant',
            content:
              'Lead with continuity, not change:\n\n' +
              '- **"Same recipes, fresh look"** — reassure regulars first\n' +
              '- Share a short founder story video (phone quality is fine)\n' +
              '- Offer a "loyalty thank-you" — free item for customers who\'ve been coming 1+ year\n' +
              '- Post behind-the-scenes of the rebrand process to build anticipation\n\n' +
              'Local businesses win on trust. Make the rebrand feel like an evolution, not a takeover.',
          },
        ],
      },
    },
  });

  const counts = {
    users: await prisma.user.count(),
    campaigns: await prisma.campaign.count(),
    posts: await prisma.post.count(),
    aiOutputs: await prisma.aiOutput.count(),
    chatSessions: await prisma.chatSession.count(),
    chatMessages: await prisma.chatMessage.count(),
  };

  console.log('Seed complete!\n');
  console.log('Demo credentials (all users):');
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
  console.log('  demo@smartcontent.test  — 3 campaigns, 2 chat sessions');
  console.log(
    '  sarah@freelance.test    — 2 client campaigns, 1 chat session\n'
  );
  console.log('Records created:', counts);
  console.log(`\nSample campaign ID (Summer Launch): ${summerLaunch.id}`);
  console.log(`Sample chat session ID: ${demoChatSession.id}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
