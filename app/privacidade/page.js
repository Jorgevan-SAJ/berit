// app/privacidade/page.js
import Link from 'next/link'

import PoliticaPrivacidadeTexto from '@/components/PoliticaPrivacidadeTexto'
import {
  VERSAO,
  ATUALIZADO_EM,
  EMAIL_PRIVACIDADE,
} from '@/lib/politicaPrivacidade'

export const metadata = {
  title: 'Política de Privacidade | Berit',
  description:
    'Como o Berit trata os dados pessoais da igreja e de seus membros, em conformidade com a LGPD.',
  alternates: { canonical: '/privacidade' },
  robots: { index: true, follow: true },
}

export const dynamic = 'force-static'

export default function PoliticaDePrivacidade() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <header className="border-b border-slate-200 pb-8">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-slate-600"
          >
            Berit
          </Link>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            Política de Privacidade e Proteção de Dados
          </h1>

          <p className="mt-2 text-base text-slate-600">
            Plataforma Berit, gestão simples para igrejas
          </p>

          <p className="mt-5 text-sm text-slate-500">
            Versão {VERSAO}, em vigor a partir de {ATUALIZADO_EM}
          </p>
        </header>

        <p className="mt-8 text-[15px] leading-7 text-slate-700">
          Esta Política de Privacidade descreve como os dados pessoais tratados na
          plataforma Berit são coletados, utilizados, armazenados, compartilhados e
          protegidos, em conformidade com a Lei nº 13.709/2018, Lei Geral de Proteção de
          Dados Pessoais (LGPD). Ao utilizar o aplicativo, você declara ter lido e
          compreendido as práticas aqui descritas.
        </p>

        <PoliticaPrivacidadeTexto />

        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-900">
            Canal oficial de privacidade
          </p>
          <p className="mt-2 text-[15px] leading-7 text-slate-700">
            Solicitações relacionadas a dados pessoais devem ser enviadas para{' '}
            <a
              href={`mailto:${EMAIL_PRIVACIDADE}`}
              className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
            >
              {EMAIL_PRIVACIDADE}
            </a>
            .
          </p>
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          Data da última atualização: {ATUALIZADO_EM}.
        </footer>
      </div>
    </main>
  )
}
