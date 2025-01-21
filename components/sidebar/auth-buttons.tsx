export default function AuthButtons() {
  return (
    <div className="p-4 border-t border-black/5">
      <button className="w-full flex items-center justify-center px-5 py-3 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-900 transition-colors button-effect shadow-lg hover:shadow-xl">
        Sign Up
      </button>
      <button className="w-full flex items-center justify-center px-5 py-3 text-sm font-medium text-gray-700 mt-2 hover:bg-black/5 rounded-xl transition-colors button-effect">
        Log in
      </button>
    </div>
  )
}
