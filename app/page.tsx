import { auth, signIn, signOut } from "@/auth"
import Link from 'next/link'
import { getUserConfig } from "@/app/actions";
import Image from "next/image"

export default async function Home() {
  const session = await auth()

  // If logged in, show the Dashboard (previous design but slightly polished or same)
  if (session?.user) {
    const config = await getUserConfig();
    const isEnabled = config?.enabled ?? true;
    const timeLocal = config?.timeLocal || "07:00";
    const firstName = session.user.name?.split(' ')[0] || 'Viajero';

    return (
      <div className="min-h-screen bg-gray-50/50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image src="/adhoc-logo.png" alt="Adhoc" fill className="object-contain" />
              </div>
              <span className="font-medium text-gray-900">Tuqui Morning</span>
            </div>
            <form action={async () => {
              "use server"
              await signOut()
            }}>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Salir
              </button>
            </form>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-2">Hola, {firstName}.</h1>
            <p className="text-gray-500 text-lg">Tu resumen diario está listo para las {timeLocal}.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-8">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className={`flex h-2.5 w-2.5 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Estado</p>
                <p className="text-lg font-medium text-gray-900">{isEnabled ? 'Activo' : 'Pausado'}</p>
              </div>
            </div>

            {/* Config Card */}
            <Link href="/config">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer group">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Configuración</p>
                  <p className="text-lg font-medium text-gray-900 group-hover:text-adhoc-violet transition-colors">Editar Preferencias</p>
                </div>
              </div>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // LOGIN / LANDING PAGE (New Design)
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0A0A0A] text-white flex flex-col items-center justify-center selection:bg-orange-500/30">

      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-orange-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen"></div>

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center text-center">

        {/* Logo Adhoc */}
        <div className="mb-12 opacity-0 animate-in fade-in duration-1000 slide-in-from-top-4">
          <Image src="/adhoc-logo-white.png" alt="Adhoc" width={40} height={40} className="mx-auto opacity-80" />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter leading-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent opacity-0 animate-in fade-in duration-1000 slide-in-from-bottom-4 delay-100">
            Tuqui<br />Morning
          </h1>

          <p className="text-lg text-white/60 font-medium leading-relaxed max-w-[300px] mx-auto opacity-0 animate-in fade-in duration-1000 slide-in-from-bottom-4 delay-300">
            Tu briefing diario de inteligencia artificial, directo a tu <span className="text-white/90 font-semibold">WhatsApp</span> antes de salir.
          </p>
        </div>

        {/* Login Button */}
        <div className="mt-12 w-full opacity-0 animate-in fade-in duration-1000 slide-in-from-bottom-4 delay-500">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/" })
            }}
          >
            <button className="w-full group relative flex items-center justify-center gap-3 bg-white text-black px-6 py-4 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>
          </form>
          <p className="mt-6 text-xs text-white/30 tracking-tight">
            Powered by Adhoc Intelligence
          </p>
        </div>
      </div>
    </div>
  )
}
