'use client';

import { Button } from "@/components/ui/button";

interface CitationButtonProps {
  index: number;
  url: string;
}

export default function CitationButton({ index, url }: CitationButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-5 min-w-[1.25rem] px-1 py-0 text-xs rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 inline-flex items-center justify-center"
      onClick={() => {
        window.open(url, '_blank');
      }}
    >
      {index}
    </Button>
  );
}
