'use client'

import { ArrowUpIcon } from 'lucide-react'
import Portal from '@/components/ui/portal'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (message: string) => void;
}

export default function SearchDialog({ isOpen, onClose, onSubmit }: SearchDialogProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const handleSubmit = () => {
    if (!value.trim()) return
    
    // エンコードされたクエリパラメーターを作成
    const encodedQuery = encodeURIComponent(value.trim())
    
    // 新しいページに遷移
    router.push(`/search/new?q=${encodedQuery}`)
    
    onSubmit?.(value.trim())
    setValue('')
    onClose()
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  // テキストエリアの高さを自動調整する関数
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 300); // 最大300px
      textarea.style.height = `${newHeight}px`;
    }
  };

  // 値が変更されたときに高さを調整
  useEffect(() => {
    adjustHeight();
  }, [value]);

  // Command + Enter handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [value, isOpen])

  if (!isOpen) return null;

  return (
    <Portal>
      <div 
        className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 animate-in fade-in duration-200" 
        onClick={onClose}
      >
        <div 
          className="relative w-[680px] animate-in slide-in-from-bottom-8 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Glass effect container */}
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.12)]" />
          
          {/* Content */}
          <div className="relative p-7">
            {/* Header */}
            <div className="mb-5 px-1 flex items-center justify-between">
              <div className="text-[13px] font-medium text-gray-500">
                XのリサーチをPitattoで効率化しよう！
              </div>
              <div className="text-[13px] font-medium px-3 py-1.5 rounded-xl bg-gray-900 text-white tracking-wide">
                Pro
              </div>
            </div>

            {/* Input area */}
            <div className="relative flex items-end group">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="メッセージを入力..."
                rows={1}
                className="w-full py-[18px] pl-6 pr-16 text-[15px] leading-relaxed bg-white text-gray-900 rounded-xl resize-none outline-none min-h-[64px] max-h-[300px] overflow-y-auto placeholder:text-gray-400 border-0 shadow-[0_2px_8px_rgb(0,0,0,0.06)] transition-all focus:shadow-[0_4px_16px_rgb(0,0,0,0.08)]"
                style={{
                  height: 'auto',
                  overflowY: value.split('\n').length > 10 ? 'auto' : 'hidden'
                }}
              />
              <div className="absolute right-3 bottom-[14px]">
                <button 
                  onClick={handleSubmit}
                  className="p-2.5 bg-gray-900 hover:bg-black rounded-xl text-white shadow-sm transition-all hover:shadow-md active:scale-95 hover:-translate-y-0.5 group"
                >
                  <ArrowUpIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
