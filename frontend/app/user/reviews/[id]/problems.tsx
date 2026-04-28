"use client"
import { DialogContent, DialogHeader, Dialog, DialogDescription, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Editor } from "@monaco-editor/react";
import { Ellipsis, FileCode, TextIcon } from "lucide-react";

export type problemType = {
    id: string;
    title: string;
    description: string;
    type: string;
    code?: string;
    lang?: string;
    answer?: string
}
export function Problems({problems}:{problems: problemType[]}){
    return(

        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
            <h4 className="text-xl!">Problems</h4>
            <div className="flex flex-col gap-2 my-6">
                {problems.length === 0 ? <p>No problems added yet</p> : problems.map((problem) => (
                    <div key={problem.id} className="flex items-center gap-2 bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2">
                        {problem.type == "code"? <div className="p-2 bg-(--bg-light) text-(--text-secondary)/70 rounded-lg"><FileCode /> </div>: <div className="p-2 bg-(--bg-light) text-(--text-secondary)/70 rounded-lg"><TextIcon /></div>}
                        <div className="flex flex-col gap-1">
                            <h5>{problem.title}</h5>
                            <p className="text-(--text-secondary) text-sm!">{problem.description}</p>
                        </div>
                        <ReviewProblemModal problem={problem} />
                    </div>
                ))}
            </div>
        </div>
    )
}


function ReviewProblemModal({problem}: {problem: problemType}){
    return (
        <Dialog>
            <DialogTrigger className="ml-auto hover:bg-(--bg-cta)/10! p-1 rounded-lg"><Ellipsis/></DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)]">
                <DialogHeader>
                    <DialogTitle>{problem.title}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex flex-col gap-2 w-full max-w-[450px] md:max-w-[350px] min-w-[320px]">
                        <div>
                            <p>{problem.description}</p>
                            {
                                problem.type == "text" && <div className="my-4">
                                    <h6>Answer:</h6>
                                    <p>{problem.answer}</p>
                                </div>
                            }
                        </div>
                        <div className="flex items-center gap-2 mt-8">
                            <button type="submit" className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 rounded-lg">Pass</button>
                            <button className="hover:bg-(--destructive)/10 text-(--destructive) border border-(--destructive)/20 px-4 py-2 rounded-lg">Fail</button>
                        </div>
                    </div>
                    {
                        problem.type == "code" &&
                        <Editor options={{minimap: {enabled: false}, scrollBeyondLastLine: false, lineNumbers: "off"}} className="flex-1 h-full min-h-[320px] w-full min-w-[320px]"  defaultLanguage={"javascript"} language={problem.lang} value={problem.code} theme="vs-dark" />
                    }
                </div>
            </DialogContent>
        </Dialog>
    )
}