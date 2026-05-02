"use client";
import { useEffect, useState } from "react";

export function useCheckWindowDimension(width: number){
    const [isMatch, setIsMatch] = useState<boolean>();

    useEffect(() => {
        const handleResize = () => {
            setIsMatch(window.innerWidth < width);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [width]);

    return isMatch;
}