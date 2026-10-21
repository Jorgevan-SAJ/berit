'use client'
import { useState } from 'react'
const SECOES = [
  {
    modulo: 'Plano e Período de Teste',
    icone: '⏳',
    itens: [
      { p: 'Como funciona o período de teste?', r: 'Ao criar a conta, a igreja entra em período de teste gratuito por um prazo definido no cadastro (a data de encerramento fica visível nas Configurações da Igreja). Durante esse período, todos os módulos funcionam normalmente.' },
      { p: 'O que é o banner do período de teste no dashboard?', r: 'É o aviso exibido no topo da Área da Igreja. Ele aparece em azul quando o teste ainda tem mais de 1 dia ("X dias restantes"), em âmbar no último dia e em vermelho quando o período já encerrou. Igrejas com plano vitalício não veem o banner.' },
      { p: 'O que acontece quando o período de teste encerra?', r: 'As funções de cadastro e edição ficam bloqueadas: em Membros (novo, editar, inativar, excluir, importar, exportar, autocadastro), em Finanças (novo lançamento, editar, excluir, consolidar, contribuições, renomear abas) e em Agenda (novo evento, editar, excluir). A consulta aos dados continua liberada em todos os módulos, e o banner vermelho orienta a regularização.' },
      { p: 'Quais planos existem no Berit?', r: 'O Berit está organizado em três planos: Básico (gratuito, até 30 membros, com Membros e Perfis de Acesso), Essencial (Básico + Agenda + Multimídia) e Plus (todos os recursos e melhorias futuras). A assinatura é feita pelo próprio aplicativo. Em caso de dúvida sobre qual plano atende a sua igreja, fale com a Equipe Berit.' },
      { p: 'Como regularizar o plano após o término do teste?', r: 'Entre em contato com a Equipe Berit pelo e-mail beritinovacoes@gmail.com. Após a regularização, as funções de cadastro e edição voltam a funcionar normalmente.' },
    ],
  },
  {
    modulo: 'Área da Igreja',
    icone: '🏠',
    itens: [
      { p: 'O que é a Área da Igreja?', r: 'É o painel principal após o login, com acesso restrito a usuários cadastrados e autorizados pela administração. Ela reúne os atalhos para os módulos (Membros, Finanças, Agenda, Multimídia, Perfis de Acesso, Diretório Público) e painéis com aniversariantes, próximos eventos e pedidos de acolhimento.' },
      { p: 'O que são os avisos de pendências que aparecem no topo?', r: 'São avisos automáticos que direcionam para onde agir: vermelho/azul quando há pendências na Central de Auditoria de Finanças, e verde quando há cadastros de autocadastro aguardando confirmação em Membros. Clique no aviso para ir direto ao local.' },
      { p: 'Quem vê os painéis de aniversariantes, eventos e pedidos?', r: 'Os perfis Administrador e Secretaria. O Conselho Fiscal e a Tesouraria não veem os painéis, apenas os atalhos dos módulos (com selo "Somente leitura" quando aplicável).' },
      { p: 'O que é o selo "Somente leitura"?', r: 'Indica que o módulo está em modo consulta para o seu perfil (Tesouraria e Conselho Fiscal em Membros/Agenda; Conselho Fiscal em Finanças). Você pode ver e pesquisar, mas não cadastra nem edita.' },
    ],
  },
  {
    modulo: 'Membros',
    icone: '👥',
    itens: [
      { p: 'Como cadastrar um novo membro?', r: 'Clique em "+ Novo membro" no topo da tela de Membros. Preencha pelo menos nome, sexo e data de nascimento (campos obrigatórios) e salve. Os demais campos (e-mail, celular, endereço, batismo, recebimento, observações) são opcionais e podem ser preenchidos depois.' },
      { p: 'O que significa o selo "Dados incompletos"?', r: 'Indica que o membro está sem sexo ou sem data de nascimento. Esses dois campos são obrigatórios para manter a base saneada. Clique em Editar no membro e complete os dados.' },
      { p: 'Como consultar os dados completos de um membro?', r: 'Clique no botão "Consultar" na linha do membro. Um modal abre com a ficha completa (dados pessoais, endereço, filiação, observações), sem risco de alterar nada. Pelo modal você também pode ir direto para a edição, se o seu perfil tiver permissão.' },
      { p: 'Como inativar um membro?', r: 'Clique em "Inativar" na linha do membro, escolha o motivo (falecimento, abandono, transferência etc.) e confirme. O cadastro é preservado e movido para a pasta Inativos, acessível pelo botão "Inativos".' },
      { p: 'Como excluir um cadastro definitivamente?', r: 'Clique em "Excluir" na linha do membro e confirme. A ação não pode ser desfeita e apaga todos os dados do membro. Prefira a inativação quando houver histórico a preservar.' },
      { p: 'Como importar membros de uma planilha?', r: 'Use o botão "Importar dados" (disponível para Administrador e Secretaria). O sistema aceita arquivos .xlsx, .xls e .csv, mostra uma pré-visualização antes de processar e gera um relatório da importação.' },
      { p: 'Como exportar a lista de membros?', r: 'Clique em "Exportar". O sistema gera um arquivo .xlsx com os membros filtrados na tela, incluindo idade, faixa etária e datas. Disponível para Administrador e Secretaria.' },
      { p: 'O que é o Autocadastro e como funciona a confirmação?', r: 'É o cadastro feito pelo próprio visitante pela página pública da igreja. Ele entra como pendente e aparece para Administrador e Secretaria confirmarem. Quando há cadastros aguardando, um aviso aparece na Área da Igreja, um selo laranja aparece no card Membros e um contador no botão "Autocadastro".' },
      { p: 'O que são as Congregações?', r: 'São unidades da igreja cadastradas para organizar os membros. Membros sem congregação vinculada pertencem à Sede.' },
      { p: 'Como cadastrar uma congregação?', r: 'No módulo Membros, abra a tela Congregações, informe o nome (a observação é opcional) e clique em "+ Adicionar congregação".' },
      { p: 'Como renomear ou excluir uma congregação?', r: 'Na lista de congregações, use "Renomear" para alterar o nome ou "Excluir" para remover. Ao excluir, os membros da congregação voltam automaticamente para a Sede — nenhum cadastro de membro é apagado.' },
      { p: 'Por que não vejo os botões de cadastro e edição?', r: 'Pode ser por dois motivos: (1) seu perfil é de somente leitura (Tesouraria ou Conselho Fiscal, que consultam mas não editam), ou (2) o período de teste da igreja encerrou e as funções de escrita estão bloqueadas até a regularização do plano. A consulta continua liberada nos dois casos.' },
      { p: 'O Conselho Fiscal pode cadastrar ou editar membros?', r: 'Não. O Conselho Fiscal tem acesso somente leitura ao módulo Membros: pode consultar a listagem, usar os filtros e abrir a ficha completa (botão "Consultar"), mas não vê os botões de cadastrar, editar, inativar, excluir, importar ou exportar.' },
    ],
  },
  {
    modulo: 'Finanças e Tesouraria',
    icone: '💰',
    itens: [
      { p: 'Quem pode acessar o módulo financeiro?', r: 'Os perfis Administrador e Tesouraria operam o módulo (lançar, editar, consolidar, conferir). O Conselho Fiscal também acessa Finanças, mas em modo somente leitura: consulta lançamentos, relatórios e auditoria, sem botões de ação. Os demais perfis veem o card Finanças bloqueado na página inicial.' },
      { p: 'Como lançar uma entrada (dízimo ou oferta)?', r: 'Em "Finanças", clique em "+ Novo lançamento" (exclusivo do Tesouraria), escolha Entrada, selecione a categoria (Dízimos, Ofertas etc.) e, para dízimos e ofertas, vincule o membro. O campo descrição não existe para entradas — a categoria, o membro e as observações identificam o lançamento.' },
      { p: 'Como lançar uma saída?', r: 'Escolha Saída, selecione a categoria, informe o valor e a data. A descrição é opcional. Saídas não se vinculam a membros.' },
      { p: 'O que é a Consolidação de período?', r: 'É o fechamento dos lançamentos de um período (diário, semanal, quinzenal ou mensal). Ao consolidar, os lançamentos ficam "travados": não podem mais ser editados ou excluídos diretamente. Use após a contagem da comissão de finanças.' },
      { p: 'O que acontece se eu editar um lançamento consolidado?', r: 'A alteração é aplicada na hora, mas fica aguardando a conferência de outro usuário com perfil financeiro (Administrador confere o que o Tesoureiro alterou, e vice-versa). Ninguém pode conferir a própria alteração.' },
      { p: 'O que é a Central de Auditoria?', r: 'É onde as alterações em lançamentos consolidados aguardam conferência. Administrador e Tesouraria aprovam ou rejeitam as alterações (aprovando, o lançamento ganha a nota permanente "Esse lançamento foi alterado em dd/mm/aaaa"; rejeitando, os valores originais são restaurados automaticamente). O Conselho Fiscal acompanha tudo em somente leitura: vê o comparativo antes/depois e o histórico, sem botões de ação.' },
      { p: 'Como gerar relatórios?', r: 'Clique em "Relatórios" no topo de Finanças. Escolha o período (dia, mês ou período) e o conteúdo (completo em formato extrato, só entradas ou só saídas), e baixe em PDF ou Excel. No relatório do dia há área de assinaturas dos representantes da comissão. O Conselho Fiscal também pode consultar os relatórios, em somente leitura.' },
      { p: 'O que é o relatório de Contribuições?', r: 'Exclusivo do Tesouraria. Mostra o comportamento dos membros em relação às contribuições no ano: meses com contribuição, total e classificação automática — Não Ofertante (0 meses), Ofertante Esporádico (1 a 5), Ofertante Frequente (6 a 8) ou Dizimista (9 a 12).' },
      { p: 'Como ver as observações de um lançamento?', r: 'Clique em "Consultar" na linha do lançamento. O modal mostra todos os dados, incluindo observações, forma de pagamento, membro vinculado e a nota permanente, se houver.' },
      { p: 'Por que não vejo os botões de lançar, editar e consolidar?', r: 'Se seu perfil é o Conselho Fiscal, o módulo é somente leitura por padrão. Se seu perfil é Tesouraria ou Administrador e mesmo assim os botões sumiram, o período de teste da igreja encerrou e as funções de escrita estão bloqueadas até a regularização do plano. Consulta, relatórios e auditoria continuam liberados.' },
      { p: 'O que o Conselho Fiscal pode fazer em Finanças?', r: 'Consultar tudo em modo somente leitura: lançamentos, relatórios e a Central de Auditoria (comparativo antes/depois e histórico). Não pode lançar, editar, consolidar, aprovar ou rejeitar alterações. É o perfil de fiscalização das contas da igreja.' },
    ],
  },
  {
    modulo: 'Perfis de Acesso',
    icone: '🔐',
    itens: [
      { p: 'Quais perfis existem?', r: 'Administrador (governança total), Secretaria (gestão de membros e agenda), Tesouraria (operação de finanças), Conselho Fiscal (consulta de todos os módulos em somente leitura, para fiscalização) e Multimídia (equipe de mídia da igreja, responsável por avisar os fiéis). O acesso é controlado por perfil em cada módulo.' },
      { p: 'Como funciona o perfil Conselho Fiscal?', r: 'É o perfil de fiscalização: enxerga todos os módulos (Membros, Finanças e Agenda), mas apenas para consulta. Não cadastra, edita, inativa, exclui, importa, lança, consolida ou confere alterações. Ideal para a fiscalização estatutária das contas da igreja.' },
      { p: 'Como criar um usuário?', r: 'Em "Perfis de Acesso" (exclusivo do Administrador), informe o e-mail e o perfil. O usuário recebe um e-mail de confirmação e, depois de confirmar, define a própria senha pelo link "Esqueci minha senha" na tela de login. Ninguém vê a senha de outro usuário.' },
      { p: 'Como inativar ou excluir um usuário?', r: 'Na lista de usuários, use "Inativar" (temporário, preserva o cadastro) ou "Excluir" (definitivo). Você não pode inativar, excluir ou alterar o próprio perfil.' },
      { p: 'O que é a chave de recuperação de administrador?', r: 'É uma frase secreta criada pela própria igreja e guardada fora do sistema. Se nenhum administrador acessar por 90 dias, ela permite recuperar o acesso de emergência. Ela é exibida apenas uma vez.' },
      { p: 'Por que não consigo alterar meu próprio perfil?', r: 'Por segurança (segregação de funções), o Administrador não pode rebaixar o próprio perfil — por exemplo, para Tesouraria. A trava existe na interface e no banco de dados.' },
    ],
  },
  {
    modulo: 'Configurações da Igreja',
    icone: '⚙️',
    itens: [
      { p: 'O que é a página Configurações da Igreja?', r: 'Reúne os dados cadastrais e os canais de contato da igreja: nome, CNPJ, contato, redes sociais, dados públicos (cidade, UF, endereço, bairro), horários de cultos, mensagem de acolhimento e chave Pix. O acesso é exclusivo do perfil Administrador, pelo botão "Configurações da Igreja" no cabeçalho da Área da Igreja.' },
      { p: 'Onde aparecem o nome e o CNPJ da igreja?', r: 'Assim que você salva, o nome passa a aparecer na saudação da Área da Igreja e o CNPJ logo abaixo, formatado (00.000.000/0000-00), para conferência rápida sem reabrir a tela de edição.' },
      { p: 'Por que minha igreja já aparece marcada no Diretório P
