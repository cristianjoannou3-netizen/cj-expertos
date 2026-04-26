import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">

      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg">CJ</span>
          </div>
          <span className="text-white font-black text-xl tracking-tight">CJ Expertos</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-blue-200 hover:text-white font-semibold text-sm transition-colors px-4 py-2">
            Ingresar
          </Link>
          <Link href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg">
            Registrate gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
          Para carpinteros de aluminio
        </div>

        <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
          Tu taller en{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            el bolsillo
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
          Gestioná obras, hacé seguimiento por etapas
          y cobrá desde el celular. Todo en un solo lugar, sin papeles.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link href="/register"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black text-lg px-8 py-4 rounded-2xl transition-colors shadow-xl shadow-blue-600/30">
            Empezar gratis
          </Link>
          <Link href="/login"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors">
            Ya tengo cuenta
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-4">
          {[
            {
              icon: '📋',
              title: 'Obras organizadas',
              desc: 'Seguí cada obra desde cotización hasta colocación con estados claros.',
            },
            {
              icon: '💰',
              title: 'Control financiero',
              desc: 'Seguí el presupuesto, acopio cobrado y costos de cada obra en tiempo real.',
            },
            {
              icon: '📱',
              title: 'Instalable en el celu',
              desc: 'Funciona como app nativa en Android e iOS. Sin App Store, sin Play Store.',
            },
          ].map((f) => (
            <div key={f.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:bg-white/10 transition-colors">
              <p className="text-3xl mb-3">{f.icon}</p>
              <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-500 text-sm">
        CJ Expertos © {new Date().getFullYear()} · Para carpinteros argentinos
      </footer>
    </div>
  )
}
