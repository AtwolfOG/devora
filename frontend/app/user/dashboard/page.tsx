import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Plus, Trophy } from "lucide-react";
import Link from "next/link";


const upcomingInterviews = [
    {
        company: "Google",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        interviewer: "John Doe"
    },
    {
        company: "Google",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        interviewer: "John Doe"
    },
    {
        company: "Google",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        interviewer: "John Doe"
    }]

const pastInterviews = [
    {
        company: "Google",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        interviewer: "John Doe"
    },
    {
        company: "Google",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        interviewer: "John Doe"
    },
    {
        company: "Google",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        interviewer: "John Doe"
    }]

export default function DashboardPage(){
    return (
        <div>
            <div className="flex flex-wrap gap-8 justify-between items-center mb-4">
                <div>
                    <h3 className="text-(--text-primary)">Welcome to back, Ayokunle</h3>
                    <p className="text-sm!">Track your interviews and performance</p>
                </div>
                <div>
                    <button className="cursor-pointer flex gap-2 items-center px-2 py-2 bg-(--bg-cta) hover:bg-(--bg-cta-hover) rounded-lg w-max">
                        <Plus/>
                        Create an Interview
                    </button>
                </div>
            </div>

            <div className="flex gap-4 my-12 flex-wrap">
                <div className="flex-1 min-w-[200px] max-w-[300px] flex flex-col gap-8 py-4 px-6 border-(--border) border rounded-lg hover:bg-(--bg-muted)">
                    <div className="flex justify-between items-center"><h6>Total Interviews</h6> <Calendar color="#fff9" /></div>
                    <div><p>0</p></div>
                </div>
                 <div className="flex-1 min-w-[200px] max-w-[300px] flex flex-col gap-8 py-4 px-6 border-(--border) border rounded-lg hover:bg-(--bg-muted)">
                    <div className="flex justify-between items-center"><h6>Pass Rate</h6> <Trophy color="#fff9"/></div>
                    <div><p>0%</p></div>
                </div>
                 <div className="flex-1 min-w-[200px] max-w-[300px] flex flex-col gap-8 py-4 px-6 border-(--border) border rounded-lg hover:bg-(--bg-muted)">
                    <div className="flex justify-between items-center"><h6>Upcoming Interviews</h6> <Calendar color="#fff9"/></div>
                    <div><p>0</p></div> 
                </div>
            </div>
            <div className="my-18">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-(--text-primary)">Upcoming Interviews</h4>
                    <Link href="/user/interviews" className="relative text-(--text-secondary) text-sm! after:content-[''] after:absolute after:-bottom-px after:left-0 after:h-px after:w-0 after:bg-(--text-secondary) after:transition-all after:duration-100 after:ease-in-out hover:after:w-full">View all</Link>
                </div>

                <div className="flex flex-col gap-4">
                    {upcomingInterviews.map((interview, index) => (
                        <UpcomingInterviewCard key={index} company={interview.company} role={interview.role} date={interview.date} time={interview.time} interviewer={interview.interviewer} />
                    ))}
                </div>
            </div>
             <div className="my-18">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-(--text-primary)">Past Interviews</h4>
                    <Link href="/user/interviews" className="relative text-(--text-secondary) text-sm! after:content-[''] after:absolute after:-bottom-px after:left-0 after:h-px after:w-0 after:bg-(--text-secondary) after:transition-all after:duration-100 after:ease-in-out hover:after:w-full">View all</Link>
                </div>

                <div>
                    <PastInterviewCard data={pastInterviews} />
                </div>
            </div>
        </div>
    )
}


function UpcomingInterviewCard({company, role, date, time, interviewer}: {company: string, role: string, date: string, time: string, interviewer: string}){
    return (
        <div className="flex justify-between items-center gap-4 py-4 px-6 border-(--border) border rounded-lg">
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 items-center flex-wrap"><h5>{company}</h5> <div className="w-1 h-1 rounded-full bg-white/50"></div> <p className="text-sm! ">{role}</p></div>
                <div className="flex gap-2 flex-wrap">
                    <p className="text-sm!  flex items-center gap-2"><Calendar className="w-4 h-4"/>{date}</p>
                    <p className="text-sm!  flex items-center gap-2"><Clock className="w-4 h-4"/>{time}</p>
                <p className="text-sm!  ml-4">with {interviewer}</p>
                </div>
            </div>
            <button className="cursor-pointer px-4 py-2 bg-(--bg-cta-darker) hover:bg-(--bg-cta-hover) text-(--text-primary) rounded-lg md:block hidden">Join Interview</button>
        </div>
    )
}

function PastInterviewCard({data}: {data: {company: string, role: string, date: string, time: string, interviewer: string}[]}){
    return (
        <div className="flex justify-between items-center gap-4 py-4 md:px-6 px-2 border-(--border)  rounded-lg">
            <Table className="border border-(--border)">
                <TableHeader>
                    <TableRow className="border-(--border) border bg-(--bg-muted)">
                        <TableHead className="">Company</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Interviewer</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        data.map((interview, index) => (
                            <TableRow className="border-(--border)" key={index}>
                                <TableCell className="font-light!">{interview.company}</TableCell>
                                <TableCell className="font-light!">{interview.role}</TableCell>
                                <TableCell className="font-light!">{interview.date}</TableCell>
                                <TableCell className="font-light!">{interview.time}</TableCell>
                                <TableCell className="font-light!">{interview.interviewer}</TableCell>
                            </TableRow>
                        ))
                    }
                </TableBody>
            </Table>
        </div>
    )
}