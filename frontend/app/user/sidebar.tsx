"use client"
import { LayoutDashboard, Menu, Notebook, Settings, Video, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Sidebar(){
    const [toggle, setToggle] = useState<boolean>(false);

    return (
        <>
      <button
        onClick={() => setToggle((state) => !state)}
        className="outline-none rounded-xl backdrop-blur-xl absolute right-0 p-2 size-12 text-3xl bg-[hsl(from_var(--bg-cta)_h_s_15%)] m-4 md:hidden "
      >
        {toggle ? <X /> : <Menu />}
      </button>
        <div className={`${toggle ? "left-0" : ""} w-[250px] -left-full h-screen bg-(--bg-muted) bg-red! text-(--text-secondary) z-50 max-md:absolute transition-all duration-300 ease-in-out`}>
             

            <div className="p-4">
                <h3 className="text-3xl font-bold">Devora</h3>
            </div>
            <nav className="p-4 my-4">
                <ul className="flex flex-col gap-4">
                    <li>
                       <Link href="/user/dashboard" className="flex p-2 rounded hover:bg-(--bg-light)"><p className="flex items-center gap-2 text-sm"><LayoutDashboard/>Dashboard</p></Link>
                    </li>
                    <li>
                        <Link href="/user/interviews" className="flex gap-2 p-2 rounded hover:bg-(--bg-light)"><p className="flex items-center gap-2 text-sm"><Video/>Interviews</p></Link>
                    </li>
                    <li>
                        <Link href="/user/reviews" className="flex gap-2 p-2 rounded hover:bg-(--bg-light)"><p className="flex items-center gap-2 text-sm"><Notebook/>Reviews</p></Link>
                    </li>
                    <li>
                        <Link href="/user/settings" className="flex gap-2 p-2 rounded hover:bg-(--bg-light)"><p className="flex items-center gap-2 text-sm"><Settings/>Settings</p></Link>
                    </li>
                </ul>
            </nav>
        </div>
        </>
    )
}