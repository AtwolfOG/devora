"use client"
import { LayoutDashboard, Menu, Notebook, Settings, Video, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar(){
    const [toggle, setToggle] = useState<boolean>(false);
    const pathname = usePathname();
    console.log("pathname: ", pathname)
    const navLinks = [
        { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/user/interviews", label: "Interviews", icon: Video },
        { href: "/user/reviews", label: "Reviews", icon: Notebook },
        { href: "/user/settings", label: "Settings", icon: Settings },
    ];

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
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link href={link.href} className={`flex p-2 rounded hover:bg-(--bg-light) ${pathname.startsWith(link.href) ? "bg-(--bg-light)" : ""}`}>
                                <p className="flex items-center gap-2 text-sm"><link.icon />{link.label}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
        </>
    )
}