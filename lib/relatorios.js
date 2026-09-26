import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Cores do relatório (PDF)
const VERDE_ENTRADA = [76, 140, 110]   // #4C8C6E
const VERMELHO_SAIDA = [183, 28, 28]   // #B71C1C
const AZUL_SALDO_POS = [31, 58, 95]    // #1F3A5F
const VERMELHO_SALDO_NEG = [142, 0, 0] // #8E0000

export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

// P3 — máscara oficial do CNPJ: 00.000.000/0000-00
export function formatarCNPJ(cnpj) {
  const d = String(cnpj || '').replace(/\D/g, '')
  if (d.length !== 14) return cnpj || ''
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function formatarMoedaComSinal(valor, ehPositivo) {
  return `${ehPositivo ? '+' : '-'} ${formatarMoeda(valor)}`
}

export function formatarDataBR(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

// Cabeçalho institucional padronizado dos PDFs:
// 1) Berit — Gestão Simples para Igrejas — Tesouraria
// 2) Nome da igreja em negrito
// 3) CNPJ
// Retorna a posição Y onde o conteúdo do relatório deve começar.
function desenharCabecalhoInstitucional(doc, nomeIgreja, cnpj) {
  doc.setFontSize(11)
  doc.setTextColor(31, 58, 95)
  doc.text('Berit — Gestão Simples para Igrejas — Tesouraria', 14, 14)

  let y = 20
  if (nomeIgreja) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(30, 30, 30)
    doc.text(nomeIgreja, 14, y)
    doc.setFont('helvetica', 'normal')
    y += 6
  }
  const cnpjFormatado = formatarCNPJ(cnpj)
  if (cnpjFormatado) {
    doc.setFontSize(9)
    doc.setTextColor(90, 90, 90)
    doc.text(`CNPJ: ${cnpjFormatado}`, 14, y)
    y += 6
  }
  return y
}

export function gerarExcelRelatorio(lancamentos, nomeArquivo) {
  const dados = lancamentos.map((l) => ({
    'Nº': l.seq,
    Data: formatarDataBR(l.data_lancamento),
    Descrição: l.descricaoExibida,
    Categoria: l.categoriaNome,
    Tipo: l.tipo === 'entrada' ? 'Entrada' : 'Saída',
    Valor: Number(l.valor),
    'Saldo Acumulado': l.saldoAcumulado !== undefined ? Number(l.saldoAcumulado) : undefined,
  }))
  const ws = XLSX.utils.json_to_sheet(dados)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
  XLSX.writeFile(wb, nomeArquivo)
}

export function gerarPDFRelatorio({ titulo, lancamentos, totais, assinaturas, nomeArquivo, cnpj, nomeIgreja }) {
  const doc = new jsPDF()
  const yBase = desenharCabecalhoInstitucional(doc, nomeIgreja, cnpj)

  // Título do relatório com fonte reduzida e proporcional
  doc.setFontSize(13)
  doc.setTextColor(31, 58, 95)
  doc.text(titulo, 14, yBase + 2)

  const temSaldo = lancamentos.some((l) => l.saldoAcumulado !== undefined)
  const head = temSaldo
    ? [['Nº', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Saldo']]
    : [['Nº', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']]

  autoTable(doc, {
    startY: yBase + 9,
    head,
    body: lancamentos.map((l) =>
      temSaldo
        ? [
            l.seq,
            formatarDataBR(l.data_lancamento),
            l.descricaoExibida,
            l.categoriaNome,
            l.tipo === 'entrada' ? 'Entrada' : 'Saída',
            formatarMoedaComSinal(l.valor, l.tipo === 'entrada'),
            formatarMoedaComSinal(l.saldoAcumulado, l.saldoAcumulado >= 0),
          ]
        : [
            l.seq,
            formatarDataBR(l.data_lancamento),
            l.descricaoExibida,
            l.categoriaNome,
            l.tipo === 'entrada' ? 'Entrada' : 'Saída',
            formatarMoedaComSinal(l.valor, l.tipo === 'entrada'),
          ]
    ),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [31, 58, 95] },
    alternateRowStyles: { fillColor: [250, 246, 239] },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const l = lancamentos[data.row.index]
      if (!l) return
      if (data.column.index === 4 || data.column.index === 5) {
        data.cell.styles.textColor = l.tipo === 'entrada' ? VERDE_ENTRADA : VERMELHO_SAIDA
      }
      if (temSaldo && data.column.index === 6) {
        data.cell.styles.textColor = l.saldoAcumulado >= 0 ? AZUL_SALDO_POS : VERMELHO_SALDO_NEG
      }
    },
  })

  let y = doc.lastAutoTable.finalY + 8
  doc.setFontSize(10)
  doc.setTextColor(VERDE_ENTRADA[0], VERDE_ENTRADA[1], VERDE_ENTRADA[2])
  doc.text(`Total de Entradas: ${formatarMoedaComSinal(totais.entradas, true)}`, 14, y)
  doc.setTextColor(VERMELHO_SAIDA[0], VERMELHO_SAIDA[1], VERMELHO_SAIDA[2])
  doc.text(`Total de Saídas: ${formatarMoedaComSinal(totais.saidas, false)}`, 14, y + 6)
  if (totais.saldo >= 0) {
    doc.setTextColor(AZUL_SALDO_POS[0], AZUL_SALDO_POS[1], AZUL_SALDO_POS[2])
  } else {
    doc.setTextColor(VERMELHO_SALDO_NEG[0], VERMELHO_SALDO_NEG[1], VERMELHO_SALDO_NEG[2])
  }
  doc.text(`Saldo do Período: ${formatarMoedaComSinal(totais.saldo, totais.saldo >= 0)}`, 14, y + 12)

  if (assinaturas && assinaturas.length > 0) {
    const sy = y + 30
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('Assinaturas dos representantes:', 14, sy)
    assinaturas.forEach((a, i) => {
      const x = 14 + i * 62
      doc.line(x, sy + 28, x + 55, sy + 28)
      doc.text(a, x, sy + 34)
    })
  }

  doc.save(nomeArquivo)
}

// ===== Relatório de Contribuições dos Membros =====
export function gerarExcelContribuicoes(membros, nomeArquivo) {
  const dados = membros.map((m) => ({
    Nome: m.nome,
    Idade: m.idade ?? '',
    Situação: m.situacaoLabel,
    'Meses com contribuição': m.meses,
    'Total contribuído (R$)': Number(m.total),
    Classificação: m.classificacaoLabel,
  }))
  const ws = XLSX.utils.json_to_sheet(dados)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Contribuições')
  XLSX.writeFile(wb, nomeArquivo)
}

export function gerarPDFContribuicoes({ ano, membros, nomeArquivo, cnpj, nomeIgreja }) {
  const doc = new jsPDF()
  const yBase = desenharCabecalhoInstitucional(doc, nomeIgreja, cnpj)

  doc.setFontSize(13)
  doc.setTextColor(31, 58, 95)
  doc.text(`Relatório de Contribuições — ${ano}`, 14, yBase + 2)

  autoTable(doc, {
    startY: yBase + 9,
    head: [['Nome', 'Idade', 'Situação', 'Meses', 'Total (R$)', 'Classificação']],
    body: membros.map((m) => [
      m.nome,
      m.idade ?? '—',
      m.situacaoLabel,
      String(m.meses),
      formatarMoeda(m.total),
      m.classificacaoLabel,
    ]),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [31, 58, 95] },
    alternateRowStyles: { fillColor: [250, 246, 239] },
  })

  let y = doc.lastAutoTable.finalY + 8
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text(`Total de membros analisados: ${membros.length}`, 14, y)
  doc.text('Legenda: 0 meses = Não Ofertante · 1 a 5 meses = Esporádico · 6 a 8 meses = Frequente · acima de 8 meses = Dizimista', 14, y + 6)
  doc.save(nomeArquivo)
}
