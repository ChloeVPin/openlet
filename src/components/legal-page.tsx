import { Logo } from './logo'
import type { LegalDoc } from '../lib/legal'
import { useBackTarget } from '../lib/use-back-target'

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const back = useBackTarget()

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#f6f7fb] px-4 py-10 ">
      <article className="mx-auto max-w-2xl rounded-3xl border border-[#edeff4] bg-white p-6 sm:p-10  ">
        <a href="/" aria-label="Openlet home">
          <Logo markSize={24} className="text-sm" />
        </a>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#303545] ">{doc.title}</h1>
        <p className="mt-1 text-sm text-[#7a82a5]">Last updated {doc.lastUpdated}</p>
        <div className="mt-8 space-y-6">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-sm font-bold text-[#303545] ">{s.heading}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#646f90]">{s.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm">
          <a href={back.href} className="font-bold text-[#4255ff] hover:underline">
            {back.label}
          </a>
        </p>
      </article>
    </div>
  )
}
