export default function Steps(){
    return (
        <div className="py-10 px-3">
            <h5 className="text-center text-(--text-secondary)!">How it works</h5>        
            <h3 className="text-center">Four steps to better Interviews</h3>
            <div className="flex justify-center flex-col m-auto md:w-158 md:items-center my-16">
                <div className="flex gap-6 md:self-end">
                    <div className="flex flex-col items-center">
                        <div className="step-count bg-(--bg-muted) text-4xl font-bold flex items-center justify-center w-16 h-16 rounded-full">1</div>
                        <div className="step-line w-0 h-16 bg-(--bg-cta) opacity-30"></div>
                    </div>
                    <div className="py-2 w-65">
                        <h5>Create an Interview</h5>
                        <p className="text-(--text-secondary)!">Create a coding challenge or select from your library.</p>
                    </div>
                </div>
                <div className="flex gap-6 md:flex-row-reverse md:self-start">
                    <div className="flex flex-col items-center">
                        <div className="step-count bg-(--bg-muted) text-4xl font-bold flex items-center justify-center w-16 h-16 rounded-full">2</div>
                        <div className="step-line w-0 h-16 bg-(--bg-cta) opacity-30"></div>
                    </div>
                    <div className="py-2 w-65 md:text-right">
                        <h5>Invite the Candidate</h5>
                        <p className="text-(--text-secondary)!">Send a secure interview link.</p>
                    </div>
                </div>
                <div className="flex gap-6 md:self-end">
                    <div className="flex flex-col items-center">
                        <div className="step-count bg-(--bg-muted) text-4xl font-bold flex items-center justify-center w-16 h-16 rounded-full">3</div>
                        <div className="step-line w-0 h-16 bg-(--bg-cta) opacity-30"></div>
                    </div>
                    <div className="py-2 w-65">
                        <h5>Conduct the Interview</h5>
                        <p className="text-(--text-secondary)!">Run the interview with built-in video, chat, and code execution.</p>
                    </div>
                </div>
                <div className="flex gap-6 md:flex-row-reverse md:self-start">
                    <div className="flex flex-col items-center">
                        <div className="step-count bg-(--bg-muted) text-4xl font-bold flex items-center justify-center w-16 h-16 rounded-full">4</div>
                    </div>
                    <div className="py-2 w-65 md:text-right">
                        <h5>Evaluate Performance</h5>
                        <p className="text-(--text-secondary)!">Review code quality, reasoning, and results.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}