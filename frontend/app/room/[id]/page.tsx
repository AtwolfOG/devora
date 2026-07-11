"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useCheckWindowDimension } from "@/lib/windowDimesion";
import { ArrowLeft, FileCode, Loader2, Mic, PhoneOff, TextIcon, Video } from "lucide-react"
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getRoom } from "./room";
import { Question as Problem} from "@/lib/types";
import { api } from "@/lib/api";
import { RoomDataProvider, useRoomData } from "./context";
import { isAxiosError } from "axios";
import { SolvingUI } from "./solving";
import customToast from "@/components/customToast";
import Header from "./header";
import { UI } from "./ui";

const codeOutput: string[] = [
    "Running your code...",
    "Code is running...",
    "Code has run"
]
const testData: Problem[] = [
    {
        id: "1",
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        type: "code",
        boilerplateCode: "",
        language: "javascript"
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
        type: "code",
        boilerplateCode: "",
        language: "python"
    },
    {
        id: "4",
        title: "Add Two Numbers",
        description: "You are given two non-empty linked lists representing two non-negative integers. Each element in the linked list contains a single digit. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\n You may assume the two numbers do not contain any leading zero, except the number 0 itself.",
        type: "code",
        boilerplateCode: "",
        language: "python"
    },
    {
        id: "5",
        title: "Longest Substring Without Repeating Characters",
        description: "Given a string s, find the length of the longest substring without repeating characters.",
        type: "code",
        boilerplateCode: "",
        language: "python"
    },
    {
        id: "6",
        title: "Longest Substring Without Repeating Characters",
        description: "Given a string s, find the length of the longest substring without repeating characters.",
        type: "code",
        boilerplateCode: "",
        language: "python"
    },
    {
        id: "7",
        title: "Longest Substring Without Repeating Characters",
        description: "Given a string s, find the length of the longest substring without repeating characters.",
        type: "code",
        boilerplateCode: "",
        language: "python"
    },
    
]

export default function RoomPage(){
    return (
        <RoomDataProvider>
        <div className="h-dvh max-h-dvh flex flex-col">
            <Header />
            <UI />
        </div>
        </RoomDataProvider>
    )
}