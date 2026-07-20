/** Legal copy for in-app modals. Keep readable; no em dashes. */

export const TERMS_OF_SERVICE = {
  title: 'Terms of Service',
  lastUpdated: 'July 9, 2026',
  sections: [
    {
      heading: '1. Agreement',
      body: 'By creating an Openlet account or using the service, you agree to these Terms of Service. If you do not agree, do not use Openlet.',
    },
    {
      heading: '2. The service',
      body: 'Openlet is a free, open-source study tool for flashcards and related modes. Features may change. We may add, remove, or modify functionality as the product evolves.',
    },
    {
      heading: '3. Your account',
      body: 'You are responsible for your account credentials and for activity under your account. Provide accurate information when you sign up. You must be old enough to form a binding contract in your region, or use Openlet with a parent or guardian where required.',
    },
    {
      heading: '4. Your content',
      body: 'You keep ownership of study sets and other content you create. You grant Openlet a limited license to host, store, and display that content so the product can work (including sharing links you create). Do not upload content you do not have rights to use.',
    },
    {
      heading: '5. Acceptable use',
      body: 'Do not abuse the service: no malware, scraping that harms availability, harassment, illegal content, or attempts to break security. We may suspend accounts that violate these rules.',
    },
    {
      heading: '6. AI and third-party tools',
      body: 'Optional AI features may send notes you provide to a model provider you choose (for example with your own API key). Those calls follow that provider’s terms. Openlet is not responsible for third-party model output.',
    },
    {
      heading: '7. Disclaimer',
      body: 'Openlet is provided “as is” without warranties of any kind, to the fullest extent allowed by law. Study tools do not replace professional or academic advice.',
    },
    {
      heading: '8. Limitation of liability',
      body: 'To the fullest extent allowed by law, Openlet and its contributors are not liable for indirect, incidental, or consequential damages arising from use of the service.',
    },
    {
      heading: '9. Changes',
      body: 'We may update these terms. Continued use after changes means you accept the updated terms. Material changes will be noted with a new “last updated” date.',
    },
    {
      heading: '10. Contact',
      body: 'Questions about these terms can be raised via the project repository or contact channels listed on the Openlet site.',
    },
  ],
} as const

export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  lastUpdated: 'July 9, 2026',
  sections: [
    {
      heading: '1. Overview',
      body: 'This policy describes how Openlet handles information when you use the product. We aim to collect only what is needed to run accounts and study features.',
    },
    {
      heading: '2. Information we collect',
      body: 'Account data: name and email. Study data: sets, cards, study sessions, and spaced-repetition metadata tied to your account. Technical data: basic logs needed for security and reliability (for example IP-related request logs on the server).',
    },
    {
      heading: '3. How we use information',
      body: 'We use your data to authenticate you, store and show your study content, improve reliability, and prevent abuse. We do not sell your personal information.',
    },
    {
      heading: '4. Cookies and sessions',
      body: 'We use an HTTP-only session cookie to keep you signed in. You can end sessions by signing out.',
    },
    {
      heading: '5. Sharing',
      body: 'We do not sell personal data. Content may be processed by infrastructure providers that host the app and database (for example a cloud Postgres host). If you use optional AI features with your own API key, content you submit goes to that provider under their policy.',
    },
    {
      heading: '6. Public sharing',
      body: 'If you share a set link, people with the link may view that set’s content. Only share sets you are comfortable making accessible.',
    },
    {
      heading: '7. Retention',
      body: 'We keep account and study data while your account is active. You may request deletion of your account and associated data through project contact channels.',
    },
    {
      heading: '8. Security',
      body: 'We hash passwords and use industry-common practices for sessions and transport. No method of transmission or storage is perfectly secure.',
    },
    {
      heading: '9. Children',
      body: 'Openlet is not directed at children under 13 (or the equivalent age in your region). If you believe a child has created an account, contact us so we can remove it.',
    },
    {
      heading: '10. Changes',
      body: 'We may update this policy. The “last updated” date will change when we do. Continued use after updates means you acknowledge the revised policy.',
    },
    {
      heading: '11. Contact',
      body: 'Privacy questions can be raised via the project repository or contact channels listed on the Openlet site.',
    },
  ],
} as const

export type LegalDoc = typeof TERMS_OF_SERVICE | typeof PRIVACY_POLICY
