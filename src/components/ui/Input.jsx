import * as React from "react"
import { cn } from "../../utils/cn"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-brand-border bg-white px-4 py-2 text-sm text-brand-text shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/10 focus-visible:border-brand-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-brand-border-hover hover:shadow-md",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
