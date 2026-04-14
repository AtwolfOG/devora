import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ellipsis, Link, Pencil, Share, Trash } from "lucide-react";

const yourInterviews = [
    {
        candidate: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Pending"
    },
    {
        candidate: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Pending"
    },
    {
        candidate: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Pending"
    }
]

const otherInterviews = [
    {
        interviewer: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Pending"
    },
    {
        interviewer: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Pending"
    },
    {
        interviewer: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Pending"
    }
]

export default function InterviewsPage(){
    return (
        <div>
            <h3 className="text-(--text-primary)">Interviews</h3>
            <p className="text-sm!">Manage all interview sessions in one place</p>

            <div className="my-6">
                <h5 className="text-(--text-primary)">Created by you</h5>
                <p className="text-sm!">Interviews you created</p>
                <div className="my-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-(--border) bg-(--bg-muted)">
                                <TableHead>Role</TableHead>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {yourInterviews.map((interview, index) => (
                                // <Link href={`/user/interviews/${index}`}>
                                    <TableRow key={index} className="border-(--border)">
                                        <TableCell>{interview.role}</TableCell>
                                        <TableCell>{interview.candidate}</TableCell>
                                        <TableCell>{interview.date + " " + interview.time}</TableCell>
                                        <TableCell>{interview.company}</TableCell>
                                        <TableCell>{interview.status}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu >
                                                <DropdownMenuTrigger>
                                                    <div className="hover:bg-(--bg-cta)/10! p-1 rounded-lg">
                                                        <Ellipsis />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent >
                                                    <DropdownMenuItem>
                                                        <Pencil />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Share />
                                                        Share
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem variant="destructive">
                                                        <Trash />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                // </Link>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
            </div>

            <div className="my-6">
                <h5 className="text-(--text-primary)">Created by others</h5>
                <p className="text-sm!">Interviews created by others</p>
                
                <div className="my-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-(--border) bg-(--bg-muted)">
                                <TableHead>Interviewer</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {otherInterviews.map((interview, index) => (
                                <TableRow key={index} className="border-(--border)">
                                    <TableCell>{interview.interviewer}</TableCell>
                                    <TableCell>{interview.role}</TableCell>
                                    <TableCell>{interview.date + " " + interview.time}</TableCell>
                                    <TableCell>{interview.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}