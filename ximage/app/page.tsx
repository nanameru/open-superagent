'use client';

import { useState, useEffect } from 'react';
import GeminiImageGenerator from './components/GeminiImageGenerator';

export default function Home() {
  const [twitterId, setTwitterId] = useState('');
  const [submittedId, setSubmittedId] = useState('');
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!twitterId.trim()) {
      setError('XのIDを入力してください');
      return;
    }
    
    setError('');
    setSubmittedId(twitterId);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 pixel-font pixel-shadow bg-gradient-to-r from-secondary to-accent text-transparent bg-clip-text">
            PixelMe
          </h1>
          <div className="bg-card pixel-border p-4 max-w-xl mx-auto">
            <p className="text-lg md:text-xl text-foreground mb-0">
              あなたのX投稿からレトロゲーム風のピクセルアバターを生成
            </p>
          </div>
        </div>
        
        {/* Game console container */}
        <div className="w-full max-w-2xl bg-card rounded-lg overflow-hidden pixel-border mb-10">
          {/* Console top with fake buttons */}
          <div className="bg-background/30 p-3 flex justify-between items-center border-b border-border">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-accent"></div>
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <div className="w-3 h-3 rounded-full bg-primary"></div>
            </div>
            <div className="text-sm pixel-font text-muted">PixelMe v1.0</div>
          </div>
          
          {/* Main content area */}
          <div className="p-6 md:p-8">
            {!submittedId ? (
              <>
                {/* Start screen */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-4 pixel-font text-muted">PRESS START</h2>
                  <p className="text-sm text-muted mb-2">XのIDを入力して、あなただけのピクセルアバターを生成しましょう！</p>
                  <button 
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-xs underline text-muted hover:text-secondary transition-colors"
                  >
                    {showInstructions ? '説明を隠す' : '使い方を見る'}
                  </button>
                </div>
                
                {showInstructions && (
                  <div className="bg-background/20 p-4 rounded-md mb-6 text-sm text-muted">
                    <h3 className="font-bold mb-2 text-foreground">使い方:</h3>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>お使いのXアカウントのIDを入力（@は不要）</li>
                      <li>「アバターを生成」ボタンをクリック</li>
                      <li>AIがあなたの投稿を分析</li>
                      <li>レトロゲーム風のピクセルアバターが生成されます！</li>
                      <li>気に入ったらダウンロードしてプロフィールに設定しよう</li>
                    </ol>
                  </div>
                )}
                
                {/* Twitter ID input form */}
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="mb-4">
                    <label className="block text-foreground text-sm font-semibold mb-2 pixel-font" htmlFor="twitter-id">
                      X (Twitter) ID
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 bg-background/40 border border-r-0 border-border rounded-l-md text-muted">
                        @
                      </span>
                      <input
                        className="flex-1 appearance-none bg-background/20 border border-border rounded-r-md px-3 py-2 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        id="twitter-id"
                        type="text"
                        placeholder="username"
                        value={twitterId}
                        onChange={(e) => setTwitterId(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-accent text-xs mt-1">{error}</p>}
                  </div>
                  <button
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all pixel-border pixel-font uppercase tracking-wider"
                    type="submit"
                  >
                    アバターを生成
                  </button>
                </form>
              </>
            ) : (
              /* Results screen */
              <div className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold pixel-font text-foreground">
                    @{submittedId}さんのアバター
                  </h2>
                  <button
                    onClick={() => setSubmittedId('')}
                    className="text-xs pixel-font bg-background/30 hover:bg-background/50 text-muted px-3 py-1 rounded-md transition-colors"
                  >
                    ← 戻る
                  </button>
                </div>
                <GeminiImageGenerator
                  twitterId={submittedId}
                  onError={(err) => setError(err)}
                />
                
                {/* 結果画面での誘導バナー（ここだけ残す） */}
                <div className="mt-8 bg-primary/10 rounded-lg p-4 border border-primary/30 pixel-border">
                  <h3 className="text-center font-bold text-primary pixel-font text-lg mb-2">もっと楽しいAIアプリを試そう！</h3>
                  <p className="text-sm text-center mb-3">AIで遊ぶコミュニティで最新のAIアプリやテクニックを発見しよう</p>
                  <a 
                    href="https://www.ai-porseo.com/play-with-ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all text-center pixel-border pixel-font"
                  >
                    AIで遊ぶコミュニティに参加する
                  </a>
                </div>
              </div>
            )}
          </div>
          
          {/* Console bottom with fake d-pad */}
          <div className="bg-background/30 p-3 border-t border-border flex justify-between items-center">
            <div className="flex space-x-1">
              <div className="pixel-font text-xs text-muted">POWER</div>
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-muted rounded-full"></div>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-6 bg-muted rounded-sm"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-6 bg-muted rounded-sm"></div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-6 h-3 bg-muted rounded-sm"></div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-6 h-3 bg-muted rounded-sm"></div>
              </div>
              <div className="flex space-x-2">
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">A</div>
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold">B</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-8 text-center text-muted text-sm">
          <p>© 2024 PixelMe - レトロゲーム風アバター生成アプリ</p>
          <p className="mt-1 flex items-center justify-center flex-wrap gap-2">
            <span>Powered by:</span>
            <span className="font-semibold bg-primary/10 px-2 py-0.5 rounded">Next.js</span>
            <span className="font-semibold bg-primary/10 px-2 py-0.5 rounded">X API</span>
            <span className="font-semibold bg-primary/10 px-2 py-0.5 rounded">Google Gemini API</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
