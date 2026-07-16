import * as React from "react"
import { cn } from "../../utils/cn"

const Button = React.forwardRef(({ className, variant = "primary", size = "default", ...props }, ref) => {
  const variants = {
    primary: "evenly-btn-primary",
    default: "evenly-btn-primary",
    secondary: "evenly-btn-secondary",
    outline: "evenly-btn-secondary",
    ghost: "evenly-btn-ghost",
    destructive: "evenly-btn-secondary text-evenly-danger border-evenly-danger/30",
  }

  const sizes = {
    default: "",
    sm: "evenly-btn-sm",
    lg: "evenly-btn-lg",
    icon: "evenly-btn-ghost p-0 min-w-[44px]",
  }

  return (
    <button
      className={cn("evenly-btn", variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
