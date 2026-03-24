export default function Footer(){
    return (
        <footer className="w-full border-t border-(--border) border-2  bg-(--bg-light)">
            <div className="flex justify-between max-w-[1440px] m-auto relative h-full text-center py-10 flex-wrap px-10">
                
                <p className="mb-4 ">©2026 Devora. All rights reserved.</p>
                <div className="flex justify-center gap-4">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="#">Contact</a>
                </div>
            </div>
        </footer>
    )
}