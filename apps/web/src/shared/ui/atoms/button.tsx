import * as React from "react"
import { Button as ShadcnButton } from "@kemotsho/core/ui/button"
import { cn } from "@kemotsho/core/lib/utils"

type Props = React.ComponentProps<typeof ShadcnButton>

interface ButtonProps extends Omit<Props, "variant"> {
  intent?: "primary" | "danger" | "ghost" | "outline" | "secondary"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ intent = "primary", className, ...props }, ref) => {
    // Map internal design intents to shadcn variants
    const variantMap = {
      primary: "default",
      danger: "destructive",
      ghost: "ghost",
      outline: "outline",
      secondary: "secondary"
    } as const

    return (
      <ShadcnButton
        ref={ref}
        {...props}
        variant={variantMap[intent]} 
        className={cn(className)}
      />
    )
  }
)
Button.displayName = "Button"
