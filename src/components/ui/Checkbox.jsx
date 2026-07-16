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
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-[6px] border border-brand-border bg-white shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary data-[state=checked]:text-white data-[state=checked]:shadow-[0_2px_8px_rgba(59,130,246,0.3)] flex items-center justify-center transition-all duration-200 hover:border-brand-primary hover:scale-110 active:scale-95",
        className
      )}
      data-state={checked ? "checked" : "unchecked"}
      ref={ref}
      {...props}
    >
      {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
    </button>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
