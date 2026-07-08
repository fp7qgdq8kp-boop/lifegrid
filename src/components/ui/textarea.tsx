import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };

