import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border text-sm font-bold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-0 bg-gradient-to-b from-[hsl(40_52%_58%)] to-[hsl(38_52%_46%)] text-white shadow-[0_4px_0_hsl(38_50%_36%),0_6px_16px_rgba(120,94,36,0.2)] active:translate-y-[3px] active:shadow-[0_1px_0_hsl(38_50%_36%)]",
        destructive:
          "border-0 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_0_hsl(0_60%_36%),0_6px_16px_rgba(140,30,30,0.2)] active:translate-y-[3px] active:shadow-[0_1px_0_hsl(0_60%_36%)]",
        outline:
          "border-2 border-[rgba(176,148,90,0.25)] bg-white text-[hsl(var(--primary))] shadow-[0_3px_0_hsl(var(--line-soft)),0_4px_12px_rgba(18,33,34,0.05)] active:translate-y-[2px] active:shadow-[0_1px_0_hsl(var(--line-soft))]",
        secondary:
          "border-0 bg-gradient-to-b from-[hsl(170_55%_16%)] to-[hsl(170_60%_10%)] text-white shadow-[0_4px_0_hsl(170_65%_6%),0_6px_16px_rgba(4,34,35,0.2)] active:translate-y-[3px] active:shadow-[0_1px_0_hsl(170_65%_6%)]",
        ghost:
          "border-transparent bg-transparent text-[hsl(var(--primary))] hover:bg-[rgba(176,148,90,0.1)]",
        link: "text-primary underline-offset-4 hover:underline border-0",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-11 px-4 text-sm rounded-xl",
        lg: "h-14 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
