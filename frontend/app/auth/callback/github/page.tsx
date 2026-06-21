"use client"
import customToast from "@/components/customToast"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import axios from "axios"
import { Loader2 } from "lucide-react"

export default function GithubCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    useEffect(() => {
        if (code && state) {
            api.get(`/auth/callback/github?code=${code}&state=${state}`).then((res) => {
                if (res.status !== 200) {
                    throw new Error("Failed to login with github")
                }
                customToast.success("Logged in with github successfully")
                router.push("/user/dashboard")
            }).catch((err) => {
                if (axios.isAxiosError(err)) {
                    customToast.error(err.response?.data?.error || "Failed to login with github")
                } else {
                    customToast.error("An error occurred")
                }
                router.push("/auth/login")
            })
        } else {
            customToast.error("An error occurred")
            router.push("/auth/login")
        }
    }, [code, state])
    return (
        <main className="flex flex-col items-center justify-center h-screen w-full p-4 text-center">
            <h5 className="text-xl mb-2">Signing In with Github</h5>
            <p className="opacity-80 text-(--text-secondary)! text-sm! mb-4 ">You will be redirected to your home page if the login is successful</p>
            <div className="flex items-center gap-2 text-(--text-secondary)">
                <Loader2 className="animate-spin" />
                <p>Processing...</p>
            </div>
        </main>
    )
}