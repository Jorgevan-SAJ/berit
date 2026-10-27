// app/igreja/[slug]/privacidade/page.js
import Link from 'next/link'
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'

import PoliticaPrivacidadeTexto from '../../../../components/PoliticaPrivacidadeTexto'
import {
  VERSAO,
  ATUALIZADO_EM,
  EMAIL_PRIVACIDADE,
} from '../../../../lib/politicaPrivacidade'

export const dynamic = 'force-dynamic'

const buscarIgreja = cache(async (slug) => {
  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY
  const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    chaveServico || chavePublica,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase
    .from('igrejas')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[privacidade] erro ao buscar igreja:', error.message)
    return null
  }

  return data || null
})

function localizacao(igreja) {
  return [igreja.bairro, igreja.cidade, igreja.uf].filter(Boolean).join(', ')
}

function contatoIgreja(igreja) {
  return igreja.contato || igreja.telefone || igreja.email || null
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const igreja = await buscarIgreja(slug)
  if (!igreja) return { title: 'Política de Privacidade | Berit' }

  return {
    title: `Política de Privacidade | ${igreja.nome}`,
    description: `Como a igreja ${igreja.nome} trata dados pessoais, na condição de controladora, e como o Berit atua como operador, em conformidade com a LGPD.`,
    robots: { index: true, follow: true },
  }
}

export default async function PoliticaDaIgreja({ params }) {
  const { slug } = await params
  const igreja = await buscarIgreja(slug)

  if (!igreja) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-xl px-5 py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Berit
          </p>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Igreja não encontrada
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-slate-700">
            Não localizamos nenhuma igreja cadastrada com o endereço{' '}
            <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-sm text-slate-800">
              {slug}
            </span>
            .
          </p>
          <p className="mt-3 text-[15px] leading-7 text-slate-700">
            Confira se o endereço está completo na barra do navegador. Se o problema
            continuar, acesse a política geral do Berit pelo botão abaixo.
          </p>
          <Link
            href="/privacidade"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ver a política de privacidade do Berit
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <header className="border-b border-slate-200 pb-8">
          <Link
            href={`/igreja/${slug}`}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-slate-600"
          >
            {igreja.nome}
          </Link>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            Política de Privacidade e Proteção de Dados
          </h1>

          <p className="mt-2 text-base text-slate-600">
            Versão {VERSAO}, em vigor a partir de {ATUALIZADO_EM}
          </p>
        </header>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Controladora dos dados pessoais
          </p>

          <p className="mt-2 text-base font-semibold text-slate-900">
            {igreja.nome}
          </p>

          {localizacao(igreja) && (
            <p className="mt-1 text-[15px] text-slate-700">{localizacao(igreja)}</p>
          )}

          <dl className="mt-4 space-y-2 text-[15px] text-slate-700">
            {contatoIgreja(igreja) && (
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-slate-900">Contato da igreja:</dt>
                <dd>{contatoIgreja(igreja)}</dd>
              </div>
            )}

            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-slate-900">Canal de privacidade:</dt>
              <dd>
                <a
                  href={`mailto:${EMAIL_PRIVACIDADE}`}
                  className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
                >
                  {EMAIL_PRIVACIDADE}
                </a>
              </dd>
            </div>

            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-slate-900">Operador da plataforma:</dt>
              <dd>Berit, gestão simples para igrejas</dd>
            </div>
          </dl>

          <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">
            Esta igreja é a controladora dos dados pessoais que trata. O Berit atua
            como operador, seguindo as instruções da igreja. Pedidos de titulares são
            recebidos pelo canal de privacidade e encaminhados à administração da igreja.
          </p>
        </div>

        <p className="mt-8 text-[15px] leading-7 text-slate-700">
          Esta Política de Privacidade descreve como os dados pessoais tratados na
          plataforma Berit são coletados, utilizados, armazenados, compartilhados e
          protegidos, em conformidade com a Lei nº 13.709/2018, Lei Geral de Proteção de
          Dados Pessoais (LGPD). Ao utilizar o aplicativo, você declara ter lido e
          compreendido as práticas aqui descritas.
        </p>

        <PoliticaPrivacidadeTexto />

        <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          Data da última atualização: {ATUALIZADO_EM}.
        </footer>
      </div>
    </main>
  )
}
