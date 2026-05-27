"use client"
import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import { createPortal } from "react-dom";

export default function SubmitBtn({ disabled, className, text, onClick, Icon }: { disabled: boolean, className?: string, text?: string, onClick?: () => void, Icon?: React.ReactNode }) {
    return (
        <>
            <button type="submit" disabled={disabled} className={cn(`bg-(--bg-cta) rounded text-(--text-cta) py-1 px-2 hover:bg-(--bg-cta-hover) duration-100 cursor-pointer flex items-center justify-center gap-2`, className, disabled ? "opacity-50 cursor-not-allowed!" : "")} onClick={onClick}>{Icon} {text || "Submit"}</button>
            {disabled &&
                createPortal(
                    <div className="absolute inset-0 flex items-center justify-center z-99 bg-black/60"><LoaderIcon className="size-5 animate-spin" /></div>,
                    document.body
                )}
        </>
    )
}