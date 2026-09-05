import type { Metadata } from 'next';
import { LegalPage } from '../_components/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service - Smart Content Manager',
  description:
    'Terms of Service for Smart Content Manager, the AI-powered marketing platform for campaigns, content generation, and task management.',
};

const sections = [
  {
    heading: '1. Acceptance of Terms',
    paragraphs: [
      'By creating an account or using the Smart Content Manager platform ("the Service"), you agree to these Terms of Service. If you are using the Service on behalf of a business, you represent that you have the authority to bind that business to these terms.',
    ],
  },
  {
    heading: '2. Description of the Service',
    paragraphs: [
      'Smart Content Manager provides an AI-powered marketing platform that lets you create and manage campaigns, generate content such as ad copy, captions, and emails, organize work on a Kanban board, chat with an AI assistant, and export generated content to PDF.',
      'We may add, change, or remove features of the Service over time. We may also suspend or discontinue any part of the Service with reasonable notice where practicable.',
    ],
  },
  {
    heading: '3. Accounts and Security',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately if you suspect unauthorized access to your account.',
      'You must provide accurate information when registering and keep your account details up to date. You must be at least 18 years old, or the age of majority in your jurisdiction, to use the Service.',
    ],
  },
  {
    heading: '4. User Content',
    paragraphs: [
      'You retain ownership of the content you submit to the Service, including campaign details, posts, and other material. You grant us a limited license to store, process, and display your content solely to operate and improve the Service.',
      'You are solely responsible for the content you submit and for ensuring it does not violate applicable law or the rights of third parties.',
    ],
  },
  {
    heading: '5. AI-Generated Content',
    paragraphs: [
      'The Service uses artificial intelligence to generate content based on the inputs you provide. AI-generated content is created automatically and is provided "as is".',
      'You are responsible for reviewing, editing, and verifying AI-generated content before publishing or using it. We do not guarantee that generated content is accurate, original, or free of errors, and we are not liable for any use you make of it.',
      'You are responsible for ensuring that any content you generate and distribute complies with all applicable laws, including advertising, disclosure, and intellectual property requirements.',
    ],
  },
  {
    heading: '6. Acceptable Use',
    paragraphs: [
      'You agree not to misuse the Service, including: attempting to access it using a method other than the interface we provide, engaging in activity that disrupts or overloads the Service, scraping or harvesting data, or using the Service to generate or distribute illegal, harmful, deceptive, or infringing content.',
      'We may suspend or terminate your access if we determine, in our reasonable judgment, that you have violated these terms or misused the Service.',
    ],
  },
  {
    heading: '7. Third-Party AI Models',
    paragraphs: [
      'AI features are powered by third-party model providers. Content you submit to these features may be processed by those providers to produce output. Our Privacy Policy describes how data is handled, and you consent to this processing by using the AI features.',
    ],
  },
  {
    heading: '8. Fees and Payments',
    paragraphs: [
      'If you subscribe to a paid plan, you agree to pay all fees in accordance with the billing terms presented at the time of purchase. Fees are non-refundable except as required by applicable law or as expressly stated.',
      'We may change fees by giving reasonable advance notice. Continued use of the Service after a fee change takes effect constitutes acceptance of the new fees.',
    ],
  },
  {
    heading: '9. Intellectual Property',
    paragraphs: [
      'The Service, including its software, design, branding, and documentation, is owned by us or our licensors and is protected by intellectual property laws. Except for content you create through the Service, you may not copy, modify, distribute, or create derivative works without our permission.',
    ],
  },
  {
    heading: '10. Disclaimers',
    paragraphs: [
      'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
      'We do not warrant that the Service will be uninterrupted, error-free, or secure. Marketing and content-performance results depend on factors outside our control, and we make no guarantees about outcomes.',
    ],
  },
  {
    heading: '11. Limitation of Liability',
    paragraphs: [
      'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, or goodwill, arising out of or related to your use of the Service.',
      'Our total aggregate liability arising out of or related to the Service shall not exceed the greater of the amount you paid us in the twelve (12) months preceding the claim or one hundred dollars ($100).',
    ],
  },
  {
    heading: '12. Termination',
    paragraphs: [
      'You may stop using the Service and delete your account at any time. We may suspend or terminate your access for violation of these terms, extended inactivity, or as otherwise provided by law.',
      'Upon termination, your right to use the Service ceases. Sections of these terms that by their nature should survive termination, including disclaimers and limitation of liability, will survive.',
    ],
  },
  {
    heading: '13. Governing Law',
    paragraphs: [
      'These terms are governed by the laws of the jurisdiction in which we operate, without regard to conflict-of-law principles. You agree to submit to the exclusive jurisdiction of the courts in that jurisdiction for any disputes arising under these terms.',
    ],
  },
  {
    heading: '14. Changes to These Terms',
    paragraphs: [
      'We may update these terms from time to time. When we make material changes, we will post the updated terms on this page and update the "Last updated" date. Your continued use of the Service after changes take effect constitutes acceptance of the revised terms.',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 5, 2026"
      intro={'These Terms of Service ("Terms") govern your access to and use of Smart Content Manager. By using the Service, you agree to be bound by these terms and our Privacy Policy.'}
      sections={sections}
    />
  );
}