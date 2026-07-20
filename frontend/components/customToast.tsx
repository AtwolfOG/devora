import { toast } from "sonner";

export default class customToast{
	static success(message: string){
		toast.success(message, {
			style: {
				background: "var(--bg-cta)",
				color: "#fff",
                border: "1px solid var(--border)!important",
				opacity: "0.8",
			},
		})
	}
	static error(message: string, onClick: () => void | null = null, duration: number = 5000){
		toast.error(message, {
			style: {
				background: "hsla(from var(--destructive) h s l / 0.8)",
				color: "var(--text)",
                border: "1px solid var(--border)!important",
				opacity: "0.8",
			},
			action: onClick ? {
				label: "Retry",
				onClick
			} : undefined,
			duration: duration,
		})
	}
	static loading(message: string){
		toast.loading(message, {
			style: {
				background: "var(--bg-cta)",
				color: "#fff",
                border: "1px solid var(--border)!important",
				opacity: "0.8",
			},
		})
	}

}