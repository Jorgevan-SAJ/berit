'use client'
import { useState } from 'react'
const SECOES = [
  {
    modulo: 'Plano e Período de Teste',
    icone: '⏳',
    itens: [
      { p: 'Como funciona o período de teste?', r: 'Ao criar a conta, a igreja entra em teste gratuito por prazo definido no cadastro. A data de encerramento fica visível nas Configurações da Igreja.' },
      { p: 'O que é o banner no dashboard?', r: 'É o aviso de dias restantes: azul quando há mais de 1 dia, âmbar no último dia e vermelho quando encerrou. Igrejas com plano vitalício não veem o banner.' },
      { p: 'O que acontece quando o teste encerra?', r: 'As funções de cadastro e edição ficam bloqueadas (Membros, Finanças e Agenda), mas a consulta aos dados continua liberada. O banner vermelho orienta a regularização.' },
      { p: 'Quais planos existem?', r: 'Básico (gratuito, até 30 membros, Membros e Perfis de Acesso), Essencial (Básico + Agenda + Multimídia) e Plus (todos os recursos e melhorias futuras). A assinatura é feita pelo aplicativo.' },
      { p: 'Como regularizar o plano?', r: 'Fale com a Equipe Berit pelo e-mail beritinovacoes@gmail.com. Após a regularização, as funções voltam ao normal.' },
    ],
  },
  {
    modulo: 'Área da Igreja',
    icone: '🏠',
    itens: [
      { p: 'O que é a Área da Igreja?', r: 'É o painel principal após o login, com acesso restrito a usuários autorizados. Reúne os atalhos dos módulos (Membros, Finanças, Agenda, Multimídia, Perfis de Acesso) e painéis com aniversariantes, próximos eventos e pedidos de acolhimento.' },
      { p: 'O que são os avisos de pendências?', r: 'Avisos automáticos que direcionam para onde agir: vermelho/azul para pendências na Central de Auditoria e verde para autocadastros aguardando confirmação. Clique no aviso para ir direto ao local.' },
      { p: 'Quem vê os painéis?', r: 'Administrador e Secretaria. Tesouraria e Conselho Fiscal veem apenas os atalhos dos módulos, com selo "Somente leitura" quando aplicável.' },
      { p: 'O que é o selo "Somente leitura"?', r: 'Indica consulta liberada sem cadastro ou edição. Aplica-se a Tesouraria e Conselho Fiscal em Membros/Agenda e ao Conselho Fiscal em Finanças.' },
    ],
  },
  {
    modulo: 'Membros',
    icone: '👥',
    itens: [
      { p: 'Como cadastrar um membro?', r: 'Clique em "+ Novo membro". Preencha nome, sexo e data de nascimento (obrigatórios) e salve. Os demais campos são opcionais e podem ser completados depois.' },
      { p: 'O que significa "Dados incompletos"?', r: 'O membro está sem sexo ou sem data de nascimento. Clique em Editar e complete os campos obrigatórios.' },
      { p: 'Como consultar a ficha completa?', r: 'Clique em "Consultar" na linha do membro. Abre um modal com todos os dados, sem risco de alterar nada.' },
      { p: 'Como inativar um membro?', r: 'Clique em "Inativar", escolha o motivo (falecimento, transferência etc.) e confirme. O cadastro é preservado na pasta Inativos.' },
      { p: 'Como excluir um cadastro?', r: 'Clique em "Excluir" e confirme. A ação não pode ser desfeita. Prefira a inativação quando houver histórico a preservar.' },
      { p: 'Como importar membros?', r: 'Use "Importar dados" (Administrador e Secretaria). Aceita .xlsx, .xls e .csv, mostra pré-visualização e gera relatório da importação.' },
      { p: 'Como exportar a lista?', r: 'Clique em "Exportar". Gera um arquivo .xlsx com os membros filtrados na tela.' },
      { p: 'O que é o Autocadastro?', r: 'Cadastro feito pelo visitante na página pública da igreja. Entra como pendente e é confirmado por Administrador ou Secretaria. Avisos e contadores sinalizam as pendências.' },
      { p: 'O que são Congregações?', r: 'Unidades da igreja para organizar os membros. Membros sem congregação pertencem à Sede.' },
      { p: 'Como cadastrar uma congregação?', r: 'Em Membros, abra a tela Congregações, informe o nome e clique em "+ Adicionar congregação". A observação é opcional.' },
      { p: 'Como renomear ou excluir uma congregação?', r: 'Use "Renomear" ou "Excluir" na lista. Ao excluir, os membros voltam para a Sede — nenhum cadastro é apagado.' },
      { p: 'Por que não vejo os botões de edição?', r: 'Seu perfil é somente leitura (Tesouraria/Conselho Fiscal) ou o período de teste encerrou. A consulta continua liberada.' },
    ],
  },
  {
    modulo: 'Finanças e Tesouraria',
    icone: '💰',
    itens: [
      { p: 'Quem acessa o módulo financeiro?', r: 'Administrador e Tesouraria operam o módulo. O Conselho Fiscal acessa em somente leitura (consulta lançamentos, relatórios e auditoria). Os demais perfis veem o card bloqueado.' },
      { p: 'Como lançar uma entrada?', r: 'Em Finanças, clique em "+ Novo lançamento" (Tesouraria), escolha Entrada, a categoria (Dízimos, Ofertas etc.) e, para dízimos/ofertas, vincule o membro.' },
      { p: 'Como lançar uma saída?', r: 'Escolha Saída, a categoria, o valor e a data. A descrição é opcional e não vincula a membros.' },
      { p: 'O que é a Consolidação de período?', r: 'Fechamento dos lançamentos de um período (diário, semanal, quinzenal ou mensal). Ao consolidar, os lançamentos ficam travados contra edição e exclusão diretas.' },
      { p: 'O que acontece ao editar um lançamento consolidado?', r: 'A alteração é aplicada na hora, mas fica aguardando conferência de outro usuário financeiro (Administrador confere Tesouraria e vice-versa). Ninguém confere a própria alteração.' },
      { p: 'O que é a Central de Auditoria?', r: 'Local onde as alterações em lançamentos consolidados aguardam conferência. Aprovando, o lançamento ganha a nota permanente de alteração; rejeitando, os valores originais são restaurados. O Conselho Fiscal acompanha em somente leitura.' },
      { p: 'Como gerar relatórios?', r: 'Clique em "Relatórios", escolha período (dia, mês ou período) e conteúdo (completo, só entradas ou só saídas), e baixe em PDF ou Excel. No relatório do dia há área de assinaturas da comissão.' },
      { p: 'O que é o relatório de Contribuições?', r: 'Exclusivo do Tesouraria. Mostra os meses com contribuição de cada membro e a classificação: Não Ofertante (0), Esporádico (1 a 5), Frequente (6 a 8) ou Dizimista (9 a 12).' },
      { p: 'Por que não vejo os botões de ação?', r: 'Seu perfil é somente leitura (Conselho Fiscal) ou o período de teste encerrou. Consulta, relatórios e auditoria continuam liberados.' },
    ],
  },
  {
    modulo: 'Perfis de Acesso',
    icone: '🔐',
    itens: [
      { p: 'Quais perfis existem?', r: 'Administrador (governança total), Secretaria (membros e agenda), Tesouraria (operação de finanças), Conselho Fiscal (consulta de tudo, para fiscalização) e Multimídia (equipe de mídia, avisa os fiéis).' },
      { p: 'Como funciona o Conselho Fiscal?', r: 'Perfil de fiscalização: enxerga Membros, Finanças e Agenda apenas para consulta. Não cadastra, edita, lança ou consolida.' },
      { p: 'Como criar um usuário?', r: 'Em "Perfis de Acesso" (exclusivo do Administrador), informe o e-mail e o perfil. O usuário confirma o convite e define a própria senha.' },
      { p: 'Como inativar ou excluir um usuário?', r: 'Use "Inativar" (temporário) ou "Excluir" (definitivo) na lista. Você não pode inativar, excluir ou alterar o próprio perfil.' },
      { p: 'O que é a chave de recuperação?', r: 'Frase secreta criada pela igreja e guardada fora do sistema. Se nenhum administrador acessar por 90 dias, ela permite recuperar o acesso de emergência. É exibida apenas uma vez.' },
    ],
  },
  {
    modulo: 'Configurações da Igreja',
    icone: '⚙️',
    itens: [
      { p: 'O que é essa página?', r: 'Reúne os dados da igreja: nome, CNPJ, contato, redes sociais, dados públicos (cidade, UF, endereço, bairro), horários de cultos, mensagem de acolhimento e chave Pix. Acesso exclusivo do Administrador.' },
      { p: 'O que é o Diretório Público?', r: 'O diretório é a vitrine pública das igrejas no Berit. A opção "Incluir esta igreja no diretório público" já vem marcada por padrão — se não desejar que sua igreja apareça, desmarque. Para publicar, é obrigatório preencher nome, cidade, UF, endereço e bairro.' },
      { p: 'Como funciona a chave Pix?', r: 'Se preenchida, a página pública exibe o botão "Dizimar/Ofertar", que copia a chave para o visitante colar no aplicativo do banco.' },
      { p: 'Como confirmar os dados públicos?', r: 'Preencha os campos obrigatórios e clique em "Confirmar dados públicos". O selo de verificado passa a aparecer no portal.' },
    ],
  },
  {
    modulo: 'Multimídia',
    icone: '🎬',
    itens: [
      { p: 'O que é o módulo Multimídia?', r: 'É o espaço da equipe de mídia da igreja para publicar avisos aos fiéis e organizar a logística dos cultos diretamente pelo Berit.' },
      { p: 'Quem usa o Multimídia?', r: 'O perfil Multimídia e o Administrador. É o canal oficial de comunicação com a comunidade pela plataforma.' },
      { p: 'Como funciona o envio antecipado de material?', r: 'A equipe de mídia envia um link aos participantes do culto. Os participantes acessam o link e enviam, com antecedência, os materiais que serão utilizados durante o culto (vídeos, louvores, playbacks e outros). Assim, a equipe recebe tudo organizado antes da programação.' },
      { p: 'Como funciona o envio de avisos aos fiéis?', r: 'O perfil Multimídia acessa o módulo na Área da Igreja e publica os avisos, que chegam aos fiéis pelo canal do Berit.' },
    ],
  },
]
export default function AjudaPage() {
  const [aberta, setAberta] = useState(null)
  return (
    <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>Berit</a>
        <a href="/area" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>Voltar</a>
      </header>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Central de Ajuda</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>Tire suas dúvidas sobre o Berit, Gestão Eclesiástica.</p>
        {SECOES.map((secao) => {
          const abertaSecao = aberta === secao.modulo
          return (
            <div key={secao.modulo} style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', marginBottom: '0.75rem', overflow: 'hidden' }}>
              <button
                onClick={() => setAberta(abertaSecao ? null : secao.modulo)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#1F3A5F' }}
              >
                <span>{secao.icone} {secao.modulo}</span>
                <span style={{ color: '#8A8A8A', fontSize: 18 }}>{abertaSecao ? '−' : '+'}</span>
              </button>
              {abertaSecao && (
                <div style={{ padding: '0 18px 18px', display: 'grid', gap: '0.5rem' }}>
                  {secao.itens.map((item, i) => (
                    <details key={i} style={{ border: '1px solid #F0EAE0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}>
                      <summary style={{ fontWeight: 600, color: '#2E2E2E', cursor: 'pointer' }}>{item.p}</summary>
                      <p style={{ margin: '8px 0 0', color: '#5A5A5A', lineHeight: 1.6 }}>{item.r}</p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <footer style={{ borderTop: '1px solid #E4DED2', padding: '1.5rem', textAlign: 'center', fontSize: 12, color: '#8A8A8A' }}>
        Berit, Gestão Eclesiástica — Precisa de ajuda? Fale conosco: beritinovacoes@gmail.com
      </footer>
    </main>
  )
}
