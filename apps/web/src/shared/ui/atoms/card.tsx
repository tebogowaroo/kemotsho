import * as React from "react"
import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
  CardDescription as ShadcnCardDescription,
  CardContent as ShadcnCardContent,
  CardFooter as ShadcnCardFooter,
} from "@kemotsho/core/ui/card"
import { cn } from "@kemotsho/core/lib/utils"

function Card({ className, ...props }: React.ComponentProps<typeof ShadcnCard>) {
  return <ShadcnCard className={cn("bg-card text-card-foreground", className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<typeof ShadcnCardHeader>) {
  return <ShadcnCardHeader className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<typeof ShadcnCardTitle>) {
  return <ShadcnCardTitle className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<typeof ShadcnCardDescription>) {
  return <ShadcnCardDescription className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<typeof ShadcnCardContent>) {
  return <ShadcnCardContent className={cn("p-6 pt-0", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<typeof ShadcnCardFooter>) {
  return <ShadcnCardFooter className={cn("flex items-center p-6 pt-0", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
