import { signIn } from "@/auth"
import Image from "next/image"

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col items-center gap-4 p-8">
                    <div className="rounded-full bg-adhoc-lavender/30 p-3">
                        {/* Fallback logo or attempt to use public one */}
                        <div className="h-12 w-12 rounded-full bg-adhoc-violet flex items-center justify-center text-white font-display font-bold text-xl">
                            A
                        </div>
                    </div>

                    <div className="text-center">
                        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">
                            Antigravity
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Tu copiloto de la mañana
                        </p>
                    </div>

                    <form
                        action={async () => {
                            "use server"
                            await signIn("google", { redirectTo: "/" })
                        }}
                        className="w-full"
                    >
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 transition-all active:scale-[0.98]"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continuar con Google
                        </button>
                    </form>
                </div>

                <div className="border-t border-gray-100 bg-gray-50 p-4 text-center text-xs text-gray-500">
                    Adhoc S.A. &copy; {new Date().getFullYear()}
                </div>
            </div>
        </div>
    )
}
