'use client';

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CitationButtonProps {
  index: number;
  url: string;
  inline?: boolean;
}

export default function CitationButton({ index, url, inline = false }: CitationButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-5 min-w-[1.25rem] px-1 py-0 text-xs rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 inline-flex items-center justify-center",
        inline && "mx-1 -my-1"
      )}
      onClick={() => {
        window.open(url, '_blank');
      }}
    >
      {index}
    </Button>
  );
}
