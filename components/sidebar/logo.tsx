import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  isCollapsed?: boolean
}

export default function Logo({ isCollapsed }: LogoProps) {
  return (
    <div className={cn(
      isCollapsed ? "p-2 flex justify-center" : "p-5",
      "transition-all duration-300"
    )}>
      <Link href="/" className={cn(
        "flex items-center",
        !isCollapsed && "space-x-3",
        "group"
      )}>
        <div className="w-10 h-10 flex items-center justify-center">
          <Image
            src="/pitattologo.png"
            alt="Pitatto Logo"
            width={40}
            height={40}
            className="rounded-xl object-contain dark:invert"
          />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-2xl text-gradient tracking-tight dark:text-white">
            Pitatto
          </span>
        )}
      </Link>
    </div>
  )
}
