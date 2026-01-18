import { signIn } from "@/auth"
import Image from "next/image"

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-adhoc-lavender/5 to-adhoc-violet/5 relative overflow-hidden">
            {/* Subtle background gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-adhoc-lavender/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-adhoc-violet/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md mx-4 relative z-10">
                {/* Logo with subtle scale animation */}
                <div className="flex justify-center mb-8 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-adhoc-violet/10 blur-2xl rounded-full"></div>
                        <Image
                            src="/adhoc-logo.png"
                            alt="Adhoc"
                            width={88}
                            height={88}
                            className="object-contain relative z-10"
                            priority
                        />
                    </div>
                </div>

                {/* Title Section */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-adhoc-violet/20 text-adhoc-violet font-semibold text-xs uppercase tracking-wider mb-5 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-adhoc-violet rounded-full animate-pulse"></span>
                        Beta Privada
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight font-display mb-3">
                        Tuqui Mañana
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 font-light max-w-sm mx-auto">
                        Tu copiloto de la mañana.<br/>Preparado para arrancar.
                    </p>
                </div>

                {/* Login Card with glassmorphism */}
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-2xl shadow-adhoc-violet/5">
                        <form
                            action={async () => {
                                "use server"
                                await signIn("google", { redirectTo: "/" })
                            }}
                        >
                            <button
                                type="submit"
                                className="w-full group relative flex justify-center items-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 text-base font-medium rounded-2xl text-gray-700 hover:bg-gray-50 hover:border-adhoc-violet hover:shadow-xl hover:shadow-adhoc-violet/10 focus:outline-none focus:ring-4 focus:ring-adhoc-violet/20 transition-all duration-300 shadow-md"
                            >
                                <svg className="h-5 w-5 transition-transform group-hover:scale-110 duration-300" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="font-semibold">Continuar con Google</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-10 text-center space-y-3 animate-in fade-in duration-1000 delay-500">
                    <p className="text-xs text-gray-500">
                        Acceso restringido a usuarios autorizados
                    </p>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                        Powered by Adhoc
                    </div>
                </div>
            </div>
        </div>
    )
}
