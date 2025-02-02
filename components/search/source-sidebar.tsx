'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Source {
  title: string;
  url: string;
  content: string;
  score: number;
  rank: number;
}

interface SourceSidebarProps {
  sources: Source[];
  isVisible: boolean;
  onClose: () => void;
}

const sidebarVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { 
    x: '100%', 
    opacity: 0,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const headerVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300
    }
  },
  exit: { 
    y: -20, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300
    }
  },
  exit: { 
    y: 20, 
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

export const SourceSidebar = ({ sources, isVisible, onClose }: SourceSidebarProps) => {
  const [selectedSources, setSelectedSources] = useState<Set<number>>(new Set());
  const [showUrlList, setShowUrlList] = useState(false);

  // User Queryを除外
  const filteredSources = sources.filter(source => !source.title.includes('User Query'));

  const toggleSource = (index: number, event?: React.MouseEvent<HTMLDivElement>) => {
    event?.stopPropagation();
    const newSelected = new Set(selectedSources);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSources(newSelected);
  };

  const handleSourceClick = (source: Source, event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (source.url) {
      window.open(source.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenSelectedSources = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setShowUrlList(true);
  };

  // 選択されたURLのリストを取得
  const selectedUrls = Array.from(selectedSources)
    .map(index => filteredSources[index])
    .filter(source => source?.url)
    .map(source => ({
      url: source.url as string,
      title: source.title
    }));

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* オーバーレイ */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* サイドバー */}
          <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[#FAFAFA] shadow-[0_0_50px_rgba(0,0,0,0.1)]"
          >
            <div className="flex h-full flex-col">
              {/* ヘッダー */}
              <motion.div 
                variants={headerVariants}
                className="relative border-b border-gray-100 bg-white px-6 py-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/90"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </motion.div>
                    <div>
                      <motion.h2 
                        className="text-lg font-medium text-black/90"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        参考文献一覧
                      </motion.h2>
                      <motion.p 
                        className="text-sm text-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {filteredSources.length} sources
                      </motion.p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSources.size > 0 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={handleOpenSelectedSources}
                        className="flex items-center gap-1.5 rounded-full bg-black/90 px-3 py-1.5 text-sm text-white transition-colors hover:bg-black"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>選択した文献を開く</span>
                      </motion.button>
                    )}
                    <motion.button
                      onClick={onClose}
                      className="rounded-full p-2 text-black/30 transition-colors hover:bg-black/5 hover:text-black/60"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* URLリストのモーダル */}
              {showUrlList && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-x-0 top-20 z-50 mx-4 rounded-xl bg-white p-4 shadow-lg"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-black/90">選択された文献 ({selectedUrls.length})</h3>
                    <button
                      onClick={() => setShowUrlList(false)}
                      className="rounded-full p-1 text-black/30 hover:bg-black/5 hover:text-black/60"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="max-h-60 space-y-2 overflow-y-auto">
                    {selectedUrls.map((item, i) => (
                      <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-black/5 p-3 text-sm hover:border-black/20 hover:bg-black/5"
                      >
                        <div className="font-medium text-black/90">{item.title}</div>
                        <div className="mt-1 text-xs text-black/50 line-clamp-1">{item.url}</div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ソース一覧 */}
              <div className="flex-1 overflow-auto">
                <div className="p-4 space-y-3">
                  {filteredSources.map((source, index) => {
                    const title = source.title.replace(/^Twitter Post by /, '');
                    return (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className={`group p-4 rounded-xl ${
                        selectedSources.has(index) 
                          ? 'bg-gray-100 ring-1 ring-gray-300 shadow-sm' 
                          : 'hover:bg-gray-50/80'
                      } cursor-pointer transition-all duration-200`}
                      onClick={(e: React.MouseEvent<HTMLDivElement>) => toggleSource(index, e)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-sm transition-colors duration-200 ${
                          selectedSources.has(index)
                            ? 'bg-gray-200 text-gray-700 font-medium'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <a
                              href={source.url}
                              onClick={(e) => handleSourceClick(source, e)}
                              className="text-gray-900 hover:text-gray-600 break-words font-medium relative group/link inline-flex items-center gap-2"
                            >
                              <span>{title}</span>
                              <svg className={`w-3.5 h-3.5 transition-colors duration-200 ${
                                selectedSources.has(index) ? 'text-gray-600' : 'text-gray-400'
                              }`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                            </a>
                          </div>
                          <p className={`text-sm line-clamp-2 leading-relaxed ${
                            selectedSources.has(index) ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {source.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};