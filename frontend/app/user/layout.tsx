import BackBtn from "./backBtn";
import Sidebar from "./sidebar";

export default function UserLayout({children}: {children: React.ReactNode}){
    return (
        <div className="flex h-screen max-w-[1440px] mx-auto">
            <Sidebar />
            <div className="@container/main flex-1 h-screen overflow-y-auto py-8 px-4 md:px-12">
                <BackBtn/>
                {children}
            </div>
        </div>
    )
}