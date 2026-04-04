import { toast } from "sonner";

export default class customToast{
	static success(message: string){
		toast.success(message, {
			style: {
				background: "var(--bg-cta)",
				color: "#fff",
                border: "1px solid var(--border)!important",
			},
		})
	}
	static error(message: string){
		toast.error(message, {
			style: {
				background: "var(--bg-destructive)",
				color: "#fff",
                border: "1px solid var(--border)!important"
			},
		})
	}
	static loading(message: string){
		toast.loading(message, {
			style: {
				background: "var(--bg-cta)",
				color: "#fff",
                border: "1px solid var(--border)!important"
			},
		})
	}

}