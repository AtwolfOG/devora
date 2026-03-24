"use client"
import gsap from "gsap"
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { useRef, type JSX } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const featuresData: featureType[] = [
    {
        title: "Real Time Collaborative Coding",
        subtitle: "Write and run code together in a powerful browser based IDE.",
        badge: "COLLABORATION",
        list: [ "Syntax Highlighting", "Multiple languages", "Live cursor presence", "Test execution"],
        src: "/collaborative.png",
        alt: "collaborative IDE in the browser"
    },
    {
        title: "Built In Video Interviews",
        subtitle: "Run your interview directly inside the platform.",
        badge: "INTERVEIWING",
        list: [ "Low latency video", "Screen sharing", "Live communication", "Zero setup"],
        src: "/video_calling.png",
        alt: "Low latency video calling"
    },
    {
        title: "Structured Coding Challenges",
        subtitle: "Create structured and clean interview questions, with no stress.",
        badge: "CHALLENGES",
        list: [ "Custom problem statements", "Test cases", "Difficulty levels", "Automatic evaluation"],
        src: "/structured_problem.jpeg",
        alt: "structured interveiw questions"
    },
]

gsap.registerPlugin(useGSAP)
export default function Features() {
    const divRef = useRef<HTMLDivElement>(null)
    const nextBtn = useRef<HTMLDivElement>(null)
    const prevBtn = useRef<HTMLDivElement>(null)
    useGSAP((_, contextSafe)=>{
            if (!contextSafe) return;
            const gotoSection = (()=>{
        let isAnimating = false;
        let currentIndex  = 0;
        
        const cards: HTMLElement[] = gsap.utils.toArray(".cards");
        const imageWrapper: HTMLElement[] = gsap.utils.toArray(".image-wrapper")
        const sections: HTMLElement[] = gsap.utils.toArray(".sections")
        gsap.set(sections[0], {
            autoAlpha: 1,
        })
        return contextSafe(( direction: number)=>{
            if (isAnimating) return;
            const index = currentIndex + direction;
            if (index < 0 && direction == -1){
                return;
            }
            if (index >= cards.length && direction == 1){
                return;
            }
            isAnimating = true;
            gsap.set(sections[index], {
                autoAlpha: 1
            })
            const tl = gsap.timeline({
                    onComplete: () => {
                        gsap.set(sections[currentIndex],{
                            autoAlpha: 0
                        })
                        currentIndex = index;
                        isAnimating = false;
                    }
            })
                tl.to(cards[currentIndex], {
                    xPercent: -90 * direction,
                    autoAlpha: 0,
                    duration: 0.4,
                    ease: "power2.inOut",
                })
                tl.to(imageWrapper[currentIndex], {
                    autoAlpha: 0,
                    duration: 0.4,
                    ease: "power2.inOut",
                },0)
                tl.fromTo(cards[index], {
                    xPercent: 110 * direction,
                    autoAlpha: 0,
                }, {
                    xPercent: 0,
                    autoAlpha: 1,
                    duration: 0.5,
                    ease: "power2.inOut",
                }, 0)
                tl.fromTo(imageWrapper[index], {
                    autoAlpha: 0,
                }, {
                    autoAlpha: 1,
                    duration: 0.5,
                    ease: "power2.inOut",
                }, 0)
        })
    })()
    nextBtn.current?.addEventListener("click", () => gotoSection(1));
    prevBtn.current?.addEventListener("click", () => gotoSection(-1));
        },
        {scope: divRef})
    
    return (
        <div className="w-full h-[800px] md:h-screen max-h-[1000px] bg-(--bg-light)">
            <div ref={divRef} className="max-w-[1440px] m-auto relative h-full ">
                {
                    featuresData.map((data) => <Feature key={data.title} {...data} />)
                }
                <div ref={nextBtn}  className="absolute top-1/2 translate-y-[-50%] right-2 md:right-4 z-10 border border-(--border-light) rounded-full p-1 shadow-2xl/100 bg-(--bg-light)"><ArrowRight className="w-10 h-10"/></div>
                <div ref={prevBtn}  className="absolute top-1/2 translate-y-[-50%] left-2 md:left-4 z-10 border border-(--border-light) rounded-full p-1 shadow-2xl/100 bg-(--bg-light)"><ArrowLeft className="w-10 h-10"/></div>
            </div>
        </div>
    );
}

const Mark: JSX.Element = <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M9 16.17L4.83 12l-1.41 1.41L9 19l12-12-1.41-1.41z"
                ></path>
              </svg>

interface featureType{
    src: string,
    alt: string,
    title: string,
    subtitle: string,
    badge: string,
    list: string[]
}

function Feature({src, alt, title, subtitle, list, badge}: featureType){
    return(
        <div className="sections absolute overflow-hidden invisible h-full w-full m-auto max-w-[1440px] grid grid-cols-1 md:grid-cols-2 justify-center items-center">
             <div className="image-wrapper w-[90%] justify-self-center md:justify-self-end aspect-video items-center relative ">
                <Image src={src} alt={alt} fill />
             </div>
             <div className="cards w-[85%] sm:w-[80%] pl-8 pr-4 py-10  max-w-[400px] border border-(--border-light) shadow-2xl/70 rounded-4xl flex flex-col justify-self-center">
                <button className="w-max mb-4 bg-(--bg-badge) text-(--text-cta) py-1 px-2 hover:bg-(--bg-badge-hover)">{badge}</button>
                <h3 className="mb-2">{title}</h3>
                <h6 className="mb-8">{subtitle}</h6>
                <div className="px-2">{list.map((text)=> <div className="flex items-center gap-2 mb-2" key={text}>{Mark} <p>{text}</p></div>)}</div>
             </div>
        </div>
    )
}



