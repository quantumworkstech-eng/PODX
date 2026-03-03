"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function StarRating({ value = 0, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const current = hover || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn(
            "transition-all",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              sizes[size],
              "transition-colors",
              star <= current
                ? "text-[#D9FC67] fill-[#D9FC67]"
                : "text-white/20"
            )}
          />
        </button>
      ))}
    </div>
  );
}
