"use client"
import customToast from "@/components/customToast";
import { ErrorMessage } from "@hookform/error-message";
import axios from "axios";
import { Eye, EyeClosed, Mail, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

interface LoginForm {
    email: string;
    password: string;
}


export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();
    return (
        <div className="flex items-center justify-center h-screen w-full">
            <div className="flex flex-col items-center justify-center max-w-[450px] w-[90%] rounded-2xl shadow-2xl backdrop-blur-lg bg-black/10  border-(--border) p-8 opacity-85 animate-slide-in">
                <h3 className="mb-8">Login</h3>
                <form action="" className="flex flex-col px-4 justify-center gap-6  w-full">
                    <div>
                        <div className="flex flex-col gap-2 relative">
                            <label htmlFor="email" className="text-sm">Email</label>
                            <input type="email" placeholder="Email" className="border rounded-md border-(--border) py-2 px-4 focus:outline-none focus:border-(--bg-cta)" {...register("email", {
                            required: {
                                value: true,
                                message: "Email is required",
                            }})} />
                            <Mail strokeWidth={2} size={20} className="absolute right-4 bottom-0 -translate-y-1/2 cursor-pointer opacity-50"/>
                        </div>
                        <ErrorMessage
                            errors={errors}
                            name="email"
                            render={({ message }) => <p className="text-(--bg-destructive)! text-sm flex items-center"><TriangleAlert className="inline mx-1" size={16} strokeWidth={2}/>{message}</p>}
                        />
                    </div>
                    <div>
                        <div className="flex flex-col gap-2 relative">
                            <label htmlFor="password" className="text-sm">Password</label>
                            <input type={showPassword ? "text" : "password"} placeholder="Password" className="border rounded-md border-(--border) py-2 px-4 focus:outline-none focus:border-(--bg-cta)" {...register("password", {
                                          required: {
                                            value: true,
                                            message: "Password is required",
                                          },
                                        })} />
                            {showPassword ? <Eye strokeWidth={2} size={20} className="absolute right-4 bottom-0 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowPassword(!showPassword)} /> : <EyeClosed strokeWidth={2} size={20} className="absolute right-4 bottom-0 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowPassword(!showPassword)} />}
                        </div>
                        <ErrorMessage
                            errors={errors}
                            name="password"
                            render={({ message }) => <p className="text-(--bg-destructive)! text-sm flex items-center"><TriangleAlert className="inline mx-1" size={16} strokeWidth={2}/>{message}</p>}
                        />
                    </div>
                    <div className="flex justify-center gap-8 flex-col my-4 opacity-80">
                        <button type="submit" className={`bg-(--bg-cta)   rounded text-(--text-cta) py-1 px-2 hover:bg-(--bg-cta-hover) duration-100 cursor-pointer ${isSubmitting ? "opacity-50 cursor-not-allowed!" : ""}`} disabled={isSubmitting} onClick={handleSubmit(handleLogin)}>Login</button>
                        <div className="flex justify-center gap-4 self-start">
                            <button className="bg-black/45 py-1 px-2 rounded hover:bg-black/65 duration-100 cursor-pointer">Github</button>
                            <button className="bg-black/45 py-1 px-2 rounded hover:bg-black/65 duration-100 cursor-pointer">Google</button>
                        </div>
                    </div>
                    <p className="text-center opacity-80 text-sm!">Don't have an account? <Link href="/auth/signup" className="text-(--bg-cta) underline">Sign Up</Link></p>
                </form>
            </div>
        </div>
    );
}

async function handleLogin(data: LoginForm, e?: BaseSyntheticEvent){
    try{
        e?.preventDefault();
        await new Promise((resolve)=>setTimeout(resolve, 2000));
        const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, data);
        customToast.success(res.data.message)
    }
    catch(err){
        if(axios.isAxiosError(err)){
            const msg = err.response?.data.error || "An error occurred"
            customToast.error(msg)
        }
        else{
            console.log("error: ", err);
            customToast.error("An error occurred")
        }
    }
} 