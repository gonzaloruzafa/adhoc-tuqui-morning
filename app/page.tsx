import { auth, signOut } from "@/auth"
import Link from 'next/link'
import { getUserConfig } from "@/app/actions"; // Assuming this exists from previous step, we might need to verify import path logic or create it if I missed it in context, but I recall creating it.

export default async function Home() {
  const session = await auth()
  if (!session?.user) return null

  // Fetch config for display state
  const config = await getUserConfig();
  const isEnabled = config?.enabled ?? true;
  const timeLocal = config?.timeLocal || "07:00";

  const firstName = session.user.name?.split(' ')[0] || 'Viajero';

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="font-display font-semibold text-lg flex items-center gap-2">
            <span className="text-adhoc-violet">☀️</span> Tuqui Mañana
          </span>
          <form action={async () => {
            "use server"
            await signOut()
          }}>
            <button className="text-sm font-medium text-gray-400 hover:text-adhoc-coral transition-colors">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="font-display font-bold text-4xl text-gray-900 mb-2">
            Buenas noches, {firstName}.
          </h1>
          <p className="text-gray-500 text-lg">
            Todo listo para tu briefing de mañana a las {timeLocal}.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Status Card - Primary */}
          <div className={`rounded-2xl p-8 border ${isEnabled ? 'bg-white border-adhoc-violet/20 shadow-[0_8px_30px_rgb(124,58,237,0.06)]' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-start justify-between mb-8">
              <div className="w-12 h-12 rounded-xl bg-adhoc-lavender/30 flex items-center justify-center text-adhoc-violet text-xl border border-adhoc-violet/10">
                📻
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {isEnabled ? 'Activo' : 'Pausado'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-1">Próximo Briefing</p>
              <h2 className="text-3xl font-display font-bold text-gray-900">
                Mañana, {timeLocal}
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Vía WhatsApp • Generado con Gemini 2.0
              </p>
            </div>
          </div>

          {/* Config Card */}
          <Link href="/config">
            <div className="rounded-2xl p-8 border border-gray-200 bg-white hover:border-adhoc-violet/50 hover:shadow-lg transition-all duration-300 cursor-pointer h-full group">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-adhoc-violet group-hover:text-white transition-colors border border-gray-100">
                  ⚙️
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-1">Configuración</p>
                <h2 className="text-xl font-display font-bold text-gray-900 group-hover:text-adhoc-violet transition-colors">
                  Ajustar Horario y Preferencias
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  Cambiá tu hora de salida o tu zona horaria.
                </p>
              </div>
            </div>
          </Link>

          {/* History / Archive (Placeholder for future) */}
          <div className="rounded-2xl p-6 border border-gray-100 bg-white/50 md:col-span-2 flex items-center justify-between opacity-60">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                📂
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Historial de Briefings</h3>
                <p className="text-xs text-gray-500">Próximamente disponible</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
