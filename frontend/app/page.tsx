import Hero from "@/components/hero";
import Image from "next/image";
import Problems from "@/components/problems";
import Features from "@/components/features";
import Steps from "@/components/steps";
export default function Home() {
  return (
    <div>
      <Hero />
      <Problems />
      <Features />
      <Steps />
    </div>
  );
}
