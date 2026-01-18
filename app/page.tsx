import { auth, signOut } from "@/auth"
import Link from 'next/link'

export default async function Home() {
  const session = await auth()

  if (!session?.user) return null // Logic in middleware handles redirect

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-adhoc-violet flex items-center justify-center text-white font-display font-bold">A</div>
            <h1 className="font-display font-bold text-lg text-gray-900">Antigravity</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Hola, </span>
              <span className="font-medium text-gray-900">{session.user.name?.split(' ')[0]}</span>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut()
              }}
            >
              <button className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h2 className="font-display text-3xl font-bold text-gray-900">Buenos días.</h2>
          <p className="mt-2 text-gray-500">Configurá tu resumen matutino para empezar el día con ventaja.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Status Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Próximo Briefing</h3>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Activo</span>
            </div>
            <div className="text-3xl font-display font-bold text-gray-900">07:00 AM</div>
            <p className="text-sm text-gray-500 mt-1">Mañana, vía WhatsApp</p>
          </div>

          {/* Config Card */}
          <Link href="/config">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-adhoc-violet/50 transition-colors cursor-pointer group h-full">
              <div className="h-10 w-10 rounded-lg bg-adhoc-lavender/30 flex items-center justify-center text-adhoc-violet mb-4 group-hover:bg-adhoc-violet group-hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m8-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Configurar Horario</h3>
              <p className="text-sm text-gray-500 mt-1">Elegí cuándo recibir tu audio.</p>
            </div>
          </Link>

          {/* History Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-adhoc-violet/50 transition-colors cursor-pointer group">
            <div className="h-10 w-10 rounded-lg bg-adhoc-lavender/30 flex items-center justify-center text-adhoc-violet mb-4 group-hover:bg-adhoc-violet group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Escuchar Último</h3>
            <p className="text-sm text-gray-500 mt-1">Reproducir briefing de hoy.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
