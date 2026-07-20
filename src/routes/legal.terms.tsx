import { createFileRoute } from '@tanstack/react-router'
import { TERMS_OF_SERVICE } from '../lib/legal'
import { LegalPage } from '../components/legal-page'

export const Route = createFileRoute('/legal/terms')({
  head: () => ({
    meta: [
      { title: 'Terms of Service | Openlet' },
      {
        name: 'description',
        content:
          'Openlet terms of service. The rules and guidelines for using Openlet study tools.',
      },
      { property: 'og:title', content: 'Terms of Service | Openlet' },
      {
        property: 'og:description',
        content:
          'Openlet terms of service. The rules and guidelines for using Openlet study tools.',
      },
      { name: 'twitter:title', content: 'Terms of Service | Openlet' },
      {
        name: 'twitter:description',
        content:
          'Openlet terms of service. The rules and guidelines for using Openlet study tools.',
      },
    ],
  }),
  component: () => <LegalPage doc={TERMS_OF_SERVICE} />,
})
