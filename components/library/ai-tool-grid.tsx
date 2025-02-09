'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Search, Heart, Sparkles, Zap, Gem } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const categories = [
  { 
    id: 'all', 
    label: 'すべて', 
    icon: Sparkles,
    textColor: 'text-blue-500',
    selectedTextColor: 'text-blue-600',
    hoverBg: 'hover:bg-gray-50'
  },
  { 
    id: 'new', 
    label: '新着', 
    icon: Zap,
    textColor: 'text-orange-500',
    selectedTextColor: 'text-orange-600',
    hoverBg: 'hover:bg-gray-50'
  },
  { 
    id: 'popular', 
    label: '人気', 
    icon: Heart,
    textColor: 'text-pink-500',
    selectedTextColor: 'text-pink-600',
    hoverBg: 'hover:bg-gray-50'
  },
  { 
    id: 'free', 
    label: '無料', 
    icon: Gem,
    textColor: 'text-purple-500',
    selectedTextColor: 'text-purple-600',
    hoverBg: 'hover:bg-gray-50'
  },
]

const aiTools = [
  {
    id: 1,
    name: 'Onlook',
    description: 'ReactとTailwindCSSを基盤としたリアルタイムデザインAP...',
    imageUrl: '/tools/onlook.png',
    category: 'new',
    tags: ['デザイン', 'フロントエンド'],
  },
  {
    id: 2,
    name: 'Roo-Cline',
    description: 'オープンソースの自律型コーディングアシスタント「Cline」...',
    imageUrl: '/tools/roo-cline.png',
    category: 'popular',
    tags: ['コーディング', 'AI'],
  },
  {
    id: 3,
    name: 'Browser Use',
    description: 'AIエージェントを用いてウェブブラウザを自動操作できるPyt...',
    imageUrl: '/tools/browser-use.png',
    category: 'free',
    tags: ['自動化', 'ブラウザ'],
  },
]

const containerVariants = {
  hidden: { 
    opacity: 0,
    transition: { when: "afterChildren" }
  },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      type: "tween",
      ease: "easeIn",
      duration: 0.2
    }
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      mass: 0.5
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
}

const imageVariants = {
  hidden: {
    opacity: 0,
    scale: 1.1
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
}

const overlayVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 0.1,
    transition: {
      duration: 0.3
    }
  },
  hover: {
    opacity: 0.3,
    transition: {
      duration: 0.3
    }
  }
}

const tagContainerVariants = {
  hidden: { 
    opacity: 0,
    transition: {
      when: "afterChildren"
    }
  },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
      delayChildren: 0.2
    }
  }
}

const tagVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    y: 10,
    transition: {
      type: "tween",
      ease: "easeIn"
    }
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
      mass: 0.5
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
}

const cardVariants = {
  initial: {
    boxShadow: "0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
  },
  hover: {
    y: -8,
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.98,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    transition: {
      duration: 0.1
    }
  }
}

export default function AIToolGrid() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const filteredTools = aiTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      <motion.div 
        className="relative mx-auto max-w-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          placeholder="AIツールを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all placeholder:text-gray-500 hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] focus:border-gray-400 focus:shadow-[0_4px_16px_rgba(0,0,0,0.1)] focus:ring-0"
        />
      </motion.div>

      <motion.div 
        className="flex justify-center space-x-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {categories.map((category, index) => {
          const Icon = category.icon
          return (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`group flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-all
                ${selectedCategory === category.id
                  ? `bg-gray-100 ${category.selectedTextColor}`
                  : `${category.hoverBg} ${category.textColor}`
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon className={`h-4 w-4 transition-all group-hover:scale-110 ${
                selectedCategory === category.id ? category.selectedTextColor : category.textColor
              }`} />
              <span>{category.label}</span>
            </motion.button>
          )
        })}
      </motion.div>

      <ScrollArea className="h-[calc(100vh-16rem)] px-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory + searchQuery}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredTools.length === 0 ? (
              <motion.div
                className="col-span-full flex flex-col items-center justify-center space-y-4 py-12 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="h-12 w-12 text-gray-300" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {searchQuery ? '検索結果が見つかりません' : 'AIツールがありません'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? '検索条件を変更してお試しください' : '新しいツールは随時追加されます'}
                  </p>
                </div>
              </motion.div>
            ) : (
              filteredTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-white shadow-sm transition-all cursor-pointer"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  layout
                  onClick={() => router.push(`/ai-library/${tool.id}`)}
                >
                  <motion.div 
                    className="absolute right-3 top-3 z-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.button 
                      className="rounded-lg bg-white/90 p-2 text-gray-400 shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-colors hover:text-gray-900"
                      whileHover={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }}
                    >
                      <Heart className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                  {tool.imageUrl && (
                    <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl bg-gray-100">
                      <motion.img
                        src={tool.imageUrl}
                        alt={tool.name}
                        className="h-full w-full object-cover"
                        variants={imageVariants}
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-gray-900/20 to-transparent"
                        variants={overlayVariants}
                      />
                    </div>
                  )}
                  <CardHeader className="relative space-y-2 p-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        delay: 0.1 
                      }}
                    >
                      <CardTitle className="line-clamp-1 text-lg font-medium text-gray-900">
                        {tool.name}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {tool.description}
                      </CardDescription>
                    </motion.div>
                    <motion.div 
                      className="flex flex-wrap gap-2 pt-2"
                      variants={tagContainerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {tool.tags.map((tag, index) => (
                        <motion.span
                          key={tag}
                          className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-100 hover:shadow"
                          variants={tagVariants}
                          whileHover="hover"
                          custom={index}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </motion.div>
                  </CardHeader>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
        <ScrollBar orientation="vertical" className="bg-gray-100" />
      </ScrollArea>
    </div>
  )
}
