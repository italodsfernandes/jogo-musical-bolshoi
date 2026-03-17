import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "rhythm-track h-3.5 w-full",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="relative h-full w-full flex-1 rounded-full bg-[linear-gradient(90deg,rgba(4,34,35,0.92)_0%,rgba(10,72,72,0.95)_52%,rgba(176,148,90,0.96)_100%)] transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
