'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ExternalLink, Heart, Share2, Star, Building2, Globe, Cpu, CreditCard, Monitor, BookOpen, Twitter, ChevronDown, FileText, Clock, MessageCircle, ArrowDown, ArrowUp, Search, ArrowLeft, ArrowRight, Send, X, Bot, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import Image from 'next/image'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function AIToolDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const toolId = parseInt(params.id)
  const containerRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const [sortBy, setSortBy] = useState<'likes' | 'replies' | 'date'>('likes')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 10
  const [message, setMessage] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
  }>>([
    {
      role: 'assistant',
      content: 'こんにちは！このAIツールについて、どのようなことでもお気軽にお尋ねください。'
    }
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    
    // Simulate AI response (実際のAPIコールに置き換えてください)
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '申し訳ありません。現在、チャット機能は開発中です。もうしばらくお待ちください。'
      }])
    }, 1000)

    setMessage('')
  }

  const tool = {
    id: toolId,
    name: 'Onlook',
    developer: 'Onlook Technologies Inc.',
    description: 'ReactとTailwindCSSを基盤としたリアルタイムデザインAP。直感的なインターフェースと豊富なコンポーネントライブラリにより、効率的なUI開発を実現します。',
    image: '/Summarize.webp',
    category: 'デザイン支援',
    useCases: [
      'Webサイトのデザイン制作',
      'UIコンポーネントの設計',
      'プロトタイプの作成'
    ],
    features: [
      'リアルタイムプレビュー',
      'カスタマイズ可能なコンポーネント',
      'レスポンシブデザインサポート',
      'コード自動生成',
      'チーム共同編集'
    ],
    uniquePoints: [
      '業界最速のレンダリング速度',
      'AIによるデザイン提案機能',
      '豊富なテンプレート数'
    ],
    pricing: {
      hasFreeplan: true,
      plans: [
        {
          name: '無料プラン',
          price: '¥0/月',
          features: ['基本機能', '3プロジェクトまで']
        },
        {
          name: 'プロプラン',
          price: '¥2,980/月',
          features: ['無制限プロジェクト', 'チーム機能', 'プライオリティサポート']
        }
      ]
    },
    platforms: {
      web: true,
      desktop: true,
      mobile: true,
      requirements: 'モダンブラウザ（Chrome推奨）'
    },
    website: 'https://example.com',
    documentation: 'https://docs.example.com',
    terms: 'https://terms.example.com',
    github: 'https://github.com/example/onlook',
    lastUpdate: '2025-02-01',
    tags: ['デザイン', 'フロントエンド', 'UI/UX'],
    xPosts: [
      {
        author: 'Sarah Johnson',
        handle: '@sarahj_dev',
        content: 'Onlookのリアルタイムプレビュー機能が素晴らしい！プロトタイプ作成の時間が半分になった。 #WebDev #Design',
        date: '2025-02-01',
        likes: 128,
        replies: 10
      },
      {
        author: 'Tech Review JP',
        handle: '@techreviewjp',
        content: 'AIによるデザイン提案機能のクオリティが予想以上。特にレスポンシブデザインの提案が秀逸です。',
        date: '2025-01-28',
        likes: 243,
        replies: 5
      },
      {
        author: 'Mike Chen',
        handle: '@mikechen_ux',
        content: 'チーム共同編集機能のUXが完璧。他のデザインツールも見習ってほしい。',
        date: '2025-01-25',
        likes: 89,
        replies: 20
      }
    ]
  }

  const filteredAndSortedPosts = [...tool.xPosts]
    .filter(post => 
      searchQuery === '' || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.handle.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1
      switch (sortBy) {
        case 'likes':
          return (a.likes - b.likes) * order
        case 'replies':
          return ((a.replies || 0) - (b.replies || 0)) * order
        case 'date':
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * order
        default:
          return 0
      }
    })

  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage)
  const currentPosts = filteredAndSortedPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  )

  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const headerScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  return (
    <div ref={containerRef} className="min-h-screen bg-white">
      {/* メインコンテンツ */}
      <main className="w-full">
        {/* ヒーローセクション */}
        <motion.section 
          initial="initial"
          animate="animate"
          variants={stagger}
          className="relative mb-0 w-full"
        >
          {/* 背景画像 */}
          <div className="absolute inset-0 w-full h-[85vh]">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-white z-10" />
            <Image
              src={tool.image}
              alt={tool.name}
              fill
              className="object-cover object-top"
              priority
              sizes="100vw"
            />
          </div>

          <div className="relative z-20 w-full min-h-screen flex flex-col">
            <div className="flex justify-end pt-8">
              <div className="flex items-center gap-4 mr-4">
                <button className="rounded-full bg-white/10 backdrop-blur-sm p-2 transition-colors hover:bg-white/20">
                  <Share2 className="h-5 w-5 text-white" />
                </button>
                <button className="rounded-full bg-white/10 backdrop-blur-sm p-2 transition-colors hover:bg-white/20">
                  <Heart className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-full">
                <motion.div 
                  variants={fadeIn}
                  className="flex flex-wrap gap-2 justify-center mb-6"
                >
                  {tool.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-sm text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>
                <motion.h1 
                  variants={fadeIn}
                  className="text-7xl font-bold text-white mb-6 tracking-tight"
                >
                  {tool.name}
                </motion.h1>
                <motion.p 
                  variants={fadeIn}
                  className="text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto"
                >
                  {tool.description}
                </motion.p>
                <motion.div 
                  variants={fadeIn}
                  className="flex items-center gap-6 justify-center"
                >
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-black transition-all hover:bg-gray-100 hover:scale-105"
                  >
                    ウェブサイトを訪問
                    <ExternalLink className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                  <a
                    href={tool.terms}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white/20 hover:scale-105"
                  >
                    利用規約
                    <FileText className="h-5 w-5" />
                  </a>
                </motion.div>
              </div>
            </div>
            <div className="flex justify-center pb-8">
              <motion.div 
                variants={fadeIn}
                className="flex items-center flex-col gap-2 z-20"
              >
                <span className="text-sm font-medium text-gray-900">スクロールして詳細を見る</span>
                <ChevronDown className="h-6 w-6 text-gray-900 animate-bounce" />
              </motion.div>
            </div>
          </div>
          <motion.div 
            variants={fadeIn}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center flex-col gap-2 text-white/60 z-20"
          >
          </motion.div>
        </motion.section>

        {/* コンテンツセクション */}
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
          className="w-full bg-gray-50 py-24 rounded-[32px]"
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
              {/* サイドバー */}
              <motion.div 
                variants={fadeIn}
                className="lg:col-span-3 lg:sticky lg:top-28 lg:self-start bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">基本情報</h3>
                    <dl className="space-y-4 text-sm">
                      <div className="group">
                        <dt className="text-gray-500">開発元</dt>
                        <dd className="mt-1 font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                          {tool.developer}
                        </dd>
                      </div>
                      <div className="group">
                        <dt className="text-gray-500">カテゴリ</dt>
                        <dd className="mt-1 font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                          {tool.category}
                        </dd>
                      </div>
                      <div className="group">
                        <dt className="text-gray-500">最終更新日</dt>
                        <dd className="mt-1 font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                          {tool.lastUpdate}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">プラットフォーム</h3>
                    <ul className="space-y-3 text-sm">
                      {tool.platforms.web && (
                        <li className="flex items-center gap-2 text-gray-600 group">
                          <Globe className="h-4 w-4 group-hover:text-gray-900 transition-colors" />
                          <span className="group-hover:text-gray-900 transition-colors">Web</span>
                        </li>
                      )}
                      {tool.platforms.desktop && (
                        <li className="flex items-center gap-2 text-gray-600 group">
                          <Monitor className="h-4 w-4 group-hover:text-gray-900 transition-colors" />
                          <span className="group-hover:text-gray-900 transition-colors">Desktop</span>
                        </li>
                      )}
                      {tool.platforms.mobile && (
                        <li className="flex items-center gap-2 text-gray-600 group">
                          <Cpu className="h-4 w-4 group-hover:text-gray-900 transition-colors" />
                          <span className="group-hover:text-gray-900 transition-colors">Mobile</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* メインコンテンツ */}
              <div className="lg:col-span-9">
                {/* 機能セクション */}
                <motion.div 
                  variants={fadeIn}
                  className="mb-16 bg-white rounded-2xl p-8"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">
                    機能と特徴
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {tool.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative overflow-hidden rounded-md border border-gray-200 p-6 transition-all duration-200 hover:border-gray-400 hover:shadow-sm bg-white"
                      >
                        <div className="relative flex items-start gap-4">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-900 transition-colors duration-200 group-hover:bg-black group-hover:text-white">
                            {index + 1}
                          </span>
                          <div className="space-y-1">
                            <p className="pt-0.5 text-base text-gray-900 group-hover:text-gray-600 transition-colors duration-200">
                              {feature}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Xのポスト */}
                <motion.div 
                  variants={fadeIn}
                  className="bg-white rounded-2xl p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                      関連するXのポスト
                    </h2>
                    <div className="text-sm text-gray-500 font-medium">
                      {filteredAndSortedPosts.length} 件
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ポストをAI検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                      />
                      <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1DA1F2]" />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg border border-gray-200 divide-x">
                        <button
                          onClick={() => setSortBy('likes')}
                          className={`px-4 py-2 text-sm font-medium ${
                            sortBy === 'likes'
                              ? 'text-[#1DA1F2] bg-blue-50 border-[#1DA1F2]'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          いいね
                        </button>
                        <button
                          onClick={() => setSortBy('replies')}
                          className={`px-4 py-2 text-sm font-medium ${
                            sortBy === 'replies'
                              ? 'text-[#1DA1F2] bg-blue-50 border-[#1DA1F2]'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          リプライ
                        </button>
                        <button
                          onClick={() => setSortBy('date')}
                          className={`px-4 py-2 text-sm font-medium ${
                            sortBy === 'date'
                              ? 'text-[#1DA1F2] bg-blue-50 border-[#1DA1F2]'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          日付
                        </button>
                      </div>
                      <button
                        onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#1DA1F2] hover:bg-blue-50 transition-colors"
                      >
                        {sortOrder === 'asc' ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="space-y-6">
                      {currentPosts.map((post, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ 
                            delay: index * 0.05,
                            duration: 0.5,
                            ease: [0.23, 1, 0.32, 1]
                          }}
                          className="group relative hover:bg-gray-50 rounded-xl p-4 -mx-4 transition-colors duration-200"
                        >
                          <div className="space-y-3">
                            <p className="text-gray-600 text-[15px] leading-relaxed">
                              {post.content}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2">
                                  <Heart className="w-4 h-4" />
                                  {post.likes}
                                </span>
                                <span className="flex items-center gap-2">
                                  <MessageCircle className="w-4 h-4" />
                                  {post.replies || 0}
                                </span>
                              </div>
                              <time className="text-sm text-gray-500">
                                {post.date}
                              </time>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="text-sm text-gray-600">
                          {currentPage} / {totalPages}
                        </div>
                        <button
                          onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* チャットボタンとモーダル */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#1DA1F2] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#1a91da] transition-colors duration-200 z-50"
      >
        <Bot className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setIsChatOpen(false)}
            />

            {/* チャットモーダル */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-8 right-8 w-[400px] bg-white rounded-2xl shadow-xl z-50"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  AIアシスタント
                </h2>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div ref={chatContainerRef} className="p-4 h-[400px] overflow-y-auto space-y-4">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-[#1DA1F2] text-white' : 'bg-gray-100 text-gray-900'}`}
                    >
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-100">
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="w-full px-4 py-3 pr-12 text-[15px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-[#1DA1F2] hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!message.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
