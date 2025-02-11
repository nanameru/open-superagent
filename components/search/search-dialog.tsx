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
  const [isComposing, setIsComposing] = useState(false)
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enterの場合は改行を許可
    if (e.key === 'Enter' && !e.shiftKey) {
      // 日本語入力中でない場合のみ送信
      if (!isComposing && value.trim()) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

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
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="メッセージを入力..."
                rows={1}
                className="w-full py-3.5 pl-4 pr-14 text-[15px] bg-gray-100 rounded-xl resize-none outline-none min-h-[52px] max-h-[300px] overflow-y-auto"
                style={{
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
              />
              <div className="absolute right-3 bottom-2.5">
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={!value.trim()}
                  className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:hover:bg-gray-900"
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
