import Image from "next/image";

export default function Hero() {
    return (
        <div className="flex flex-col items-center justify-center md:flex-row min-h-screen">
            <div className="flex flex-col items-center md:items-start max-w-[650px] w-full ">
                <h1 className="max-w-[20ch] text-center md:text-left">Technical interviews that <span className="text-text-accent">feel real</span></h1>
                <p className="w-[90vw] max-w-[45ch] my-4 text-(--text-secondary) text-center md:text-left">Devora lets companies run live coding interviews with built-in video calls, collaborative coding environments, and structured challenges</p>
                <button className="bg-(--bg-cta) text-(--text-cta) px-8 py-2 my-4 text-lg  rounded-md m-auto">Try Now</button>
            </div>
            <div className="relative hidden lg:block max-w-[600px] w-full h-[90dvh] ">
            <Image src="/hero.png" alt="Hero" className="w-full h-full cover object-cover" fill />
            </div>
        </div>
    );
}