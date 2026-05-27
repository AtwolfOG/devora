import customToast from "@/components/customToast"

export default function copyToClipboard(text: string){
    navigator.clipboard.writeText(text)
    customToast.success("Link copied to clipboard")
}