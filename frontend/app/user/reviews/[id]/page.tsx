import { StatusBtn } from "@/components/statusBtn";
import {Problems, type problemType} from "./problems"
import Feedback from "./feedback";

const testData: problemType[] = [
    {
        id: "1",
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        type: "code",
        lang: "javascript",
        code: `// write your boilerplate code for the answer here
function main() {
    
}`
    },
    {
        id: "2",
        title: "Reverse String",
        description: "Write a function that reverses a string.",
        type: "text",
        answer: "This is the answer to this question, I hope this is answer was meaningful my lordship, azula op",
        pass: false
    },
    {
        id: "3",
        title: "FizzBuzz",
        description: "Write a function that prints numbers from 1 to n. For multiples of 3, print \"Fizz\", for multiples of 5, print \"Buzz\", and for multiples of both, print \"FizzBuzz\".",
        type: "code",
        lang: "python",
        code: `# write your boilerplate code for the answer here
def main():
    `,
    pass: true
    }
]
export default function Page() {
    return(
        <main>
            <header className="flex items-center gap-4">
                <div>
                    <h3 className="text-(--text-primary) text-3xl!">Senior Backend Engineer Interview</h3>
                    <p className="text-sm!">Manage all interview sessions in one place</p>
                </div>
                <StatusBtn className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60">Completed</StatusBtn>
            </header>
            <div className="my-8 max-w-[650px]">
                <iframe
                className="w-full aspect-video max-w-[650px]"
                src="https://www.youtube-nocookie.com/embed/SOQynHuWPeI?si=2F12NOIUGLW906hc"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                <p className="text-sm! text-(--text-secondary)">For the mean time youtube will be used to store your interview&apos;s recording. Don&apos;t worry they are protected and can&apos;t be viewed by another user except you share this review link</p>
            </div>
            <Problems problems={testData} />
            <Feedback/>
        </main>
    )
}
