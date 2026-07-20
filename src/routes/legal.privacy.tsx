import { createFileRoute } from '@tanstack/react-router'
import { PRIVACY_POLICY } from '../lib/legal'
import { LegalPage } from '../components/legal-page'

export const Route = createFileRoute('/legal/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy Policy | Openlet' },
      {
        name: 'description',
        content: 'Openlet privacy policy. Learn how we collect, use, and protect your data.',
      },
      { property: 'og:title', content: 'Privacy Policy | Openlet' },
      {
        property: 'og:description',
        content: 'Openlet privacy policy. Learn how we collect, use, and protect your data.',
      },
      { name: 'twitter:title', content: 'Privacy Policy | Openlet' },
      {
        name: 'twitter:description',
        content: 'Openlet privacy policy. Learn how we collect, use, and protect your data.',
      },
    ],
  }),
  component: () => <LegalPage doc={PRIVACY_POLICY} />,
})
