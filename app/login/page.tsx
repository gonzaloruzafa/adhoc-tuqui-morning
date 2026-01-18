import { signIn } from "@/auth"
import Image from "next/image"

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF8] p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-adhoc-lavender/20 to-transparent -z-10" />

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 p-8 text-center">

                {/* Logo / Icon */}
                <div className="mx-auto w-16 h-16 bg-adhoc-violet/10 rounded-2xl flex items-center justify-center mb-6 text-2xl">
                    ☀️
                </div>

                <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">
                    Tuqui Mañana
                </h1>
                <p className="text-gray-500 mb-8 font-sans">
                    Tu copiloto de la mañana. Preparado para arrancar.
                </p>

                <form
                    action={async () => {
                        "use server"
                        await signIn("google", { redirectTo: "/" })
                    }}
                >
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-adhoc-violet/50 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 group relative overflow-hidden"
                    >
                        <Image
                            src="https://authjs.dev/img/providers/google.svg"
                            alt="Google"
                            width={20}
                            height={20}
                            className="w-5 h-5"
                        />
                        <span>Continuar con Google</span>
                    </button>
                </form>

                <div className="mt-8 text-xs text-gray-400">
                    Adhoc S.A. © {new Date().getFullYear()}
                </div>
            </div>
        </div>
    )
}
