import Link from 'next/link'
import Image from 'next/image'

export default function Logo() {
  return (
    <div className="p-5">
      <Link href="/" className="flex items-center space-x-3 group">
        <div className="w-10 h-10 flex items-center justify-center">
          <Image
            src="/pitattologo.png"
            alt="Pitatto Logo"
            width={40}
            height={40}
            className="rounded-xl shadow-lg object-contain group-hover:shadow-xl transition-shadow"
          />
        </div>
        <span className="font-bold text-2xl text-gradient tracking-tight">
          Pitatto
        </span>
      </Link>
    </div>
  )
}
