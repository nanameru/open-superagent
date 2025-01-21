import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Search, Sparkles, Command } from 'lucide-react'
import SearchInput from '@/components/search'
import Suggestions from '@/components/search/suggestions'

export default async function Home() {
  const suggestions = [
    { emoji: '🧘', text: 'マインドフルネスの始め方', gradient: 'from-purple-500 to-indigo-500' },
    { emoji: '✈️', text: '2025年人気の旅行先', gradient: 'from-rose-400 to-orange-400' },
    { emoji: '🏖️', text: '日本のおすすめビーチスポット', gradient: 'from-cyan-400 to-blue-500' },
    { emoji: '💡', text: 'プログラミング学習のコツ', gradient: 'from-emerald-400 to-cyan-400' }
  ]

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 noise-bg"></div>
      <div className="relative flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl space-y-10 px-8">
          <div className="text-center space-y-3 floating">
            <h1 className="text-4xl font-bold text-gradient tracking-tight">
              What do you want to know?
            </h1>
            <p className="text-gray-600 text-base font-medium">
              Ask anything, get intelligent answers
            </p>
          </div>
          
          <SearchInput />
          <Suggestions items={suggestions} />
        </div>
      </div>
    </div>
  )
}
