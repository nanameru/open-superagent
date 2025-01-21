import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function Logo() {
  return (
    <div className="p-5">
      <Link href="/" className="flex items-center space-x-3 group">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-bold text-2xl text-gradient tracking-tight">
          Pitatto
        </span>
      </Link>
    </div>
  )
}
