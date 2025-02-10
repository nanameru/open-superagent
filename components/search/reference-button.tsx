'use client';

import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface ReferenceButtonProps {
  onClick?: () => void;
}

export default function ReferenceButton({ onClick }: ReferenceButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={onClick}
    >
      <BookOpen className="h-4 w-4" />
    </Button>
  );
}
