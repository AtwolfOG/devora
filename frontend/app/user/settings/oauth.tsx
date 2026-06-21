"use client"
import { StatusBtn } from "@/components/statusBtn";
import { Check, Eye, EyeClosed, Link, Lock, Pencil, Plus, TriangleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { useState } from "react";
import { api } from "@/lib/api";
import customToast from "@/components/customToast";
import { AxiosError } from "axios";


const passwordTester: [RegExp, string][] = [
	[/.{6}/, "It must contain up to six characters"],
	[/\w/, "It must contain an alphabet"],
	[/[0-9]/, "It must contain a digit"],
];

export default function OAuth({google, github, password}: {google: boolean, github: boolean, password: boolean}) {
    // check if only one auth method is enabled
    const isOnlyAuth = (Number(google) + Number(github) + Number(password)) === 1;
    return (
        <div className="my-16">
            <h4>Account & Security</h4>
            <p>Manage your account security, authentication and linked accounts.</p>
            <div className="flex flex-col gap-4 bg-(--bg-muted)/60 border border-(--border) my-4 py-8 px-6 rounded-lg">
                <div className="mb-4">
                    <h5>Linked Accounts</h5>
                    <p className="text-sm! opacity-90">Connect your Google and GitHub accounts to easily sign in and access your dashboard.</p>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4"><FcGoogle size={40}/> 
                        <div>
                            <h6>Google</h6>
                            <p className="text-sm! opacity-90">Linked on May 19, 2026.</p>
                        </div>
                    </div>
                    <AuthButton provider="google" connected={google} isOnlyAuth={isOnlyAuth}/>
                </div>
                <div className="border-t border-(--border)"></div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4"><FaGithub size={40}/> 
                        <div>
                            <h6>GitHub</h6>
                            <p className="text-sm! opacity-90">Not Linked.</p>
                        </div>
                    </div>
                    <AuthButton provider="github" connected={github} isOnlyAuth={isOnlyAuth}/>
                </div>
                <div className="border-t border-(--border)"></div>
                <p className="flex items-center gap-2 text-sm! opacity-90 px-4"><Lock size={16}/> No one is stealing your data</p>
            </div>
            <PasswordSection password={password}/>
        </div>
    )
}

function AuthButton({provider, connected, isOnlyAuth}: {provider: string, connected: boolean, isOnlyAuth: boolean}) {
    return (
        connected ? 
        <div className="flex items-center gap-4">
            <StatusBtn className="text-sm! opacity-90 text-(--bg-cta)/70 hover:text-(--bg-cta)/80 hover:bg-(--bg-muted)/70 duration-100"><Check size={16}/>Linked</StatusBtn>
            {!isOnlyAuth && <button className="text-sm! px-4 py-2 rounded-lg border border-(--destructive)/20 text-(--destructive)/80 hover:bg-(--destructive)/20 duration-100 cursor-pointer">Unlink</button>}
        </div> : 
        <button className="underline-anim flex items-center justify-center gap-2 text-sm! text-(--bg-cta)/80  cursor-pointer"><Link size={16}/> Link Account</button>
    )
}

type ChangePasswordForm = {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

function PasswordSection({password}: {password: boolean}) {
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showChangePassword, setShowChangePassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const { register, handleSubmit, getValues, formState: { errors, isSubmitSuccessful, isSubmitting } } = useForm<ChangePasswordForm>();
    return (
        <div className="flex flex-col gap-4 bg-(--bg-muted)/60 border border-(--border) my-4 py-8 px-6 rounded-lg">
            <div className="mb-4">
                <h5>Password</h5>
                <p className="text-sm! opacity-90">Keep your account secure with a strong password.</p>
            </div>
            {password ?
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 @md:grid-cols-[200px_1fr] @xl:grid-cols-[200px_1fr_250px] items-center gap-2 ">
                    <p className="">Current Password</p>
                        <p className="">••••••••••••••••</p>
                        <p className="text-sm! opacity-90  ">Last changed on May 19, 2026.</p>
                </div>
                <div className="border-t border-(--border)"></div>
                <div className="grid grid-cols-1 @lg:grid-cols-[200px_1fr] @xl:grid-cols-[200px_1fr_200px] items-center gap-2 ">
                    <p className="">Change Password</p>
                        <p>Update your password regularly to keep your account secure.</p>
                        <button className="w-fit flex gap-2 items-center text-sm! px-4 py-2 rounded-lg border border-(--border) text-(--bg-cta)/60 hover:text-(--bg-cta) hover:bg-(--bg-muted)/60 duration-100 cursor-pointer" onClick={() => setShowChangePassword(!showChangePassword)}><Lock size={16} />Change Password</button>
                </div>
            </div> 
            : null}
            {(!password || showChangePassword) &&
            <>
                <div className="border-t border-(--border) my-4"></div>
             <form className="">
<div className="flex @container @max-lg:flex-col flex-wrap gap-4 mb-4">
                                {password && <div className="flex-1 @md:max-w-1/2">
						<div className="flex flex-col gap-1 relative">
							<label htmlFor="oldPassword" className="text-sm!">Old Password</label>
							<input type={showOldPassword ? "text" : "password"} placeholder="Old Password" className="bg-transparent! py-2 px-4" {...register("oldPassword", {
								required: {
									value: true,
									message: "Old Password is required",
								},
							})} />
							{showOldPassword ? <Eye strokeWidth={2} size={20} className="absolute right-4 bottom-0 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowOldPassword(!showOldPassword)} /> : <EyeClosed strokeWidth={2} size={20} className="absolute right-4 bottom-1 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowOldPassword(!showOldPassword)} />}
						</div>
						<ErrorMessage
							errors={errors}
							name="oldPassword"
							render={({ message }) => <p className="text-(--destructive)! text-sm flex items-center"><TriangleAlert className="inline mx-1" size={16} strokeWidth={2} />{message}</p>}
						/>
					</div>}
                <div className="flex-1 @md:max-w-1/2">
						<div className="flex flex-col gap-1 relative">
							<label htmlFor="password" className="text-sm!">Password</label>
							<input type={showNewPassword ? "text" : "password"} placeholder="Password" className="bg-transparent! py-2 px-4" {...register("newPassword", {
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
							{showNewPassword ? <Eye strokeWidth={2} size={20} className="absolute right-4 bottom-0 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowNewPassword(!showNewPassword)} /> : <EyeClosed strokeWidth={2} size={20} className="absolute right-4 bottom-1 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowNewPassword(!showNewPassword)} />}
						</div>
						<ErrorMessage
							errors={errors}
							name="newPassword"
							render={({ message }) => <p className="text-(--destructive)! text-sm flex items-center"><TriangleAlert className="inline mx-1" size={16} strokeWidth={2} />{message}</p>}
						/>
					</div>
                <div className="flex-1 @md:max-w-1/2">
						<div className="flex flex-col gap-1 relative">
							<label htmlFor="confirmPassword" className="text-sm!">Confirm Password</label>
							<input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" className="bg-transparent! py-2 px-4" {...register("confirmPassword", {
								required: {
									value: true,
									message: "Confirm Password is required",
								},
								validate: (value) => {
									if (value !== getValues("newPassword")) return "Passwords do not match";
									return true;
								},
							})} />
							{showConfirmPassword ? <Eye strokeWidth={2} size={20} className="absolute right-4 bottom-0 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowConfirmPassword(!showConfirmPassword)} /> : <EyeClosed strokeWidth={2} size={20} className="absolute right-4 bottom-1 -translate-y-1/2 cursor-pointer opacity-50" onClick={() => setShowConfirmPassword(!showConfirmPassword)} />}
						</div>
						<ErrorMessage
							errors={errors}
							name="confirmPassword"
							render={({ message }) => <p className="text-(--destructive)! text-sm flex items-center"><TriangleAlert className="inline mx-1" size={16} strokeWidth={2} />{message}</p>}
						/>
					</div>
					</div>
                    <button type="submit" className="w-fit h-fit @max-lg:self-start self-end flex gap-2 items-center text-sm! px-4 py-2 rounded-lg border border-(--border) text-(--bg-cta)/60 hover:text-(--bg-cta) hover:bg-(--bg-muted)/60 duration-100 cursor-pointer">{password ? <><Pencil strokeWidth={2} size={20} />Update</> : <><Plus strokeWidth={2} size={20} />Add</>} Password</button>
					</form>
            </>
            }
            </div>
    )
}

async function addOrChangePassword(data: ChangePasswordForm, hasOldPassword: boolean, e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (!hasOldPassword && data.newPassword !== data.confirmPassword) {
        customToast.error("Passwords do not match");
        return;
    }
    try {
        if (hasOldPassword) {
            const {oldPassword, newPassword} = data;
            const res = await api.post("/user/change-password", {
                old_password: oldPassword,
                new_password: newPassword,
            });
            return res.data;
        } else {
            const {newPassword} = data;
            const res = await api.post("/user/add-password", {
                password: newPassword,
            });
            return res.data;
        }
    } catch (error) {
        if (error instanceof AxiosError) {
            customToast.error(error.response?.data.message);
        }
        else {
            customToast.error("Something went wrong, try again");
        }
    }
}