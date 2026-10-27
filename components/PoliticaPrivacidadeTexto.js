// components/PoliticaPrivacidadeTexto.js
import { SECOES } from '@/lib/politicaPrivacidade'

export default function PoliticaPrivacidadeTexto() {
  return (
    <>
      {SECOES.map((secao) => (
        <section key={secao.id} id={secao.id} className="mt-10 scroll-mt-24">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            {secao.titulo}
          </h2>

          {secao.itens.map((item) => (
            <p
              key={item.n}
              className={
                item.nivel === 2
                  ? 'mt-3 pl-5 text-[15px] leading-7 text-slate-700'
                  : 'mt-4 text-[15px] leading-7 text-slate-700'
              }
            >
              <span className="font-semibold text-slate-900">{item.n}</span>{' '}
              {item.texto}
            </p>
          ))}
        </section>
      ))}
    </>
  )
}
