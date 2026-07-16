import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../../utils/cn"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={cn("evenly-checkbox", className)}
      data-state={checked ? "checked" : "unchecked"}
      ref={ref}
      {...props}
    >
      {checked && <Check className="h-3.5 w-3.5 text-evenly-text" strokeWidth={2.5} aria-hidden />}
    </button>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
