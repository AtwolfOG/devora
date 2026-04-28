"use client"
import { DialogContent, DialogHeader, Dialog, DialogDescription, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { FileCode, Plus, TextIcon, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useForm, type FieldValues} from "react-hook-form";
import { Editor } from "@monaco-editor/react";


type Problem = {
    id: string;
    title: string;
    description: string;
    type: string;
}

const boilerplate: Record<string, string> = {
    "javascript": `// write your boilerplate code for the answer here
function main() {
    
}`,
    "python": `# write your boilerplate code for the answer here
def main():
    `,
    "go": `// write your boilerplate code for the answer here
func main() {
    
}`
}

const testData: Problem[] = [
    {
        id: "1",
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        type: "code"
    },
    {
        id: "2",
        title: "Reverse String",
        description: "Write a function that reverses a string.",
        type: "text"
    },
    {
        id: "3",
        title: "FizzBuzz",
        description: "Write a function that prints numbers from 1 to n. For multiples of 3, print \"Fizz\", for multiples of 5, print \"Buzz\", and for multiples of both, print \"FizzBuzz\".",
        type: "code"
    }
]

export function ProblemsCard(){
    const [problems, setProblems] = useState<Problem[]>([])
    const params = useParams();
    const fetchProblems = useCallback(async () => {
            try{
                const response = await fetch(`/api/interviews/${params.id}/problems`);
                if (!response.ok) {
                    throw new Error("Failed to fetch problems");
                }
                const data = await response.json();
                setProblems(data);
            }catch(error){
                console.log(error);
            }
        },[])
    useEffect(() => {
       setProblems(testData);
    }, [fetchProblems]);
    return (
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
                        <button className="ml-auto hover:bg-(--destructive)/10 text-(--destructive) px-4 py-2 rounded-lg"><Trash2 /></button>
                    </div>
                ))}
            </div>
            <AddProblemModal fetchProblems={fetchProblems} />
        </div>
    )
}
function AddProblemModal({fetchProblems}: {fetchProblems: () => void}){
    const [type, setType] = useState("");
    const {register, watch, handleSubmit, formState: {isSubmitting}} = useForm()
    const params = useParams();
    const language = watch("language");
    const onSubmit = async (data: FieldValues) => {
        console.log(data);
        try{
            const response = await fetch(`/api/interviews/${params.id}/problems`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error("Failed to add problem");
            }
            fetchProblems();
        }catch(error){
            console.log(error);
        }
    }
    return (
        <Dialog>
            <DialogTrigger className="flex items-center gap-2 bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-2 py-2 rounded-lg"><Plus/> Add Problem</DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)]">
                <DialogHeader>
                    <DialogTitle>Add Problem</DialogTitle>
                    <DialogDescription>
                        Add a new problem to the interview
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex flex-col gap-2 w-full max-w-[350px] min-w-[320px]">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="title">Title</label>
                                    <input {...register("title", {required: true})} placeholder="title" className="px-4 py-2" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="description">Description</label>
                                    <input {...register("description", {required: true})} placeholder="description" className="px-4 py-2" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="type">Type</label>
                                    <select {...register("type", {required: true, onChange: (e) => setType(e.target.value)})} className="px-2 py-2">
                                        <option value="">Select Problem Type</option>
                                        <option value="coding">Coding</option>
                                        <option value="text">Text</option>
                                    </select>
                                </div>
                            </div>
                            {type === "coding" && (
                                <div className="flex flex-col gap-2">
                                    <select {...register("language", {required: true})} className="w-[150px] px-2 py-2">
                                        <option value="javascript">JavaScript</option>
                                        <option value="python">Python</option>
                                        <option value="go">Go</option>
                                    </select>
                                    <Editor options={{minimap: {enabled: false}, scrollBeyondLastLine: false, lineNumbers: "off"}} className="flex-1 h-full min-h-[320px] w-full min-w-[320px]"  defaultLanguage={"javascript"} language={language} defaultValue={boilerplate["javascript"]} value={boilerplate[language]} theme="vs-dark" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <button type="submit" disabled={isSubmitting} className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 rounded-lg">Add</button>
                            <DialogClose render={<button className="text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-muted) border border-(--border-light) duration-200 px-4 py-2 rounded-lg">Cancel</button>} />
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}