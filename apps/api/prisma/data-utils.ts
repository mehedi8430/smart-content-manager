// ─── Random Campaign Generator ──────────────────────────────────────────────
type PostStatus = 'todo' | 'in_progress' | 'done';
type OutputType = 'ad' | 'caption' | 'email';
 
export const CAMPAIGN_POOL: Array<{
  name: string;
  description?: string;
  posts: string[];
  outputs: Array<{ type: OutputType; prompt: string; content: string }>;
}> = [
  {
    name: 'Valentine\'s Day Sale',
    description: 'Seasonal campaign targeting gift buyers in early February.',
    posts: [
      'Plan gift-bundle offers',
      'Write couples-focused ad copy',
      'Design Valentine\'s email template',
      'Schedule countdown posts',
      'Create "gift guide" blog post',
    ],
    outputs: [
      {
        type: 'ad',
        prompt: 'Valentine\'s Day Facebook ad for gift bundles',
        content:
          'Love shouldn\'t be last-minute.\n\n' +
          'Shop our Valentine\'s Gift Bundles — curated, beautiful, and shipped in time.\n\n' +
          'Orders placed before Feb 10 arrive by Feb 14. Guaranteed.\n\n' +
          '→ Shop Gift Bundles',
      },
      {
        type: 'email',
        prompt: 'Valentine\'s Day email to subscriber list',
        content:
          'Subject: Your Valentine deserves better than a last-minute gift card\n\n' +
          'Hi there,\n\nValentine\'s Day is 7 days away.\n\n' +
          'We\'ve put together our most-loved gift bundles — each one packaged beautifully and ready to ship today.\n\n' +
          '→ Browse Gift Bundles\n\nFree gift wrap on every order this week.',
      },
    ],
  },
  {
    name: 'App Relaunch Campaign',
    description: 'Coordinated push across all channels for the v2.0 app release.',
    posts: [
      'Write App Store release notes',
      'Create "What\'s New" explainer video script',
      'Draft push notification copy',
      'Design feature comparison infographic',
      'Coordinate press outreach',
    ],
    outputs: [
      {
        type: 'ad',
        prompt: 'Google UAC ad for app relaunch targeting lapsed users',
        content:
          'The app you loved just got a complete overhaul.\n\n' +
          'Faster. Smarter. Rebuilt from the ground up based on your feedback.\n\n' +
          'Update now — it\'s free.\n\n' +
          '★★★★★ "Best update yet" — App Store Review',
      },
      {
        type: 'caption',
        prompt: 'Instagram carousel caption for app v2.0 feature reveal',
        content:
          'We heard every single piece of feedback. And we rebuilt accordingly 🛠️\n\n' +
          'Swipe to see what\'s new in v2.0 — spoiler: it\'s a lot.\n\n' +
          'Update available now on iOS & Android.\n\n' +
          '#AppUpdate #ProductLaunch #v2',
      },
    ],
  },
  {
    name: 'Webinar Promotion Series',
    description: 'Multi-touch campaign driving registrations for a live webinar.',
    posts: [
      'Set up registration landing page',
      'Write 3-email pre-webinar sequence',
      'Create LinkedIn event post',
      'Design reminder graphic for Stories',
      'Prepare post-webinar replay email',
    ],
    outputs: [
      {
        type: 'email',
        prompt: 'Webinar registration invite to email list',
        content:
          'Subject: Free live training: [Topic] — reserve your seat\n\n' +
          'Hi there,\n\n' +
          'We\'re hosting a free 60-minute live training on [Date] and we want you there.\n\n' +
          'You\'ll learn:\n- [Key takeaway 1]\n- [Key takeaway 2]\n- [Key takeaway 3]\n\n' +
          'Spots are limited to 500 attendees.\n\n' +
          '→ Reserve My Seat (Free)',
      },
      {
        type: 'ad',
        prompt: 'LinkedIn ad driving webinar registrations from B2B audience',
        content:
          'Free live training for [role/industry] professionals.\n\n' +
          'Join [Speaker Name] for a practical, no-fluff session on [topic].\n\n' +
          '📅 [Date] | 🕐 [Time] | 💻 Live on Zoom\n\n' +
          '→ Save Your Spot — Free Registration',
      },
    ],
  },
  {
    name: 'Community Building Initiative',
    description: 'Grow and activate an owned community of superfans.',
    posts: [
      'Define community platform (Discord vs Circle)',
      'Write community welcome sequence',
      'Plan weekly community challenges',
      'Recruit 10 founding members',
      'Create community guidelines doc',
    ],
    outputs: [
      {
        type: 'email',
        prompt: 'Community launch invite to top customers',
        content:
          'Subject: You\'re invited to something we\'ve never done before\n\n' +
          'Hi [Name],\n\n' +
          'You\'re one of our most engaged customers and we want to give you something back.\n\n' +
          'We\'re opening a private community — early access to products, direct line to our team, and a group of people who get it.\n\n' +
          'Founding members only. No cost. Ever.\n\n' +
          '→ Join the Community',
      },
      {
        type: 'caption',
        prompt: 'Instagram post teasing the private community launch',
        content:
          'Something we\'ve been building quietly for months is almost ready 👀\n\n' +
          'A private space for our most loyal community. Early drops. Behind-the-scenes. Real conversations.\n\n' +
          'Interest list opens tomorrow. Drop a 🙋 if you want in.\n\n' +
          '#Community #ComingSoon',
      },
    ],
  },
  {
    name: 'SEO Content Blitz',
    description: 'Publish 20 high-intent blog posts in 60 days to capture organic traffic.',
    posts: [
      'Complete keyword research & clustering',
      'Write 5 pillar articles (2,000+ words each)',
      'Publish 15 supporting cluster posts',
      'Build internal linking structure',
      'Submit updated sitemap to Google',
    ],
    outputs: [
      {
        type: 'caption',
        prompt: 'LinkedIn post promoting a new SEO blog article',
        content:
          'New on the blog: The only [topic] guide you\'ll ever need.\n\n' +
          'We analyzed [X data points] and compiled everything into one actionable resource.\n\n' +
          'No fluff. No paywalls. Just the stuff that actually works.\n\n' +
          '→ Link in first comment\n\n' +
          '#ContentMarketing #SEO #[Industry]',
      },
      {
        type: 'email',
        prompt: 'Newsletter sharing a new cornerstone blog post',
        content:
          'Subject: Our most comprehensive guide yet (and it\'s free)\n\n' +
          'Hi there,\n\n' +
          'We just published something we\'re genuinely proud of: [Article Title].\n\n' +
          'It covers [subtopic 1], [subtopic 2], and [subtopic 3] — with real examples, not just theory.\n\n' +
          '→ Read the Full Guide\n\nForward it to anyone who could use it.',
      },
    ],
  },
  {
    name: 'Seasonal Flash Sale',
    description: 'Short-burst 48-hour sale campaign with high urgency messaging.',
    posts: [
      'Select sale products & set discount tiers',
      'Write urgency-focused ad copy',
      'Design countdown timer email',
      'Set up retargeting ads',
      'Post sale-end recap',
    ],
    outputs: [
      {
        type: 'ad',
        prompt: '48-hour flash sale Instagram ad with urgency',
        content:
          '🚨 48-HOUR FLASH SALE 🚨\n\n' +
          'Up to 40% off. No code needed. Ends Sunday at midnight.\n\n' +
          'We do this once a season. When it\'s gone, it\'s gone.\n\n' +
          '→ Shop the Flash Sale',
      },
      {
        type: 'email',
        prompt: 'Flash sale last-chance email (4 hours remaining)',
        content:
          'Subject: ⏰ 4 hours left — flash sale ends at midnight\n\n' +
          'Hey,\n\nTime\'s almost up.\n\n' +
          'Our 48-hour flash sale closes at midnight tonight. Up to 40% off — no code, no fuss.\n\n' +
          'If something\'s been in your cart, now\'s the moment.\n\n' +
          '→ Complete Your Order Before Midnight',
      },
    ],
  },
  {
    name: 'User Onboarding Optimization',
    description: 'Revamp the first-week experience for new users to increase activation.',
    posts: [
      'Map current onboarding flow & drop-off points',
      'Write new welcome email sequence (7 emails)',
      'Design in-app tooltip copy',
      'A/B test onboarding checklist vs guided tour',
      'Measure D7 activation rate improvement',
    ],
    outputs: [
      {
        type: 'email',
        prompt: 'Day 1 welcome email for new SaaS users',
        content:
          'Subject: Welcome! Here\'s your first step (takes 3 minutes)\n\n' +
          'Hi [Name],\n\nWelcome aboard — we\'re glad you\'re here.\n\n' +
          'The fastest way to see value: complete your first [core action] today.\n\n' +
          '→ Get Started in 3 Minutes\n\n' +
          'Reply to this email if you ever need help. We read every message.',
      },
      {
        type: 'email',
        prompt: 'Day 3 check-in email for users who haven\'t completed setup',
        content:
          'Subject: Still getting started? Here\'s a shortcut\n\n' +
          'Hi [Name],\n\nNoticed you haven\'t [completed action] yet — totally normal.\n\n' +
          'Here\'s the quickest path to your first win:\n' +
          '1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\n' +
          'Takes less than 5 minutes.\n\n→ Pick Up Where You Left Off',
      },
    ],
  },
  {
    name: 'Brand Awareness Push Q1',
    description: 'Top-of-funnel campaign targeting cold audiences across Meta and YouTube.',
    posts: [
      'Define ICP & cold audience segments',
      'Write 3 brand story video scripts (15s, 30s, 60s)',
      'Design static ad creatives (5 variants)',
      'Set up Meta & YouTube campaigns',
      'Week 2 creative refresh based on CTR data',
    ],
    outputs: [
      {
        type: 'ad',
        prompt: '15-second YouTube pre-roll brand awareness ad',
        content:
          'Most brands say they care. We built the product that proves it.\n\n' +
          '[Brand] — designed for people who expect more.\n\n' +
          'Skip this ad if you\'re fine with average.',
      },
      {
        type: 'caption',
        prompt: 'Facebook brand awareness carousel caption',
        content:
          'You probably haven\'t heard of us. Yet.\n\n' +
          'But [X] people switched to [Brand] this quarter — without a single paid influencer.\n\n' +
          'Swipe to find out why.\n\n' +
          '#BrandStory #CustomerFirst',
      },
    ],
  },
  {
    name: 'Mother\'s Day Gift Campaign',
    description: 'Emotional, story-driven campaign targeting gift buyers in May.',
    posts: [
      'Curate "Gifts for Mom" product selection',
      'Write emotional long-form email',
      'Create gift guide landing page copy',
      'Design Instagram Stories gift-finder quiz',
      'Schedule last-minute shipping deadline posts',
    ],
    outputs: [
      {
        type: 'email',
        prompt: 'Mother\'s Day emotional brand email',
        content:
          'Subject: For the person who never asks for anything\n\n' +
          'Hi there,\n\nShe never asks for much.\n\n' +
          'Which makes choosing something for her both everything and impossible.\n\n' +
          'We put together our most thoughtful gift picks — the kind she\'ll actually use, not hide in a drawer.\n\n' +
          '→ Shop Mother\'s Day Gifts\n\nFree gift wrap. Free card. Just because.',
      },
      {
        type: 'ad',
        prompt: 'Facebook carousel ad for Mother\'s Day gift guide',
        content:
          'Still searching for the perfect Mother\'s Day gift?\n\n' +
          'Our gift guide takes the guesswork out of it — shop by her style, her hobby, or your budget.\n\n' +
          'Guaranteed delivery by May 11 on orders placed before May 8.\n\n' +
          '→ Find Her Gift',
      },
    ],
  },
  {
    name: 'Affiliate Program Recruitment',
    description: 'Attract content creators and bloggers to join the affiliate program.',
    posts: [
      'Write affiliate program landing page',
      'Create recruiter outreach email template',
      'Build affiliate welcome kit (PDF)',
      'Post affiliate opportunity on social',
      'Track sign-ups Week 1 vs target',
    ],
    outputs: [
      {
        type: 'email',
        prompt: 'Affiliate recruitment cold email to bloggers and creators',
        content:
          'Subject: Earn 20% commission on every sale — want in?\n\n' +
          'Hi [Name],\n\n' +
          'Your content is a great fit for our audience and we\'d love to partner.\n\n' +
          'We run an affiliate program with 20% commission, 60-day cookie window, and monthly payouts via PayPal.\n\n' +
          'No minimum traffic requirements. Just a genuine fit with your audience.\n\n' +
          '→ Apply in 2 Minutes',
      },
      {
        type: 'caption',
        prompt: 'Instagram post recruiting affiliates',
        content:
          'Want to earn commission recommending a product you actually use?\n\n' +
          'Our affiliate program is open — 20% per sale, paid monthly, zero gatekeeping.\n\n' +
          'DM us "AFFILIATE" or hit the link in bio to apply.\n\n' +
          '#AffiliateMarketing #CreatorEconomy #PassiveIncome',
      },
    ],
  },
  {
    name: 'Q4 Paid Search Expansion',
    description: 'Scale Google Search campaigns ahead of peak shopping season.',
    posts: [
      'Audit existing keyword portfolio',
      'Add 200+ long-tail keywords',
      'Write 5 new Responsive Search Ad sets',
      'Increase budgets on top ROAS campaigns',
      'Set up shopping campaigns for top SKUs',
    ],
    outputs: [
      {
        type: 'ad',
        prompt: 'Google Responsive Search Ad for high-intent buyer keywords',
        content:
          '[Product] — Trusted by 50,000+ Customers\n' +
          'Free Shipping Over $35 | Free Returns Always\n' +
          'Shop [Product] Today — Award-Winning Quality\n\n' +
          '[Brand].com | Order by 3PM for Same-Day Dispatch',
      },
      {
        type: 'email',
        prompt: 'Internal team update on Q4 paid search strategy',
        content:
          'Subject: Q4 Paid Search Plan — Action Items & Budgets\n\n' +
          'Team,\n\nWith Q4 starting in 3 weeks, here\'s our paid search plan:\n\n' +
          '- Budget: increasing by 40% vs Q3\n' +
          '- Focus: high-intent branded + competitor keywords\n' +
          '- New: Shopping campaigns for top 20 SKUs\n' +
          '- Target ROAS: 4.5x\n\n' +
          'Please review the keyword list in the shared doc and flag any gaps by Friday.',
      },
    ],
  },
  {
    name: 'Micro-SaaS Feature Launch',
    description: 'Announce and drive adoption of a major new product feature.',
    posts: [
      'Write in-app announcement banner copy',
      'Create "What\'s New" changelog post',
      'Draft feature explainer email',
      'Record 90-second demo video script',
      'Publish feature on roadmap & update docs',
    ],
    outputs: [
      {
        type: 'email',
        prompt: 'Feature launch email to existing users',
        content:
          'Subject: New: [Feature Name] is now live in your account\n\n' +
          'Hi [Name],\n\n' +
          'We just shipped something you asked for.\n\n' +
          '[Feature Name] is now live. It lets you [core benefit] without [friction point].\n\n' +
          'To try it: go to [Location in App] and click [CTA].\n\n' +
          '→ Try [Feature Name] Now\n\n' +
          'As always, reply here with feedback. We ship fast.',
      },
      {
        type: 'caption',
        prompt: 'Twitter/X announcement for new SaaS feature',
        content:
          'Just shipped: [Feature Name] 🚀\n\n' +
          'You can now [benefit] directly inside [Product] — no workarounds, no exports.\n\n' +
          'Available to all plans starting today.\n\n' +
          'Thread below on how it works 👇',
      },
    ],
  },
  {
    name: 'Restock Alert Campaign',
    description: 'Re-engage waitlisted customers when sold-out products come back.',
    posts: [
      'Set up back-in-stock email trigger',
      'Write SMS restock alert copy',
      'Create urgency-focused restock ad',
      'Update product pages with "low stock" badges',
    ],
    outputs: [
      {
        type: 'email',
        prompt: 'Back-in-stock notification email to waitlist',
        content:
          'Subject: [Product] is back — but not for long\n\n' +
          'Hi [Name],\n\n' +
          'You asked us to let you know. So here we are.\n\n' +
          '[Product] is back in stock — we have limited units and they will sell out.\n\n' +
          '→ Grab Yours Now\n\n' +
          'No code needed. Just move fast.',
      },
      {
        type: 'ad',
        prompt: 'Instagram ad announcing product restock',
        content:
          'IT\'S BACK. 👀\n\n' +
          '[Product] sold out in 48 hours last time.\n\n' +
          'We restocked. Limited quantities. First come, first served.\n\n' +
          '→ Shop Now — Link in Bio',
      },
    ],
  },
  {
    name: 'Case Study Content Series',
    description: 'Turn customer success stories into multi-format content assets.',
    posts: [
      'Interview 5 customers for case studies',
      'Write 3 long-form case study pages',
      'Create LinkedIn carousel from each case study',
      'Clip video testimonials for YouTube Shorts',
      'Add case studies to sales deck',
    ],
    outputs: [
      {
        type: 'caption',
        prompt: 'LinkedIn carousel caption for customer case study',
        content:
          'How [Customer] went from [before state] to [after state] in 90 days 📈\n\n' +
          '(Without [common objection])\n\n' +
          'Swipe for the full breakdown — including the exact steps they took.\n\n' +
          '#CaseStudy #CustomerSuccess #[Industry]Results',
      },
      {
        type: 'email',
        prompt: 'Cold outreach email using a relevant case study',
        content:
          'Subject: How [Similar Company] achieved [result] — relevant to you?\n\n' +
          'Hi [Name],\n\n' +
          'We recently helped [Customer], a [company type] similar to [Prospect], achieve [specific result] in [timeframe].\n\n' +
          'I thought it might be relevant given what [Prospect] is working on.\n\n' +
          'Worth a 20-minute call to see if we can do the same for you?\n\n' +
          '→ Book a Call',
      },
    ],
  },
  {
    name: 'Event Sponsorship Campaign',
    description: 'Maximize ROI from a sponsored industry conference.',
    posts: [
      'Design booth graphics & banners',
      'Write pre-event LinkedIn posts (5)',
      'Prepare lead capture flow at booth',
      'Draft post-event follow-up email sequence',
      'Compile leads & upload to CRM',
    ],
    outputs: [
      {
        type: 'email',
        prompt: 'Post-event follow-up email to leads met at conference',
        content:
          'Subject: Great meeting you at [Event Name]\n\n' +
          'Hi [Name],\n\n' +
          'It was great connecting at [Event]. Your questions about [topic they asked about] really stuck with me.\n\n' +
          'I wanted to follow up with [relevant resource / case study / demo link] that I think you\'ll find useful.\n\n' +
          'Would you be open to a 20-minute call next week?\n\n' +
          '→ Book a Time That Works',
      },
      {
        type: 'caption',
        prompt: 'Post-event LinkedIn recap post',
        content:
          'Wrapping up [Event Name] and feeling energized 🙌\n\n' +
          '3 things that stuck with me:\n\n' +
          '1. [Insight 1]\n2. [Insight 2]\n3. [Insight 3]\n\n' +
          'If we connected at the booth — expect an email from me this week.\n\n' +
          'If we didn\'t — let\'s fix that. DM me.\n\n' +
          '#[EventHashtag] #[Industry] #Networking',
      },
    ],
  },
  {
    name: 'Free Tool Launch Campaign',
    description: 'Drive top-of-funnel leads by launching a free interactive tool.',
    posts: [
      'Build free tool (calculator / quiz / generator)',
      'Write tool landing page & meta description',
      'Create Product Hunt listing',
      'Plan 10-day social drip promoting tool',
      'Set up email capture + nurture sequence',
    ],
    outputs: [
      {
        type: 'ad',
        prompt: 'Facebook Lead Ad promoting a free marketing tool',
        content:
          'Stop guessing. Start knowing.\n\n' +
          'Our free [Tool Name] tells you [key insight] in under 2 minutes.\n\n' +
          'No signup required. Just results.\n\n' +
          '→ Try the Free Tool',
      },
      {
        type: 'email',
        prompt: 'Email to list announcing the new free tool',
        content:
          'Subject: We built something free for you — try it in 2 minutes\n\n' +
          'Hi there,\n\n' +
          'We spent [X] building this and we\'re giving it away free.\n\n' +
          '[Tool Name] helps you [core benefit]. No account needed. Just open and go.\n\n' +
          '→ Try [Tool Name] Free\n\n' +
          'Took us months. Takes you 2 minutes. Let us know what you think.',
      },
    ],
  },
];
 
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
 
export function pickMany<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
 
export function randomStatus(): PostStatus {
  return pick(['todo', 'in_progress', 'done'] as PostStatus[]);
}