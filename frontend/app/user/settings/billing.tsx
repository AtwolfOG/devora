import { StatusBtn } from "@/components/statusBtn";
import { Check } from "lucide-react";
import Image from "next/image";

export default function Billing() {
    return (
        <div>
            <h4>Billing</h4>
            <p>Manage your subscriptions and billing</p>

          <div className="flex flex-col gap-2 bg-(--bg-muted)/60 border border-(--border) my-4 py-8 px-6 rounded-lg">
            <h5>Current Plan</h5>  
            <div className="flex items-center justify-between">
              <p>You are currently on the Free plan</p> 
              <StatusBtn className="text-sm! opacity-90 text-(--bg-cta)/65 hover:text-(--bg-cta)/70 hover:bg-(--bg-muted)/70 duration-100"><Check size={16}/>Active</StatusBtn>
            </div>

            <div className="flex items-center flex-wrap gap-4 justify-between my-2">
              <div>
                <p>$0.00/month</p>
                <p>Next billing date: May 19, 2026</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button className="cursor-pointer px-4 py-2 rounded-md border border-(--destructive)/50 text-(--destructive)/60 hover:bg-(--destructive)/10 duration-100">Cancel subscription</button>
                <button className="cursor-pointer px-4 py-2 rounded-md text-(--bg-cta)/60 border border-(--bg-cta)/50 hover:bg-(--bg-cta)/10 duration-100">Change Plan</button>
              </div>
            </div>
          </div>

          <CardDetails/>
        </div>
    )
}

function CardDetails() {
    return (
        <div className=" bg-(--bg-muted)/60 border border-(--border) my-4 py-8 px-6 rounded-lg">
          <h5 className="mb-4">Payment Method</h5>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Image width={60} height={60} src="/visa.png" alt="visa logo" />
              <div>
                <p>Visa ****** 4242</p>
                <p className="text-sm! opacity-90">Expires 12/25</p>
              </div>
            </div>
            <div>
              <button className="cursor-pointer px-4 py-2 rounded-md text-(--text-secondary)/80 border border-(--bg-cta)/50 hover:bg-(--bg-muted)/70 duration-100">Update Payment Method</button>
            </div>
          </div>
        </div>
    )
}