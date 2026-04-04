"use client"
import customToast from "@/components/customToast";
import { ErrorMessage } from "@hookform/error-message";
import axios from "axios";
import { Eye, EyeClosed, Mail, TriangleAlert, User } from "lucide-react";
import { useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

interface SignUpForm {
	name: string;
	email: string;
	password: string;
}
const passwordTester: [RegExp, string][] = [
  [/.{6}/, "It must contain up to six characters"],
  [/\w/, "It must contain an alphabet"],
  [/[0-9]/, "It must contain a digit"],
];


export default function SignUpPage() {
	const [showPassword, setShowPassword] = useState(false);
	const { register, handleSubmit, formState: { errors, isSubmitSuccessful, isSubmitting } } = useForm<SignUpForm>();
	return (
		<div className="flex items-center justify-center h-screen w-full">
			<div className="flex flex-col items-center justify-center max-w-[450px] w-[90%] rounded-2xl shadow-2xl backdrop-blur-lg bg-black/10  border-(--border) p-8 opacity-85 animate-slide-in">
				<h3 className="mb-8">Sign Up</h3>
				<form action="" className="flex flex-col px-4 justify-center gap-6  w-full">
					<div>
						<div className="flex flex-col gap-2 relative">
							<label htmlFor="name" className="text-sm">Username</label>
							<input type="text" placeholder="Username" className="border rounded-md border-(--border) py-2 px-4 focus:outline-none focus:border-(--bg-cta)" {...register("name", {
								required: {
									value: true,
									message: "Username is required",
								},
								pattern: {
									value: /^[a-zA-Z0-9_]+$/,
									message: "Username must contain only letters, numbers, and underscores",
								},
							})} />
							<User strokeWidth={2} size={20} className="absolute right-4 bottom-0 -translate-y-1/2 cursor-pointer opacity-50"/>
						</div>
						<ErrorMessage
							errors={errors}
							name="name"
							render={({ message }) => <p className="text-(--bg-destructive)! text-sm flex items-center"><TriangleAlert className="inline mx-1" size={16} strokeWidth={2}/>{message}</p>}
						/>
					</div>
					<div>
						<div className="flex flex-col gap-2 relative">
							<label htmlFor="email" className="text-sm">Email</label>
							<input type="email" placeholder="Email" className="border rounded-md border-(--border) py-2 px-4 focus:outline-none focus:border-(--bg-cta)" {...register("email", {
							required: {
								value: true,
								message: "Email is required",
							},
							pattern: {
								value: /^[\w+._%-]+@[\w-.]+\.\w+/i,
								message: "must be a valid email",
							},
							})} />
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
										  validate: (value) => {
											for (const [regex, message] of passwordTester) {
											  if (!regex.test(value)) return message;
											}
											return true;
										  },
										})} />
							{showPassword ? <Eye strokeWidth={2} size={20} className="absolute right-4 bottom-0 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowPassword(!showPassword)} /> : <EyeClosed strokeWidth={2} size={20} className="absolute right-4 bottom-1 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowPassword(!showPassword)} />}
						</div>
						<ErrorMessage
							errors={errors}
							name="password"
							render={({ message }) => <p className="text-(--bg-destructive)! text-sm flex items-center"><TriangleAlert className="inline mx-1" size={16} strokeWidth={2}/>{message}</p>}
						/>
					</div>
					<div className="flex justify-center gap-8 flex-col my-4 opacity-80">
						<button type="submit" className={`bg-(--bg-cta)   rounded text-(--text-cta) py-1 px-2 hover:bg-(--bg-cta-hover) duration-100 cursor-pointer ${isSubmitting ? "opacity-50 cursor-not-allowed!" : ""}`} disabled={isSubmitting} onClick={handleSubmit(handleSignUp)}>Sign Up</button>
						<div className="flex justify-center gap-4 self-start">
							<button className="bg-black/45 py-1 px-2 rounded hover:bg-black/65 duration-100 cursor-pointer">Github</button>
							<button className="bg-black/45 py-1 px-2 rounded hover:bg-black/65 duration-100 cursor-pointer">Google</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

async function handleSignUp(data: SignUpForm, e?: BaseSyntheticEvent){
	try{
		e?.preventDefault();
		await new Promise((resolve)=>setTimeout(resolve, 2000));
		const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`, data);
		customToast.success(res.data.message)
	}
	catch(err){
		if(axios.isAxiosError(err)){
			console.log(" axios error: ", err.response?.data);
			customToast.error(err.response?.data.error)
		}
		else{
			console.log("error: ", err);
			customToast.error("An error occurred")
		}
	}
} 