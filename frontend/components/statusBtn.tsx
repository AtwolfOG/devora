export function StatusBtn({children, disabled, className}: {children: React.ReactNode, disabled?: boolean, className?: string}){
	return (
		<button disabled={disabled} className={`flex items-center gap-2 py-1 px-2 text-xs rounded-full duration-200 cursor-pointer ${className}`}>
			{children}
		</button>
	)
}
// "pending" | "live" | "reviewing" | "completed" | "cancelled"