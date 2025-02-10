'use client'

import { motion } from 'framer-motion'
import { useAdminCheck } from '@/hooks/use-admin-check'
import AIToolGrid from '@/components/library/ai-tool-grid'
import { Sparkles } from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
}

const glowVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
}

export default function AILibraryPage() {
  const { isAdmin, isLoading } = useAdminCheck()

  if (isLoading) return null
  if (!isAdmin) return null

  return (
    <motion.div 
      className="flex h-full min-h-screen flex-col bg-white"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* ヘッダー部分 */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-100 bg-white/75 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10a37f]/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="h-5 w-5 text-[#10a37f]" />
          </motion.div>
          <h1 className="text-lg font-semibold text-gray-900">AI図書館</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* 説明セクション */}
          <motion.div 
            className="mb-8 text-center"
            variants={itemVariants}
          >
            <motion.p 
              className="text-lg text-gray-600"
              variants={itemVariants}
            >
              次世代のAIツールを探索し、あなたのワークフローを革新する
            </motion.p>
          </motion.div>

          {/* AIツールグリッド */}
          <motion.div 
            variants={itemVariants}
            className="space-y-4"
          >
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="relative">
                <AIToolGrid />
              </div>
            </div>
          </motion.div>

          {/* 装飾的な背景要素 */}
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-x-0 -top-40 transform-gpu overflow-hidden blur-3xl sm:-top-80">
              <div
                className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#10a37f] to-[#0ea5e9] opacity-[0.05] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                style={{
                  clipPath:
                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                }}
              />
            </div>
            <div className="absolute inset-x-0 top-[calc(100%-13rem)] transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
              <div
                className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#10a37f] to-[#0ea5e9] opacity-[0.05] sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                style={{
                  clipPath:
                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  )
}
