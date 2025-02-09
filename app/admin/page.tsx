'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { useAdminCheck } from '@/hooks/use-admin-check'

interface AIToolForm {
  name: string
  description: string
  developer: string
  website_url: string
  pricing_type: string
  tags: string
}

const initialFormState: AIToolForm = {
  name: '',
  description: '',
  developer: '',
  website_url: '',
  pricing_type: 'free',
  tags: ''
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
}

export default function AdminPage() {
  const { isAdmin, isLoading } = useAdminCheck()
  const [formData, setFormData] = useState<AIToolForm>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // ローディング中は何も表示しない
  if (isLoading) {
    return null
  }

  // 管理者でない場合は何も表示しない（useAdminCheckでリダイレクトされる）
  if (!isAdmin) {
    return null
  }

  const handleFileSelect = (file: File) => {
    // ファイルサイズチェック（2MB制限）
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      alert('ファイルサイズは2MB以下にしてください')
      return
    }
    setSelectedFile(file)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const supabase = createClient()
    
    try {
      // ファイル名をユニークにする
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `tool-logos/${fileName}`

      // ファイルサイズの再チェック
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        throw new Error('ファイルサイズは2MB以下にしてください')
      }

      // 画像ファイルの圧縮
      let compressedFile = file
      if (file.type.startsWith('image/')) {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = URL.createObjectURL(file)
        })

        // 画像のサイズを調整（最大幅/高さ1000px）
        let width = img.width
        let height = img.height
        const maxDimension = 1000

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)

        // 圧縮された画像データを取得
        const compressedBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!)
          }, 'image/jpeg', 0.8) // JPEG形式で品質80%
        })
        
        compressedFile = new File([compressedBlob], fileName, {
          type: 'image/jpeg'
        })
      }

      const { error: uploadError, data } = await supabase.storage
        .from('AI_tools')  // バケット名を修正
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('画像のアップロードに失敗しました')
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('AI_tools')  // バケット名を修正
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error in uploadImage:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      let logoUrl = ''

      // 画像がある場合はアップロード
      if (selectedFile) {
        logoUrl = await uploadImage(selectedFile)
      }
      
      // タグを配列に変換
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)

      const { error } = await supabase
        .from('ai_tools')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            developer: formData.developer,
            website_url: formData.website_url,
            logo_url: logoUrl,
            pricing_type: formData.pricing_type,
            tags: tagsArray
          }
        ])

      if (error) throw error

      alert('AIツールが正常に登録されました')
      setFormData(initialFormState)
      setSelectedFile(null)
    } catch (error) {
      console.error('Error adding AI tool:', error)
      alert('AIツールの登録に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <motion.div 
      className="flex-1 overflow-hidden bg-white"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center space-x-4">
          <div className="rounded-lg bg-gray-100 p-2">
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AIツール管理</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>新規AIツール登録</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">ツール名 *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明 *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="developer">開発者</Label>
                <Input
                  id="developer"
                  name="developer"
                  value={formData.developer}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">ウェブサイトURL</Label>
                <Input
                  id="website_url"
                  name="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label>ロゴ画像</Label>
                <FileUpload onFileSelect={handleFileSelect} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricing_type">価格タイプ *</Label>
                <select
                  id="pricing_type"
                  name="pricing_type"
                  value={formData.pricing_type}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="free">無料</option>
                  <option value="paid">有料</option>
                  <option value="freemium">フリーミアム</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">タグ（カンマ区切り）</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="AI, デザイン, 自動化"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? '登録中...' : 'AIツールを登録'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
