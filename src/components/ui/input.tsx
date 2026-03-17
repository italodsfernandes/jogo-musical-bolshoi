import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-14 w-full rounded-2xl border-2 border-[rgba(176,148,90,0.25)] bg-[rgba(255,252,244,0.96)] px-5 py-3 text-base font-medium text-[hsl(var(--primary))] shadow-sm ring-offset-background placeholder:text-[rgba(18,33,34,0.35)] focus-visible:outline-none focus-visible:border-[hsl(var(--accent))] focus-visible:ring-4 focus-visible:ring-[hsl(var(--accent))]/15 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
