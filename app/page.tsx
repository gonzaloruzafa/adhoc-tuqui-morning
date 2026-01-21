import { auth, signIn, signOut } from "@/auth"
import Link from 'next/link'
import { redirect } from "next/navigation";
import { getUserConfig } from "@/app/actions";
import { getClient } from "@/lib/supabase/client";
import Image from "next/image"
import { WhatsAppActivation } from "@/components/whatsapp-activation";

export default async function Home() {
  const session = await auth()

  // If logged in, show the Dashboard with "Tuqui Mañana" aesthetic
  if (session?.user) {
    const config = await getUserConfig();
    const isEnabled = config?.enabled ?? true;
    const timeLocal = config?.timeLocal || "07:00";
    const firstName = session.user.name?.split(' ')[0] || 'Viajero';

    const db = getClient();
    const { data: userProfile } = await db
      .from("tuqui_morning_users")
      .select("profile_analysis_status, onboarding_completed")
      .eq("email", session.user.email)
      .single();

    if (userProfile && !userProfile.onboarding_completed) {
      redirect("/onboarding");
    }

    const isAnalyzing = userProfile?.profile_analysis_status === 'analyzing';

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#F8FAFC] to-white flex flex-col items-center px-6 pt-20">
        <header className="w-full max-w-md flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 text-[#7C6CD8] font-bold tracking-widest uppercase text-[10px]">
            <svg className="w-4 h-4 text-[#FF7348] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Tuqui Mañana
          </div>

          <h1 className="text-5xl font-display font-medium text-gray-900 leading-tight">
            Buen día,<br />{firstName}.
          </h1>

          <p className="text-xl text-gray-500 font-light">
            Tu briefing de hoy está listo.
          </p>

          <div className="flex items-center gap-2 pt-4">
            <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-[#7C6CD8]' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-400 font-medium">
              {isEnabled ? `Activo para las ${timeLocal}` : 'Pausado'}
            </span>
          </div>

          {isAnalyzing && (
            <div className="bg-adhoc-violet/10 text-adhoc-violet px-4 py-2 rounded-full text-[10px] font-black animate-pulse flex items-center gap-2 border border-adhoc-violet/20">
              <span className="w-1.5 h-1.5 rounded-full bg-adhoc-violet animate-ping"></span>
              ANALIZANDO PERFIL...
            </div>
          )}
        </header>

        <main className="w-full max-w-md mt-24 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <Link href="/profile" className="flex items-center justify-between w-full p-6 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] hover:bg-white/60 transition-all group shadow-sm hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-adhoc-violet/10 text-adhoc-violet flex items-center justify-center group-hover:bg-adhoc-violet/20 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-lg font-medium text-gray-800">Perfil</span>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link href="/config" className="flex items-center justify-between w-full p-6 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] hover:bg-white/60 transition-all group shadow-sm hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-lg font-medium text-gray-800">Ajustes</span>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>

          <div className="pt-6">
            <WhatsAppActivation userEmail={session.user.email!} />
          </div>

          <form action={async () => {
            "use server"
            await signOut()
          }} className="pt-4">
            <button className="w-full text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors py-3">
              Salir
            </button>
          </form>
        </main>

        <footer className="mt-auto pb-12 opacity-20">
          <div className="relative w-8 h-8">
            <Image src="/adhoc-logo.png" alt="Adhoc" fill className="object-contain grayscale" />
          </div>
        </footer>
      </div>
    );
  }

  // LOGIN / LANDING PAGE (New Design)
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0A0A0A] text-white flex flex-col items-center justify-center selection:bg-adhoc-coral/30">

      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-adhoc-coral/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-adhoc-violet/10 rounded-full blur-[100px] mix-blend-screen"></div>

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center text-center">

        {/* Logo Adhoc */}
        <div className="mb-12 opacity-0 animate-in fade-in duration-1000 slide-in-from-top-4">
          <Image src="/adhoc-logo.png" alt="Adhoc" width={40} height={40} className="mx-auto grayscale invert brightness-200" />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent opacity-0 animate-in fade-in duration-1000 slide-in-from-bottom-4 delay-100 font-display">
            Tuqui de tus<br />mañanas
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
