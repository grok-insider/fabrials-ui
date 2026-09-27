"use client";
// Preview written by Fabrials for Kibo UI's rating.
import { useState } from "react";
import { Rating, RatingButton } from "@/components/external/kibo/rating";

export default function KiboRatingDemo() {
  const [value, setValue] = useState(3);
  return (
    <div className="grid justify-items-start gap-2">
      <Rating value={value} onValueChange={setValue}>
        {Array.from({ length: 5 }).map((_, index) => (
          <RatingButton key={index} />
        ))}
      </Rating>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {value} of 5
      </p>
    </div>
  );
}
