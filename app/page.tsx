import { auth, signOut } from "@/auth"
import Link from 'next/link'
import { getUserConfig } from "@/app/actions";
import Image from "next/image"

export default async function Home() {
  const session = await auth()
  if (!session?.user) return null

  // Fetch config (no cache)
  const config = await getUserConfig();
  const isEnabled = config?.enabled ?? true;
  const timeLocal = config?.timeLocal || "07:00";

  const firstName = session.user.name?.split(' ')[0] || 'Viajero';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-adhoc-lavender/10">
      {/* Premium Header with backdrop blur */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-adhoc-violet/10 blur-md rounded-full"></div>
              <Image src="/adhoc-logo.png" alt="Logo" width={28} height={28} className="relative z-10" />
            </div>
            <span className="font-display font-semibold text-gray-900 text-lg">Tuqui Mañana</span>
          </div>
          <form action={async () => {
            "use server"
            await signOut()
          }}>
            <button className="text-sm font-semibold text-gray-500 hover:text-adhoc-violet transition-colors px-3 py-1.5 rounded-lg hover:bg-adhoc-lavender/10">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome Section - More Warmth */}
        <div className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-adhoc-violet/20 text-adhoc-violet font-semibold text-xs uppercase tracking-wider mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 bg-adhoc-violet rounded-full animate-pulse"></span>
            Beta v1.0
          </div>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl md:text-6xl text-gray-900 mb-4 tracking-tight leading-tight">
            Hola, {firstName}.
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl font-light">
            Tu briefing está programado para las <span className="font-semibold text-adhoc-violet">{timeLocal}</span>
          </p>
        </div>

        {/* Premium Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">

          {/* Status Card - Enhanced */}
          <div className="group relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-adhoc-violet/10 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-adhoc-lavender/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-adhoc-lavender/30 to-adhoc-violet/20 flex items-center justify-center text-adhoc-violet shadow-md shadow-adhoc-violet/10 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {isEnabled && (
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Próximo Briefing</p>
                <h2 className="text-3xl font-display font-semibold text-gray-900 tracking-tight">
                  Mañana, {timeLocal}
                </h2>
              </div>
            </div>
          </div>

          {/* Config Card - Enhanced */}
          <Link href="/config" className="block h-full">
            <div className="group relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-adhoc-violet/20 hover:border-adhoc-violet/50 transition-all duration-300 cursor-pointer h-full hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-adhoc-violet/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-gradient-to-br group-hover:from-adhoc-violet group-hover:to-adhoc-violet/80 group-hover:text-white transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:shadow-adhoc-violet/30 group-hover:scale-110">
                    <svg className="w-6 h-6 transition-transform group-hover:rotate-90 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-adhoc-violet transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Ajustes</p>
                  <h2 className="text-2xl font-display font-semibold text-gray-900 group-hover:text-adhoc-violet transition-colors tracking-tight">
                    Configurar Briefing
                  </h2>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
