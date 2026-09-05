'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'

const CAMPOS = [
  { chave: 'nome', rotulo: 'Nome (obrigatório)' },
  { chave: 'email', rotulo: 'E-mail' },
  { chave: 'celular', rotulo: 'Celular' },
  { chave: 'data_nascimento', rotulo: 'Data de nascimento' },
  { chave: 'data_batismo', rotulo: 'Data de batismo' },
  { chave: 'data_recebimento', rotulo: 'Data de recebimento' },
  { chave: 'situacao', rotulo: 'Situação' },
  { chave: 'observacoes', rotulo: 'Observações' },
]

const SUGESTOES = {
  nome: ['nome', 'nomedomembro', 'nomemembro', 'membro', 'nomecompleto', 'nome do membro'],
  email: ['email', 'emailmembro', 'emaildomembro', 'emailprincipal', 'e-mail'],
  celular: ['celular', 'telefone', 'telefonecelular', 'whatsapp', 'cel', 'fone', 'telefone celular'],
  data_nascimento: ['datadenascimento', 'nascimento', 'datanasc', 'nasc', 'data de nascimento'],
  data_batismo: ['datadebatismo', 'batismo', 'databatismo', 'data de batismo'],
  data_recebimento: ['dataderecebimento', 'recebimento', 'datarecebimento', 'data de recebimento'],
  situacao: ['situacao', 'status', 'condicao'],
  observacoes: ['observacoes', 'observacao', 'obs', 'notas'],
}

function normalizar(texto) {
  return (texto || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function sugerirCampo(nomeColuna) {
  const n = normalizar(nomeColuna)
  for (const [campo, sinonimos] of Object.entries(SUGESTOES)) {
    if (sinonimos.some((s) => normalizar(s) === n)) return campo
  }
  return ''
}

function validarEmail(email) {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function converterData(valor) {
  if (!valor) return null
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10)
  if (typeof valor === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(valor)) {
    const [d, m, a] = valor.split('/')
    return `${a}-${m}-${d}`
  }
  if (valor instanceof Date && !isNaN(valor)) return valor.toISOString().slice(0, 10)
  if (typeof valor === 'number' && valor > 20000 && valor < 60000) {
    const data = new Date(Math.round((valor - 25569) * 86400 * 1000))
    return data.toISOString().slice(0, 10)
  }
  return null
}

export default function ImportarMembros() {
  const inputRef = useRef(null)
  const [etapa, setEtapa] = useState('upload')
  const [colunas, setColunas] = useState([])
  const [linhas, setLinhas] = useState([])
  const [mapeamento, setMapeamento] = useState({})
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)
  const [relatorio, setRelatorio] = useState(null)
  const [avisos, setAvisos] = useState([])

  async function aoSelecionarArquivo(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErro('')
    try {
      const reader = new FileReader()
      reader.onload = async (evento) => {
        try {
          const workbook = XLSX.read(evento.target.result, { type: 'array' })
          const primeiraAba = workbook.SheetNames[0]
          const planilha = workbook.Sheets[primeiraAba]
          const dados = XLSX.utils.sheet_to_json(planilha, { defval: '' })
          if (!dados.length) {
            setErro('O arquivo está vazio ou não tem linhas de dados.')
            return
          }
          const nomesColunas = Object.keys(dados[0])
          setColunas(nomesColunas)
          setLinhas(dados)
          const sugestao = {}
          for (const col of nomesColunas) {
            const campo = sugerirCampo(col)
            if (campo) sugestao[col] = campo
          }
          setMapeamento(sugestao)
          setEtapa('mapeamento')
        } catch {
          setErro('Não foi possível ler o arquivo. Use .xlsx, .xls ou .csv.')
        }
      }
      reader.readAsArrayBuffer(arquivo)
    } catch {
      setErro('Não foi possível ler o arquivo.')
    }
  }

  function validarLinhas() {
    const problemas = []
    const linhasValidas = []
    const colParaCampo = {}
    for (const [col, campo] of Object.entries(mapeamento)) {
      if (campo) colParaCampo[col] = campo
    }
    const camposMapeados = Object.values(colParaCampo)
    if (!camposMapeados.includes('nome')) {
      setErro('É obrigatório mapear a coluna que contém o Nome dos membros.')
      return null
    }
    linhas.forEach((linha, idx) => {
      const numeroLinha = idx + 2
      const registro = {}
      for (const [col, campo] of Object.entries(colParaCampo)) {
        registro[campo] = linha[col]
      }
      const nome = (registro.nome || '').toString().trim()
      if (!nome) {
        problemas.push({ linha: numeroLinha, tipo: 'erro', mensagem: 'Nome vazio' })
        return
      }
      if (registro.email && !validarEmail(registro.email.toString().trim())) {
        problemas.push({ linha: numeroLinha, tipo: 'erro', mensagem: `E-mail inválido: ${registro.email}` })
        return
      }
      linhasValidas.push({ linha: numeroLinha, dados: registro })
    })
    return { problemas, linhasValidas }
  }

  function irParaRevisao() {
    const resultado = validarLinhas()
    if (!resultado) return
    setAvisos(resultado.problemas)
    setEtapa('revisao')
  }

  async function executarImportacao(linhasValidas) {
    setProcessando(true)
    setErro('')
    const importados = []
    const ignorados = []
    const { data: existentes } = await supabase.from('membros').select('email')
    const emailsExistentes = new Set((existentes || []).map((m) => (m.email || '').toLowerCase()).filter(Boolean))

    for (const item of linhasValidas) {
      const d = item.dados
      const email = (d.email || '').toString().trim().toLowerCase() || null
      if (email && emailsExistentes.has(email)) {
        ignorados.push({ linha: item.linha, motivo: 'E-mail já cadastrado' })
        continue
      }
      const celular = (d.celular || '').toString().replace(/\D/g, '').slice(0, 11) || null
      const { error } = await supabase.from('membros').insert([{
        nome: (d.nome || '').toString().trim(),
        email,
        celular,
        data_nascimento: converterData(d.data_nascimento),
        data_batismo: converterData(d.data_batismo),
        data_recebimento: converterData(d.data_recebimento),
        situacao: (d.situacao || '').toString().trim() || 'ativo',
        observacoes: (d.observacoes || '').toString().trim() || null,
      }])
      if (error) {
        ignorados.push({ linha: item.linha, motivo: 'Erro ao salvar no banco' })
      } else {
        importados.push(item.linha)
        if (email) emailsExistentes.add(email)
      }
    }
    setProcessando(false)
    setRelatorio({ total: linhasValidas.length, importados: importados.length, ignorados })
    setEtapa('resultado')
  }

  async function confirmarImportacao() {
    const resultado = validarLinhas()
    if (!resultado) return
    if (resultado.problemas.length) {
      setAvisos(resultado.problemas)
      setEtapa('revisao')
      return
    }
    await executarImportacao(resultado.linhasValidas)
  }

  async function importarMesmoAssim() {
    const resultado = validarLinhas()
    if (!resultado) return
    await executarImportacao(resultado.linhasValidas)
  }

  const estilo = {
    main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
    header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    link: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
    botaoVoltar: { background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' },
    card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' },
    campo: { width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' },
    botaoPrimario: { padding: '12px 20px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
    botaoSecundario: { padding: '12px 20px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <a href="/area" style={estilo.link}>Berit</a>
        <a href="/membros" style={estilo.botaoVoltar}>Voltar</a>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Importar dados</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Traga os membros de outra plataforma ou planilha. O Berit aproveita apenas os campos que ele usa — o restante é ignorado.
        </p>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        {etapa === 'upload' && (
          <div style={estilo.card}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 8 }}>1. Envie o arquivo</div>
            <p style={{ fontSize: 13, color: '#5A5A5A', margin: '0 0 16px' }}>
              Formatos aceitos: <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>. A primeira linha do arquivo deve conter os títulos das colunas.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={aoSelecionarArquivo}
              style={{ fontSize: 14, marginBottom: 8 }}
            />
            <p style={{ fontSize: 12, color: '#8A8A8A', margin: 0 }}>
              Dica: o sistema sugere automaticamente a correspondência das colunas — você confirma no próximo passo.
            </p>
          </div>
        )}

        {etapa === 'mapeamento' && (
          <div>
            <div style={estilo.card}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 8 }}>2. Associe as colunas do arquivo aos campos do Berit</div>
              <p style={{ fontSize: 13, color: '#5A5A5A', margin: '0 0 16px' }}>
                O sistema já sugeriu as correspondências. Ajuste se necessário. Colunas sem correspondência são ignoradas.
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Coluna do arquivo</th>
                      <th style={{ padding: '10px 12px' }}>Campo no Berit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colunas.map((col) => (
                      <tr key={col} style={{ borderTop: '1px solid #F0EAE0' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2E2E2E' }}>{col}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <select
                            value={mapeamento[col] || ''}
                            onChange={(e) => setMapeamento({ ...mapeamento, [col]: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                          >
                            <option value="">— Ignorar —</option>
                            {CAMPOS.map((c) => (
                              <option key={c.chave} value={c.chave}>{c.rotulo}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16 }}>
                <button onClick={irParaRevisao} style={estilo.botaoPrimario}>Validar e continuar</button>
              </div>
            </div>

            <div style={{ ...estilo.card, marginTop: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 8 }}>Pré-visualização (primeiras linhas)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                      {colunas.map((col) => (
                        <th key={col} style={{ padding: '8px 10px' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.slice(0, 3).map((linha, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F0EAE0' }}>
                        {colunas.map((col) => (
                          <td key={col} style={{ padding: '8px 10px', color: '#5A5A5A' }}>
                            {linha[col] !== undefined && linha[col] !== '' ? String(linha[col]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {etapa === 'revisao' && (
          <div>
            <div style={estilo.card}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 8 }}>3. Revisão dos dados</div>
              <p style={{ fontSize: 13, color: '#5A5A5A', margin: '0 0 16px' }}>
                {avisos.length === 0
                  ? 'Nenhum problema encontrado. Pode importar!'
                  : `${avisos.length} linha(s) com problema. Corrija no arquivo e reenvie, ou importe apenas as linhas válidas.`}
              </p>
              {avisos.length > 0 && (
                <div style={{ background: '#FFF8E1', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#5A5A5A' }}>
                  {avisos.map((a, i) => (
                    <div key={i} style={{ marginBottom: i < avisos.length - 1 ? 6 : 0 }}>
                      <strong>Linha {a.linha}:</strong> {a.mensagem}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={confirmarImportacao} disabled={processando} style={estilo.botaoPrimario}>
                  {processando ? 'Importando...' : 'Importar linhas válidas'}
                </button>
                {avisos.length > 0 && (
                  <button onClick={importarMesmoAssim} disabled={processando} style={{ ...estilo.botaoSecundario, border: '1px solid #D9A441' }}>
                    Importar mesmo assim
                  </button>
                )}
                <button onClick={() => setEtapa('mapeamento')} disabled={processando} style={estilo.botaoSecundario}>
                  Voltar ao mapeamento
                </button>
              </div>
            </div>
          </div>
        )}

        {etapa === 'resultado' && relatorio && (
          <div style={estilo.card}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 8 }}>4. Relatório da importação</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', margin: '16px 0' }}>
              <div style={{ background: '#EAF4EE', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#4C8C6E' }}>{relatorio.importados}</div>
                <div style={{ fontSize: 13, color: '#5A5A5A' }}>Importados</div>
              </div>
              <div style={{ background: '#FFF8E1', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#B7791F' }}>{relatorio.ignorados.length}</div>
                <div style={{ fontSize: 13, color: '#5A5A5A' }}>Ignorados</div>
              </div>
              <div style={{ background: '#F5F0E6', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1F3A5F' }}>{relatorio.total}</div>
                <div style={{ fontSize: 13, color: '#5A5A5A' }}>Total de linhas válidas</div>
              </div>
            </div>
            {relatorio.ignorados.length > 0 && (
              <div style={{ background: '#FFF8E1', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#5A5A5A' }}>
                {relatorio.ignorados.map((ig, i) => (
                  <div key={i} style={{ marginBottom: i < relatorio.ignorados.length - 1 ? 6 : 0 }}>
                    <strong>Linha {ig.linha}:</strong> {ig.motivo}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href="/membros" style={estilo.botaoPrimario}>Ver membros</a>
              <button
                onClick={() => { setEtapa('upload'); setColunas([]); setLinhas([]); setMapeamento({}); setRelatorio(null); setAvisos([]); if (inputRef.current) inputRef.current.value = '' }}
                style={estilo.botaoSecundario}
              >
                Importar outro arquivo
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
