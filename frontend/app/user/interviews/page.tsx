import { OtherInterviews, YourInterviews } from "./interviewCard";

export default function InterviewsPage(){
    
    return (
        <div>
            <h3 className="text-(--text-primary)">Interviews</h3>
            <p className="text-sm!">Manage all interview sessions in one place</p>

            <div className="my-6">
                <h5 className="text-(--text-primary)">Created by you</h5>
                <p className="text-sm!">Interviews you created</p>
                <YourInterviews/>
            </div>
            
            <div className="my-6">
                <h5 className="text-(--text-primary)">Created by others</h5>
                <p className="text-sm!">Interviews created by others</p>
                
                <OtherInterviews/>
            </div>
        </div>
    )
}