import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function CallbackLayout({children}: {children: React.ReactNode}) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" size={40} /></div>}>
        {children}
      </Suspense>
    )
}