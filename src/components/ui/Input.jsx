import * as React from "react"
import { cn } from "../../utils/cn"

const Input = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <input
      className={cn("evenly-input", error && "evenly-input-error", className)}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
