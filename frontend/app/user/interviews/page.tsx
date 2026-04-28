import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ellipsis, Pencil, Share, Trash } from "lucide-react";
import Link from "next/link";
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
                    <Table className="border border-(--border)">
                        <TableHeader>
                            <TableRow className="border-(--border) border bg-(--bg-muted)">
                                <TableHead>Role</TableHead>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {yourInterviews.map((interview, index) => (
                                    <TableRow key={index} className="border-(--border) relative">
                                        <TableCell><Link href={`/user/interviews/${index}`} className="absolute inset-0 hover:bg-black/10 hover:rounded-2xl duration-100" aria-label="view interview"/>{interview.role}</TableCell>
                                        <TableCell>{interview.candidate}</TableCell>
                                        <TableCell>{interview.date + " " + interview.time}</TableCell>
                                        <TableCell>{interview.company}</TableCell>
                                        <TableCell>{interview.status}</TableCell>
                                        <TableCell className="text-center isolate">
                                            <DropdownMenu >
                                                <DropdownMenuTrigger>
                                                    <div className="cursor-pointer hover:bg-(--bg-cta)/10! p-1 rounded-lg">
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
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
            </div>

            <div className="my-6">
                <h5 className="text-(--text-primary)">Created by others</h5>
                <p className="text-sm!">Interviews created by others</p>
                
                <div className="my-4">
                    <Table className="border border-(--border)">
                        <TableHeader>
                            <TableRow className="border-(--border) border bg-(--bg-muted)">
                                <TableHead>Interviewer</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {otherInterviews.map((interview, index) => (
                                <TableRow key={index} className="relative border-(--border)">
                                    <TableCell><Link href={`/user/interviews/${index}`} className="absolute inset-0 hover:bg-black/10 hover:rounded-2xl duration-100" aria-label="view interview"/>{interview.interviewer}</TableCell>
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