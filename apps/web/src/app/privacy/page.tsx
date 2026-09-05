import type { Metadata } from 'next';
import { LegalPage } from '../_components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy - Smart Content Manager',
  description:
    'Privacy Policy for Smart Content Manager, explaining what data we collect, how we use it, and the choices you have.',
};

const sections = [
  {
    heading: '1. Information We Collect',
    paragraphs: [
      'Account information: your name, email address, and password hash when you create an account. Passwords are stored securely using industry-standard hashing and are never stored in plain text.',
      'Content you create: campaign details, posts, generated AI content, chat sessions and messages, and other material you save to the Service.',
      'Usage and technical data: information about how you use the Service, such as device type, browser, IP address, pages visited, and timestamps, collected to operate, protect, and improve the Service.',
    ],
  },
  {
    heading: '2. How We Use Your Information',
    paragraphs: [
      'We use your information to: provide and maintain the Service; authenticate you and secure your account; generate and deliver AI-powered content you request; process and store your campaigns and content; provide customer support; and monitor and improve the Service.',
      'We do not sell your personal information. We do not use your content to train foundational AI models for third parties.',
    ],
  },
  {
    heading: '3. AI-Generated Content and Your Inputs',
    paragraphs: [
      'When you use AI features, the inputs you provide (such as briefs, topics, or campaign details) are transmitted to third-party AI model providers to produce output, as described in our Terms of Service.',
      'We retain AI inputs and outputs on our platform so you can review, edit, and reuse your generated content. Prompts and outputs associated with your account are accessible by you and, where applicable, members of your organization.',
      'Review and delete options: you can delete AI outputs and chat content from within your account at any time. Deletion requests are processed in line with the retention section below.',
    ],
  },
  {
    heading: '4. Data Sharing and Disclosure',
    paragraphs: [
      'We share data only with service providers that help us operate the Service, including hosting infrastructure and AI model providers, under contracts that require them to protect your data.',
      'We may disclose data if required by law, regulation, or legal process, or to protect the rights, property, or safety of our users or the public.',
      'We do not sell your personal information to third parties.',
    ],
  },
  {
    heading: '5. Data Security',
    paragraphs: [
      'We use reasonable administrative, technical, and physical safeguards to protect your data, including encrypted transport (HTTPS), secure password hashing, and access controls on our servers.',
      'While we take measures to protect your information, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    heading: '6. Data Retention',
    paragraphs: [
      'We retain your account data and content for as long as your account is active or as needed to provide the Service. We retain authentication session tokens only for the duration of your session.',
      'You can request deletion of your account and associated data at any time by contacting us. We will delete or anonymize your data within a reasonable period, subject to legal and regulatory retention requirements.',
    ],
  },
  {
    heading: '7. Your Rights and Choices',
    paragraphs: [
      'Depending on your jurisdiction, you may have the right to access, correct, or delete your personal information, and to object to or restrict certain processing. You can update or delete much of your account data directly within the Service.',
      'Email us at support@smartcontentmanager.com to exercise any of these rights or to raise a privacy concern. We will respond within the timeframe required by applicable law.',
    ],
  },
  {
    heading: '8. Cookies and Tracking',
    paragraphs: [
      'We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how the Service is used. Authentication cookies are HttpOnly and used for session management.',
      'You can control cookies through your browser settings. Please note that disabling certain cookies may affect the functionality and security of the Service.',
    ],
  },
  {
    heading: '9. Children\'s Privacy',
    paragraphs: [
      'The Service is not directed to children under the age of 13 (or the applicable age of consent in your jurisdiction), and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it.',
    ],
  },
  {
    heading: '10. International Data Transfers',
    paragraphs: [
      'The Service may store and process data in regions where we and our service providers operate. By using the Service, you consent to the transfer, storage, and processing of your information in these locations.',
    ],
  },
  {
    heading: '11. Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated "Last updated" date. Continued use of the Service after changes take effect constitutes acceptance of the revised policy.',
    ],
  },
  {
    heading: '12. Contact Us',
    paragraphs: [
      'If you have questions or concerns about this Privacy Policy or our data practices, contact us at support@smartcontentmanager.com.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 5, 2026"
      intro="This Privacy Policy explains what information Smart Content Manager collects, how we use and protect it, and the choices you have. By using the Service, you consent to the practices described in this policy."
      sections={sections}
    />
  );
}