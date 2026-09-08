import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

export function formatarDataBR(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
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

export function gerarPDFRelatorio({ titulo, subtitulo, lancamentos, totais, assinaturas, nomeArquivo }) {
  const doc = new jsPDF()
  doc.setFontSize(11)
  doc.setTextColor(31, 58, 95)
  doc.text('Berit — Gestão simples para igrejas', 14, 14)
  doc.setFontSize(18)
  doc.text(titulo, 14, 24)
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.text(subtitulo, 14, 31)

  const temSaldo = lancamentos.some((l) => l.saldoAcumulado !== undefined)
  const head = temSaldo
    ? [['Nº', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Saldo']]
    : [['Nº', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']]

  autoTable(doc, {
    startY: 38,
    head,
    body: lancamentos.map((l) =>
      temSaldo
        ? [l.seq, formatarDataBR(l.data_lancamento), l.descricaoExibida, l.categoriaNome, l.tipo === 'entrada' ? 'Entrada' : 'Saída', formatarMoeda(l.valor), formatarMoeda(l.saldoAcumulado)]
        : [l.seq, formatarDataBR(l.data_lancamento), l.descricaoExibida, l.categoriaNome, l.tipo === 'entrada' ? 'Entrada' : 'Saída', formatarMoeda(l.valor)]
    ),
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [31, 58, 95] },
    alternateRowStyles: { fillColor: [250, 246, 239] },
  })

  let y = doc.lastAutoTable.finalY + 8
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text(`Total de Entradas: ${formatarMoeda(totais.entradas)}`, 14, y)
  doc.text(`Total de Saídas: ${formatarMoeda(totais.saidas)}`, 14, y + 6)
  doc.text(`Saldo do Período: ${formatarMoeda(totais.saldo)}`, 14, y + 12)

  if (assinaturas && assinaturas.length > 0) {
    const sy = y + 30
    doc.setFontSize(10)
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

export function gerarPDFContribuicoes({ ano, membros, nomeArquivo }) {
  const doc = new jsPDF()
  doc.setFontSize(11)
  doc.setTextColor(31, 58, 95)
  doc.text('Berit — Gestão simples para igrejas', 14, 14)
  doc.setFontSize(18)
  doc.text(`Relatório de Contribuições — ${ano}`, 14, 24)
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.text('Tesouraria — comportamento dos membros em relação às contribuições', 14, 31)

  autoTable(doc, {
    startY: 38,
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
