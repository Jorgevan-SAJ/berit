// app/privacidade/page.js
import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidade | Berit',
  description:
    'Como o Berit trata os dados pessoais da igreja e de seus membros, em conformidade com a LGPD.',
  alternates: { canonical: '/privacidade' },
  robots: { index: true, follow: true },
}

export const dynamic = 'force-static'

const VERSAO = '1.1'
const ATUALIZADO_EM = '27 de outubro de 2026'
const EMAIL_PRIVACIDADE = 'beritapp.oficial@gmail.com'

const SECOES = [
  {
    id: 'quem-somos',
    titulo: '1. Quem somos e qual é o nosso papel',
    itens: [
      {
        n: '1.1',
        texto:
          'A plataforma Berit é um software de gestão eclesiástica disponibilizado em modelo de assinatura, acessível por aplicativo móvel e por navegador de internet. A plataforma oferece recursos de gestão de membros, tesouraria, conselho fiscal, agenda de eventos, relatórios e materiais multimídia.',
      },
      {
        n: '1.2',
        texto:
          'A igreja ou instituição religiosa que contrata a plataforma é a CONTROLADORA dos dados pessoais. Isso significa que cabe à igreja decidir quais dados são coletados, para quais finalidades são utilizados e por quanto tempo são mantidos, além de atender diretamente as solicitações dos titulares.',
      },
      {
        n: '1.3',
        texto:
          'O Berit atua como OPERADOR dos dados pessoais. Isso significa que o Berit realiza o tratamento exclusivamente conforme as instruções da igreja controladora, dentro das finalidades contratadas, sem utilizar os dados para finalidades próprias.',
      },
      {
        n: '1.4',
        texto:
          'Consequência prática desta divisão: se você é membro, congregado ou colaborador de uma igreja usuária do Berit e deseja exercer algum direito sobre seus dados pessoais, o pedido deve ser dirigido à sua igreja, que é a controladora. O Berit recebe a solicitação pelo canal indicado no item 12, encaminha à administração da igreja e presta apoio técnico para que o atendimento seja realizado.',
      },
      {
        n: '1.5',
        texto:
          'O Berit não vende dados pessoais, não utiliza os dados das igrejas para publicidade e não compartilha informações com terceiros para finalidades comerciais alheias ao serviço contratado.',
      },
    ],
  },

  {
    id: 'aplicacao',
    titulo: '2. A quem esta política se aplica',
    itens: [
      {
        n: '2.1',
        texto:
          'Esta política se aplica às seguintes pessoas: membros e congregados cadastrados no rol da igreja; lideranças e pessoas com perfil de acesso à plataforma, incluindo administradores, tesouraria, secretaria e conselho fiscal; visitantes que consultam o diretório público de congregações; pessoas que aparecem em materiais multimídia enviados pela igreja; e representantes legais da igreja contratante.',
      },
    ],
  },

  {
    id: 'dados',
    titulo: '3. Quais dados pessoais tratamos',
    itens: [
      {
        n: '3.1',
        texto:
          'Dados de cadastro da igreja: nome da instituição, cidade, unidade federativa, endereço, bairro, telefone, endereço de correio eletrônico e informações de identificação do responsável.',
      },
      {
        n: '3.2',
        texto:
          'Dados de membros e congregados: nome completo, data de nascimento, estado civil, endereço, telefones, endereço de correio eletrônico, data de ingresso, situação de membresia, congregação a que pertence e observações registradas pela secretaria da igreja.',
      },
      {
        n: '3.3',
        texto:
          'Dados de liderança e acesso: nome, endereço de correio eletrônico, perfil de permissão e registro das ações realizadas na plataforma, com data e hora.',
      },
      {
        n: '3.4',
        texto:
          'Dados financeiros da igreja: lançamentos de entradas e saídas, plano de contas, formas de pagamento, valores, datas e histórico de conciliação. Quando um lançamento identifica nominalmente a pessoa que contribuiu, esse dado é tratado pela igreja com base nas suas próprias obrigações e políticas.',
      },
      {
        n: '3.5',
        texto:
          'Conteúdo multimídia: arquivos de imagem, áudio, vídeo e documentos enviados pela igreja para divulgação de eventos e materiais. Esses arquivos podem conter a imagem ou a voz de pessoas participantes das atividades da igreja.',
      },
      {
        n: '3.6',
        texto:
          'Dados técnicos e registros de uso: endereço IP, tipo de dispositivo, navegador, data e hora de acesso, páginas consultadas e identificadores de sessão. Esses dados são gerados automaticamente pelo funcionamento do serviço e são utilizados para segurança e estabilidade da plataforma.',
      },
      {
        n: '3.7',
        texto:
          'Dados de assinatura: plano contratado, situação do período de teste, histórico de renovação e identificadores da transação. Os dados de cartão de crédito e de meio de pagamento não são coletados nem armazenados pelo Berit; eles são tratados diretamente pelo Google Play, conforme descrito no item 15.',
      },
    ],
  },

  {
    id: 'sensíveis',
    titulo: '4. Dados sensíveis e dados de crianças e adolescentes',
    itens: [
      {
        n: '4.1',
        texto:
          'O vínculo de uma pessoa com uma igreja revela convicção religiosa, que a LGPD classifica como dado pessoal sensível. Esse dado é tratado com proteção reforçada, acesso restrito aos perfis autorizados pela igreja e finalidade limitada à gestão da própria comunidade de fé.',
      },
      {
        n: '4.2',
        texto:
          'O tratamento de dados sensíveis depende de consentimento específico e destacado do titular, ou de outra hipótese legal expressamente prevista no artigo 11 da LGPD. A igreja controladora é responsável por obter e registrar esse consentimento quando necessário.',
      },
      {
        n: '4.3',
        texto:
          'O cadastro de crianças e adolescentes pode ocorrer no rol de membros. Nesse caso, o tratamento deve observar o melhor interesse da criança, ser limitado ao necessário para a gestão da igreja e contar com o consentimento de pelo menos um dos pais ou do responsável legal, conforme o artigo 14 da LGPD.',
      },
      {
        n: '4.4',
        texto:
          'A publicação de imagens de crianças e adolescentes em materiais de divulgação depende de autorização específica dos responsáveis legais, obtida pela igreja controladora.',
      },
    ],
  },

  {
    id: 'finalidades',
    titulo: '5. Para que utilizamos os dados pessoais',
    itens: [
      {
        n: '5.1',
        texto:
          'Os dados são tratados para as seguintes finalidades: viabilizar a criação e a autenticação de contas de acesso à plataforma; manter o rol de membros e congregados da igreja; registrar e acompanhar a movimentação financeira da igreja e emitir relatórios consolidados; apoiar o trabalho do conselho fiscal; organizar a agenda de eventos e as escalas de ministérios; armazenar e disponibilizar materiais multimídia dos eventos; enviar notificações relacionadas ao funcionamento do serviço, incluindo avisos de transmissão ao vivo; manter a segurança da plataforma, prevenir fraudes e registrar acessos; cumprir obrigações legais e regulatórias; e atender solicitações de titulares e de autoridades competentes.',
      },
      {
        n: '5.2',
        texto:
          'O envio de comunicações de caráter informativo ou promocional do próprio Berit ocorre apenas com consentimento, e pode ser cancelado a qualquer momento por pedido enviado ao canal indicado no item 18.',
      },
    ],
  },

  {
    id: 'bases-legais',
    titulo: '6. Bases legais utilizadas',
    itens: [
      {
        n: '6.1',
        texto:
          'O tratamento de dados pessoais realizado na plataforma se apoia nas seguintes bases legais previstas na LGPD: execução de contrato e procedimentos preliminares, para viabilizar a prestação do serviço contratado pela igreja; cumprimento de obrigação legal ou regulatória; consentimento do titular, para finalidades específicas, incluindo comunicações informativas e tratamento de dados sensíveis quando aplicável; legítimo interesse do controlador, limitado a finalidades de segurança, prevenção a fraudes e melhoria do serviço; e proteção do crédito, quando aplicável.',
      },
      {
        n: '6.2',
        texto:
          'Quando o tratamento se basear em consentimento, o titular pode revogá-lo a qualquer momento, sem prejuízo da continuidade do serviço nas hipóteses em que outra base legal autorize o tratamento.',
      },
    ],
  },

  {
    id: 'compartilhamento',
    titulo: '7. Com quem compartilhamos os dados',
    itens: [
      {
        n: '7.1',
        texto:
          'O Berit utiliza fornecedores de tecnologia que atuam como operadores ou suboperadores, exclusivamente para viabilizar o funcionamento da plataforma, vinculados a obrigações contratuais de confidencialidade e proteção de dados:',
      },
      {
        n: '7.1.1',
        nivel: 2,
        texto:
          'SUPABASE: serviço de banco de dados, autenticação e armazenamento de arquivos onde os dados da plataforma são mantidos.',
      },
      {
        n: '7.1.2',
        nivel: 2,
        texto:
          'VERCEL: serviço de hospedagem e execução da aplicação, que processa as requisições de acesso.',
      },
      {
        n: '7.1.3',
        nivel: 2,
        texto:
          'BREVO: serviço de envio de mensagens eletrônicas transacionais, utilizado para comunicações operacionais e avisos relacionados à conta.',
      },
      {
        n: '7.1.4',
        nivel: 2,
        texto:
          'GOOGLE PLAY: plataforma de distribuição do aplicativo e processadora das assinaturas e pagamentos realizados dentro do aplicativo.',
      },
      {
        n: '7.2',
        texto:
          'O compartilhamento também pode ocorrer com autoridades públicas ou judiciais, quando houver requisição legal, e com prestadores de serviço jurídico ou contábil do próprio Berit, quando estritamente necessário e sob dever de sigilo.',
      },
      {
        n: '7.3',
        texto:
          'O Berit não compartilha os dados de uma igreja com outras igrejas usuárias da plataforma. O acesso é tecnicamente segregado por igreja.',
      },
    ],
  },

  {
    id: 'transferencia',
    titulo: '8. Transferência internacional de dados',
    itens: [
      {
        n: '8.1',
        texto:
          'Alguns dos fornecedores indicados no item 7 mantêm servidores ou equipes fora do território brasileiro, o que pode caracterizar transferência internacional de dados, nos termos dos artigos 33 e seguintes da LGPD.',
      },
      {
        n: '8.2',
        texto:
          'Essa transferência ocorre apenas para as finalidades descritas nesta política e é amparada por cláusulas contratuais de proteção de dados, por normas corporativas ou por outra hipótese legal admitida pela LGPD.',
      },
    ],
  },

  {
    id: 'retencao',
    titulo: '9. Por quanto tempo mantemos os dados',
    itens: [
      {
        n: '9.1',
        texto:
          'Os dados pessoais são mantidos pelo período necessário ao cumprimento das finalidades para as quais foram coletados, enquanto durar o vínculo contratual entre a igreja e o Berit, e pelos prazos adicionais exigidos por obrigações legais, fiscais ou regulatórias.',
      },
      {
        n: '9.2',
        texto:
          'Materiais multimídia vinculados a eventos são removidos automaticamente na rotina diária seguinte à data do evento. Materiais vinculados a eventos permanentes permanecem disponíveis até que a igreja os remova.',
      },
      {
        n: '9.3',
        texto:
          'Encerrado o contrato, os dados são eliminados ou anonimizados após o prazo necessário para cumprimento de obrigações legais e para o exercício regular de direitos, ressalvadas as hipóteses de guarda obrigatória previstas na LGPD.',
      },
      {
        n: '9.4',
        texto:
          'A igreja controladora pode, a qualquer momento, excluir registros específicos ou encerrar integralmente o cadastro da instituição, hipótese em que os dados vinculados são eliminados de forma definitiva.',
      },
    ],
  },

  {
    id: 'seguranca',
    titulo: '10. Como protegemos os dados',
    itens: [
      {
        n: '10.1',
        texto:
          'A plataforma adota medidas técnicas e administrativas para proteger os dados pessoais, entre elas: transmissão criptografada por protocolo HTTPS em todas as comunicações; isolamento lógico dos dados por igreja, com regras de acesso aplicadas diretamente no banco de dados; autenticação individual por conta de usuário, com perfis de permissão definidos pela própria igreja; restrição de acesso administrativo ao mínimo necessário; e registro de ações realizadas na plataforma para fins de auditoria.',
      },
      {
        n: '10.2',
        texto:
          'Nenhum sistema é integralmente imune a incidentes. Caso ocorra incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a igreja controladora e a Autoridade Nacional de Proteção de Dados serão comunicadas nos prazos legais, com a descrição do ocorrido, dos dados afetados e das medidas adotadas.',
      },
    ],
  },

  {
    id: 'direitos',
    titulo: '11. Direitos do titular',
    itens: [
      {
        n: '11.1',
        texto:
          'Nos termos do artigo 18 da LGPD, o titular pode exercer os seguintes direitos: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei; portabilidade, mediante requisição expressa; eliminação dos dados tratados com base em consentimento, ressalvadas as hipóteses de guarda obrigatória; informação sobre as entidades com as quais os dados foram compartilhados; informação sobre a possibilidade de não fornecer consentimento e sobre as consequências dessa negativa; e revogação do consentimento.',
      },
      {
        n: '11.2',
        texto:
          'Como a igreja é a controladora dos dados, os pedidos devem ser dirigidos a ela, que detém a competência para atender, complementar ou recusar fundamentadamente cada solicitação.',
      },
    ],
  },

  {
    id: 'exercer',
    titulo: '12. Como exercer seus direitos',
    itens: [
      {
        n: '12.1',
        texto:
          `O canal oficial para assuntos de privacidade e proteção de dados é o endereço de correio eletrônico ${EMAIL_PRIVACIDADE}. O pedido pode ser enviado pelo próprio titular ou por seu representante legal.`,
      },
      {
        n: '12.2',
        texto:
          'O pedido deve conter a identificação do titular, a descrição objetiva do direito que se pretende exercer e, quando necessário, documentos que comprovem a titularidade ou a representação legal.',
      },
      {
        n: '12.3',
        texto:
          'Ao receber a solicitação, o Berit registra o pedido, encaminha à administração da igreja controladora e presta o apoio técnico necessário para a localização, a correção ou a eliminação dos dados nos sistemas da plataforma.',
      },
      {
        n: '12.4',
        texto:
          'A resposta ao titular é dada pela igreja controladora, nos prazos previstos na LGPD, incluindo o prazo de quinze dias para a declaração clara e completa sobre a confirmação ou o acesso aos dados, previsto no artigo 19 da Lei.',
      },
      {
        n: '12.5',
        texto:
          'Caso o titular não obtenha resposta da igreja, ou entenda que o tratamento viola a legislação, pode apresentar reclamação à Autoridade Nacional de Proteção de Dados.',
      },
    ],
  },

  {
    id: 'cookies',
    titulo: '13. Cookies e armazenamento local',
    itens: [
      {
        n: '13.1',
        texto:
          'O Berit utiliza armazenamento local estritamente necessário para manter a sessão do usuário autenticado, lembrar preferências de interface e viabilizar o funcionamento do aplicativo no dispositivo.',
      },
      {
        n: '13.2',
        texto:
          'Não são utilizados cookies de rastreamento publicitário, nem tecnologias de perfilhamento comportamental para terceiros.',
      },
      {
        n: '13.3',
        texto:
          'O bloqueio do armazenamento local pelo navegador pode impedir a autenticação e o uso de funcionalidades essenciais da plataforma.',
      },
    ],
  },

  {
    id: 'notificacoes',
    titulo: '14. Notificações push',
    itens: [
      {
        n: '14.1',
        texto:
          'Com autorização do usuário no dispositivo, a plataforma pode enviar notificações relacionadas ao funcionamento do serviço, como avisos de eventos, comunicados da igreja e alertas de transmissão ao vivo.',
      },
      {
        n: '14.2',
        texto:
          'A autorização pode ser revogada a qualquer momento nas configurações do próprio dispositivo, sem prejuízo do acesso à plataforma.',
      },
    ],
  },

  {
    id: 'pagamentos',
    titulo: '15. Assinaturas e pagamentos pelo Google Play',
    itens: [
      {
        n: '15.1',
        texto:
          'As assinaturas dos planos do Berit são comercializadas e processadas por meio do Google Play. As informações de pagamento, como dados de cartão, são tratadas diretamente pelo Google e não trafegam pelos servidores do Berit.',
      },
      {
        n: '15.2',
        texto:
          'O Berit recebe do Google Play apenas as informações necessárias para confirmar a situação da assinatura, como o identificador da transação, o plano adquirido e a data de renovação ou cancelamento.',
      },
      {
        n: '15.3',
        texto:
          'O tratamento de dados realizado pelo Google em razão da distribuição do aplicativo e do processamento de pagamentos é regido pela Política de Privacidade do próprio Google.',
      },
    ],
  },

  {
    id: 'alteracoes',
    titulo: '16. Alterações nesta política',
    itens: [
      {
        n: '16.1',
        texto:
          'Esta política pode ser atualizada para refletir mudanças na legislação, na plataforma ou nas práticas de tratamento de dados.',
      },
      {
        n: '16.2',
        texto:
          'A versão vigente é sempre a publicada nesta página, com indicação de data e número de versão no início do documento.',
      },
      {
        n: '16.3',
        texto:
          'Alterações relevantes que afetem direitos dos titulares serão comunicadas pela própria plataforma, com antecedência razoável, para que o titular possa avaliar a continuidade do uso.',
      },
    ],
  },

  {
    id: 'legislacao',
    titulo: '17. Legislação aplicável',
    itens: [
      {
        n: '17.1',
        texto:
          'Esta política é regida pela legislação brasileira, em especial pela Lei nº 13.709/2018 (LGPD), pelo Marco Civil da Internet (Lei nº 12.965/2014) e pelo Código de Defesa do Consumidor (Lei nº 8.078/1990), quando aplicável.',
      },
      {
        n: '17.2',
        texto:
          'Eventuais controvérsias serão resolvidas no foro do domicílio do titular, quando assim exigir a legislação consumerista.',
      },
    ],
  },

  {
    id: 'contato',
    titulo: '18. Contato',
    itens: [
      {
        n: '18.1',
        texto:
          `O canal oficial para questões relacionadas a esta política ou ao tratamento de dados realizado na plataforma é o endereço de correio eletrônico ${EMAIL_PRIVACIDADE}.`,
      },
      {
        n: '18.2',
        texto:
          'A igreja controladora deve indicar seu encarregado pelo tratamento de dados pessoais, nos termos do artigo 41 da LGPD, e manter essa informação disponível aos titulares.',
      },
      {
        n: '18.3',
        texto:
          'O Berit mantém canal de apoio técnico às igrejas para assuntos de proteção de dados, acessível pelo mesmo endereço de correio eletrônico indicado no item 18.1.',
      },
      {
        n: '18.4',
        texto:
          'O aplicativo disponibiliza a opção Fale Conosco para suporte operacional e dúvidas de uso. Solicitações relacionadas a direitos de titulares e proteção de dados devem ser encaminhadas ao canal oficial indicado no item 18.1, para que sejam registradas e atendidas nos prazos legais.',
      },
    ],
  },
]

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
