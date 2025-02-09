'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Search, Heart, Sparkles, Zap, Gem } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

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

interface AITool {
  id: number;
  name: string;
  description: string;
  image_path: string;
  category: string;
  tags: string[];
  pricing_type: string;
  monthly_users: number;
  last_updated: string;
}

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
      damping: 24
    }
  }
}

export default function AIToolGrid() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [aiTools, setAiTools] = useState<AITool[]>([])
  const [filteredTools, setFilteredTools] = useState<AITool[]>([])

  useEffect(() => {
    const fetchAITools = async () => {
      const supabase = createClient()
      console.log('Fetching AI tools...')
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching AI tools:', error)
        return
      }

      console.log('Fetched AI tools:', data)

      if (data) {
        // カテゴリの設定（データが欠けている場合のデフォルト値を設定）
        const toolsWithCategory = data.map(tool => ({
          ...tool,
          name: tool.name || 'No Name',
          description: tool.description || 'No description available',
          image_path: tool.logo_url || '/tools/default.png',
          tags: tool.tags || [],
          category: tool.pricing_type === 'free' ? 'free' :
                   new Date(tool.last_updated || tool.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'new' :
                   tool.monthly_users > 1000 ? 'popular' : 'all'
        }))
        console.log('Processed tools:', toolsWithCategory)
        setAiTools(toolsWithCategory)
        setFilteredTools(toolsWithCategory)
      }
    }

    fetchAITools()
  }, [])

  useEffect(() => {
    if (!aiTools.length) return

    const filtered = aiTools.filter(tool => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
      const matchesSearch = 
        (tool.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (tool.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    setFilteredTools(filtered)
  }, [selectedCategory, searchQuery, aiTools])

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ScrollArea className="w-full sm:max-w-[600px]">
          <div className="flex space-x-4 pb-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                  ${selectedCategory === category.id ? 'bg-white shadow-sm ' + category.selectedTextColor : category.textColor + ' ' + category.hoverBg}
                `}
              >
                <category.icon className="h-4 w-4" />
                {category.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="search"
            placeholder="AIツールを検索..."
            className="w-full pl-10 sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence>
          {filteredTools.map((tool) => (
            <motion.div
              key={tool.id}
              variants={itemVariants}
              layout
              onClick={() => router.push(`/ai-library/${tool.id}`)}
            >
              <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg">
                <CardHeader className="relative overflow-hidden p-0">
                  <div className="aspect-[2/1] overflow-hidden">
                    <img
                      src={tool.image_path || '/tools/default.png'}
                      alt={tool.name || 'AI Tool'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  {tool.tags && tool.tags.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                      {tool.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="rounded bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="line-clamp-1 text-lg">{tool.name || 'No Name'}</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">
                    {tool.description || 'No description available'}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
