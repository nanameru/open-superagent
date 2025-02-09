'use client'

import { motion } from 'framer-motion'
import AIToolGrid from '@/components/library/ai-tool-grid'
import { Sparkles } from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
      stiffness: 300,
      damping: 24
    }
  }
}

export default function AILibraryPage() {
  return (
    <motion.div 
      className="flex-1 overflow-hidden"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="relative min-h-screen bg-[#ffffff]">
        {/* 装飾的な背景要素 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gray-100/50 blur-[100px]" />
          <div className="absolute right-1/4 top-1/3 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-gray-100/50 blur-[100px]" />
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.02) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="relative">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <motion.div 
              className="mb-12 text-center"
              variants={itemVariants}
            >
              <motion.div
                className="mb-4 inline-flex items-center justify-center rounded-lg bg-gray-100 p-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="h-6 w-6 text-gray-600" />
              </motion.div>
              <motion.h2 
                className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
                variants={itemVariants}
              >
                AI図書館
              </motion.h2>
              <motion.p 
                className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
                variants={itemVariants}
              >
                次世代のAIツールを探索し、あなたのワークフローを革新する
              </motion.p>
              <motion.div 
                className="mx-auto mt-4 h-px w-24 bg-gray-200"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 96, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="relative z-10"
            >
              <AIToolGrid />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
