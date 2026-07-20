import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  head: () => ({
    meta: [
      { title: 'Sign up | Openlet' },
      {
        name: 'description',
        content:
          'Create a free Openlet account with Google. No ads, no paywalls. Access flashcards, practice tests, and spaced repetition.',
      },
      { property: 'og:title', content: 'Sign up | Openlet' },
      {
        property: 'og:description',
        content: 'Create a free Openlet account with Google. Free study tools, no paywall.',
      },
      { name: 'twitter:title', content: 'Sign up | Openlet' },
      {
        name: 'twitter:description',
        content: 'Create a free Openlet account with Google. Free study tools, no paywall.',
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: '/signin' })
  },
  component: () => null,
})
