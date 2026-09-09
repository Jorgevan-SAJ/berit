'use client'

import { useState } from 'react'

const SECOES = [
  {
    modulo: 'Membros',
    icone: '👥',
    itens: [
      { p: 'Como cadastrar um novo membro?', r: 'Clique em "+ Novo membro" no topo da tela de Membros. Preencha pelo menos nome, sexo e data de nascimento (campos obrigatórios) e salve. Os demais campos (e-mail, celular, endereço, batismo, recebimento, observações) são opcionais e podem ser preenchidos depois.' },
      { p: 'O que significa o selo "Dados incompletos"?', r: 'Indica que o membro está sem sexo ou sem data de nascimento. Esses dois campos são obrigatórios para manter a base saneada. Clique em Editar no membro e complete os dados.' },
      { p: 'Como consultar os dados completos de um membro?', r: 'Clique no botão "Consultar" na linha do membro. Um modal abre com a ficha completa (dados pessoais, endereço, filiação, observações), sem risco de alterar nada. Pelo modal você também pode ir direto para a edição.' },
      { p: 'Como inativar um membro?', r: 'Clique em "Inativar" na linha do membro, escolha o motivo (falecimento, abandono, transferência etc.) e confirme. O cadastro é preservado e movido para a pasta Inativos, acessível pelo botão "Inativos".' },
      { p: 'Como excluir um cadastro definitivamente?', r: 'Clique em "Excluir" na linha do membro e confirme. A ação não pode ser desfeita e apaga todos os dados do membro. Prefira a inativação quando houver histórico a preservar.' },
      { p: 'Como importar membros de uma planilha?', r: 'Use o botão "Importar dados" (disponível para Administrador e Secretaria). O sistema aceita arquivos .xlsx, .xls e .csv, mostra uma pré-visualização antes de processar e gera um relatório da importação.' },
      { p: 'Como exportar a lista de membros?', r: 'Clique em "Exportar". O sistema gera um arquivo .xlsx com os membros filtrados na tela, incluindo idade, faixa etária e datas.' },
    ],
  },
  {
    modulo: 'Finanças e Tesouraria',
    icone: '💰',
    itens: [
      { p: 'Quem pode acessar o módulo financeiro?', r: 'Apenas os perfis Administrador e Tesouraria. Os demais perfis veem o card Finanças bloqueado na página inicial.' },
      { p: 'Como lançar uma entrada (dízimo ou oferta)?', r: 'Em "Finanças", clique em "+ Novo lançamento", escolha Entrada, selecione a categoria (Dízimos, Ofertas etc.) e, para dízimos e ofertas, vincule o membro. O campo descrição não existe para entradas — a categoria, o membro e as observações identificam o lançamento.' },
      { p: 'Como lançar uma saída?', r: 'Escolha Saída, selecione a categoria, informe o valor e a data. A descrição é opcional. Saídas não se vinculam a membros.' },
      { p: 'O que é a Consolidação de período?', r: 'É o fechamento dos lançamentos de um período (diário, semanal, quinzenal ou mensal). Ao consolidar, os lançamentos ficam "travados": não podem mais ser editados ou excluídos diretamente. Use após a contagem da comissão de finanças.' },
      { p: 'O que acontece se eu editar um lançamento consolidado?', r: 'A alteração é aplicada na hora, mas fica aguardando a conferência de outro usuário com perfil financeiro (Administrador confere o que o Tesoureiro alterou, e vice-versa). Ninguém pode conferir a própria alteração.' },
      { p: 'O que é a Central de Auditoria?', r: 'É onde as alterações em lançamentos consolidados aguardam conferência. Aprovando, o lançamento ganha a nota permanente "Esse lançamento foi alterado em dd/mm/aaaa". Rejeitando, os valores originais são restaurados automaticamente.' },
      { p: 'Como gerar relatórios?', r: 'Clique em "Relatórios" no topo de Finanças. Escolha o período (dia, mês ou período) e o conteúdo (completo em formato extrato, só entradas ou só saídas), e baixe em PDF ou Excel. No relatório do dia há área de assinaturas dos representantes da comissão.' },
      { p: 'O que é o relatório de Contribuições?', r: 'Exclusivo do Tesouraria. Mostra o comportamento dos membros em relação às contribuições no ano: meses com contribuição, total e classificação automática — Não Ofertante (0 meses), Ofertante Esporádico (1 a 5), Ofertante Frequente (6 a 8) ou Dizimista (9 a 12).' },
      { p: 'Como ver as observações de um lançamento?', r: 'Clique em "Consultar" na linha do lançamento. O modal mostra todos os dados, incluindo observações, forma de pagamento, membro vinculado e a nota permanente, se houver.' },
    ],
  },
  {
    modulo: 'Perfis de Acesso',
    icone: '🔐',
    itens: [
      { p: 'Quais perfis existem?', r: 'Administrador (governança total), Secretaria (gestão de membros e agenda) e Tesouraria (finanças). O acesso é controlado por perfil em cada módulo.' },
      { p: 'Como criar um usuário?', r: 'Em "Perfis de Acesso" (exclusivo do Administrador), informe o e-mail e o perfil. O usuário recebe um e-mail de confirmação e, depois de confirmar, define a própria senha pelo link "Esqueci minha senha" na tela de login. Ninguém vê a senha de outro usuário.' },
      { p: 'Como inativar ou excluir um usuário?', r: 'Na lista de usuários, use "Inativar" (temporário, preserva o cadastro) ou "Excluir" (definitivo). Você não pode inativar, excluir ou alterar o próprio perfil.' },
      { p: 'O que é a chave de recuperação de administrador?', r: 'É uma frase secreta criada pela própria igreja e guardada fora do sistema. Se nenhum administrador acessar por 90 dias, ela permite recuperar o acesso de emergência. Ela é exibida apenas uma vez.' },
      { p: 'Por que não consigo alterar meu próprio perfil?', r: 'Por segurança (segregação de funções), o Administrador não pode rebaixar o próprio perfil — por exemplo, para Tesouraria. A trava existe na interface e no banco de dados.' },
    ],
  },
  {
    modulo: 'Agenda',
    icone: '📅',
    itens: [
      { p: 'Quem pode criar e gerenciar eventos?', r: 'Apenas Administrador e Secretaria. Todos os usuários logados podem visualizar a agenda.' },
      { p: 'Qual a diferença entre evento permanente e específico?', r: 'Permanente (ou recorrente) repete toda semana — ex.: Culto de Celebração aos domingos. Específico tem data única — ex.: Conferência de Missões em 20/10. No cadastro, escolha o tipo e os campos se adaptam.' },
      { p: 'Eventos com data passada somem?', r: 'Sim. Eventos específicos com data passada saem automaticamente da agenda (pública e administrativa). Eventos permanentes nunca expiram.' },
      { p: 'Como editar ou excluir um evento?', r: 'Clique no evento no calendário ou na lista para abrir o modal de detalhes. Se o seu perfil gerencia a agenda, aparecem os botões Editar e Excluir.' },
    ],
  },
]

function Item({ p, r }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ border: '1px solid #E4DED2', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: aberto ? '#E8F0FA' : '#FFFFFF', border: 'none',
          fontSize: 14, fontWeight: 600, color: '#1F3A5F', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span>{p}</span>
        <span style={{ fontSize: 16, color: '#8A8A8A' }}>{aberto ? '−' : '+'}</span>
      </button>
      {aberto && (
        <div style={{ padding: '12px 16px', fontSize: 13, color: '#5A5A5A', lineHeight: 1.6, background: '#FAF6EF' }}>
          {r}
        </div>
      )}
    </div>
  )
}

export default function AjudaPage() {
  const [busca, setBusca] = useState('')

  const filtradas = SECOES.map((s) => ({
    ...s,
    itens: s.itens.filter(
      (i) =>
        !busca.trim() ||
        i.p.toLowerCase().includes(busca.trim().toLowerCase()) ||
        i.r.toLowerCase().includes(busca.trim().toLowerCase())
    ),
  })).filter((s) => s.itens.length > 0)

  const estilo = {
    main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
    header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    linkLogo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
    botaoVoltar: { background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' },
    card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' },
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <a href="/area" style={estilo.linkLogo}>Berit</a>
        <a href="/area" style={estilo.botaoVoltar}>Voltar</a>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Central de Ajuda</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Tire suas dúvidas sobre cada módulo da plataforma. Clique em uma pergunta para ver a resposta.
        </p>

        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar na ajuda (ex.: consolidar, inativar, evento...)"
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #E4DED2', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', marginBottom: '1.5rem', fontFamily: 'inherit' }}
        />

        {filtradas.length === 0 ? (
          <div style={{ ...estilo.card, textAlign: 'center', fontSize: 14, color: '#8A8A8A' }}>
            Nenhuma pergunta encontrada para "{busca}". Tente outro termo.
          </div>
        ) : (
          filtradas.map((s) => (
            <div key={s.modulo} style={{ ...estilo.card, marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1F3A5F', marginBottom: 4 }}>
                {s.icone} {s.modulo}
              </div>
              <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 12 }}>
                {s.itens.length} pergunta(s)
              </div>
              {s.itens.map((i) => (
                <Item key={i.p} p={i.p} r={i.r} />
              ))}
            </div>
          ))
        )}

        <div style={{ ...estilo.card, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 6 }}>Ainda com dúvidas?</div>
          <p style={{ fontSize: 13, color: '#5A5A5A', margin: '0 0 12px' }}>
            Fale conosco pelo e-mail de suporte e responderemos o mais breve possível.
          </p>
          <a
            href="mailto:beritinovacoes@gmail.com?subject=D%C3%BAvida%20-%20Central%20de%20Ajuda%20Berit"
            style={{ padding: '10px 18px', background: '#1F3A5F', color: '#FFFFFF', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
          >
            ✉️ Fale conosco
          </a>
        </div>
      </div>
    </main>
  )
}
