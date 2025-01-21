import Link from 'next/link';

export default function AuthButtons() {
  return (
    <div className="flex flex-col gap-3 p-4 border-t border-black/5">
      <Link href="/sign-up" className="w-full">
        <button className="w-full flex items-center justify-center px-5 py-3 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-900 transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg">
          Sign up
        </button>
      </Link>
      <Link href="/sign-in" className="w-full">
        <button className="w-full flex items-center justify-center px-5 py-3 text-sm font-medium bg-white text-black rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-black transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md">
          Log in
        </button>
      </Link>
    </div>
  );
}
