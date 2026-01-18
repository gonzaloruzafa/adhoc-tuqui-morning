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
    <div className="min-h-screen bg-gray-50">
      {/* Header Minimalista */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/adhoc-logo.png" alt="Logo" width={24} height={24} className="opacity-80" />
            <span className="font-display font-medium text-gray-900">Tuqui Mañana</span>
          </div>
          <form action={async () => {
            "use server"
            await signOut()
          }}>
            <button className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-500 font-medium text-xs uppercase tracking-wider mb-4 shadow-sm">
            Beta v1.0
          </span>
          <h1 className="font-display font-medium text-4xl text-gray-900 mb-2 tracking-tight">
            Hola, {firstName}.
          </h1>
          <p className="text-gray-500 text-lg">
            Tu briefing está programado para las {timeLocal}.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-adhoc-lavender/20 flex items-center justify-center text-adhoc-violet">
                {/* Radio Icon */}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.1)]' : 'bg-gray-300'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Próximo</p>
              <h2 className="text-2xl font-display font-medium text-gray-900">
                Mañana, {timeLocal}
              </h2>
            </div>
          </div>

          {/* Config Card */}
          <Link href="/config">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-adhoc-violet/30 transition-all cursor-pointer h-full group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-adhoc-violet group-hover:text-white transition-colors">
                  {/* Cog Icon */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Ajustes</p>
                <h2 className="text-xl font-display font-medium text-gray-900 group-hover:text-adhoc-violet transition-colors">
                  Configurar
                </h2>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
