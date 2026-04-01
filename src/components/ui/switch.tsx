"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9FC67]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-[#D9FC67] data-[state=unchecked]:bg-white/10",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0",
          "transition-transform duration-200 ease-in-out",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          "data-[state=checked]:bg-black data-[state=unchecked]:bg-white/60"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
