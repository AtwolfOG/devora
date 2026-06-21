import { Suspense } from "react";
import BackBtn from "./backBtn";
import Sidebar from "./sidebar";
import { Loader2 } from "lucide-react";

export default function UserLayout({children}: {children: React.ReactNode}){
    return (
        <div className="flex h-screen max-w-[1440px] mx-auto">
            <Sidebar />
            <div className="@container/main flex-1 h-screen overflow-y-auto py-8 px-4 md:px-12">
                <BackBtn/>
                <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" size={40} /></div>}>
                    {children}
                </Suspense>
            </div>
        </div>
    )
}