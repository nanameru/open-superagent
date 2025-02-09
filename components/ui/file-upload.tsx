'use client'

import { ChangeEvent, useState } from 'react'
import { Upload } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  preview?: string
}

export function FileUpload({ onFileSelect, accept = 'image/*', preview }: FileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(preview || '')

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      // プレビュー用のURL作成
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="mb-3 h-10 w-10 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">クリックしてアップロード</span>
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF (最大 2MB)</p>
        </div>
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
        />
      </label>
      {previewUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  )
}
