'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Source {
  text: string;
  url?: string;
  domain?: string;
}

interface SourceSidebarProps {
  sources: Source[];
  isVisible: boolean;
  onClose: () => void;
}

export const SourceSidebar = ({ sources, isVisible, onClose }: SourceSidebarProps) => {
  const [selectedSources, setSelectedSources] = useState<Set<number>>(new Set());

  const toggleSource = (index: number) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSources(newSelected);
  };

  const handleSourceClick = (source: Source, event: React.MouseEvent) => {
    if (source.url) {
      event.preventDefault();
      window.open(source.url, '_blank');
    }
  };

  const getDomainIcon = (index: number) => {
    const domains = ['ict-enews', 'tryeting', 'simplico', 'aismiley.co'];
    return index < domains.length ? domains[index] : null;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* オーバーレイ */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          
          {/* サイドバー */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-[480px]"
          >
            <div className="h-full bg-white overflow-hidden shadow-xl">
              {/* ヘッダー */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between p-4 border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-base font-medium text-gray-900">{sources.length} sources</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
              </motion.div>

              {/* ソースリスト */}
              <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {sources.map((source, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="group relative hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3 p-4">
                        {/* チェックボックス */}
                        <motion.div 
                          className="flex-shrink-0 mt-1 cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleSource(index)}
                        >
                          <div className={`
                            w-4 h-4 rounded border transition-colors
                            ${selectedSources.has(index) 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-300 hover:border-gray-400'
                            }
                          `}>
                            {selectedSources.has(index) && (
                              <motion.svg 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-4 h-4 text-white" 
                                viewBox="0 0 24 24" 
                                fill="none"
                              >
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </motion.svg>
                            )}
                          </div>
                        </motion.div>
                        
                        {/* ソース情報 */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={(e) => handleSourceClick(source, e)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-400">
                              {index + 1}.
                            </span>
                            {index < 4 && (
                              <div className="flex items-center gap-1.5">
                                <img 
                                  src={`/icons/source-${index + 1}.png`} 
                                  alt="" 
                                  className="w-4 h-4 rounded-sm"
                                />
                                <span className="text-xs font-medium text-gray-500">
                                  {getDomainIcon(index)}
                                </span>
                                {source.url && (
                                  <svg 
                                    className="w-3 h-3 text-gray-400" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor"
                                  >
                                    <path 
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed hover:text-blue-600 transition-colors">
                            {source.text}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}; 