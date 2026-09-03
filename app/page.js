export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gold font-bold text-xl">B</div>
          <div>
            <div className="font-bold text-xl leading-none">Berit</div>
            <div className="text-gold text-xs">Gestão simples para igrejas</div>
          </div>
        </div>
        <a href="/login" className="bg-transparent border border-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-white/10 transition">Área da Igreja</a>
      </header>

      <section className="bg-gradient-to-br from-navy to-[#2C4A75] text-white text-center px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Encontre uma igreja perto de você</h1>
        <p className="opacity-90 mb-8">Localize igrejas, veja horários de cultos e fale com a igreja pelo WhatsApp.</p>
        <div className="max-w-xl mx-auto flex gap-2 flex-wrap justify-center">
          <input className="flex-1 min-w-[220px] px-4 py-3 rounded-lg text-graphite" placeholder="Cidade, bairro ou nome da igreja..." />
          <button className="bg-gold text-navy font-bold px-6 py-3 rounded-lg">Buscar</button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-navy text-2xl font-bold mb-2">Igrejas em destaque</h2>
        <p className="text-gray2 text-sm mb-6">Em breve: diretório completo de igrejas conectadas ao Berit.</p>
        <div className="bg-white border border-borda rounded-2xl p-10 text-center text-gray2">
          O diretório público será liberado na Fase 2 do projeto.
        </div>
      </section>

      <footer className="bg-navy text-white text-center py-6 text-sm">
        <span className="text-gold font-bold">Berit</span> — Gestão simples para igrejas · Fase 1
      </footer>
    </main>
  );
}
