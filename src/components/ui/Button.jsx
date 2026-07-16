import * as React from "react"
import { cn } from "../../utils/cn"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-[0_2px_10px_rgba(59,130,246,0.2)] hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)] active:scale-95",
    outline: "border border-brand-border bg-white hover:bg-gray-50 text-brand-text active:scale-95 shadow-sm hover:shadow",
    ghost: "hover:bg-gray-100 text-brand-text-secondary hover:text-brand-text active:scale-95",
    destructive: "bg-red-50 text-brand-danger hover:bg-red-100 active:scale-95",
  }
  const sizes = {
    default: "h-11 px-5 py-2",
    sm: "h-9 rounded-xl px-4",
    lg: "h-12 rounded-xl px-8 text-base",
    icon: "h-11 w-11",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
