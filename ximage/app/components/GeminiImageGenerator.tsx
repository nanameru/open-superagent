'use client';

import { useState, useEffect, useRef } from 'react';
import { GeminiImageResponse, CharacterStats } from '../lib/api/gemini';

interface GeminiImageGeneratorProps {
  twitterId?: string;
  tweetContent?: string[];
  onComplete?: (imageData: GeminiImageResponse) => void;
  onError?: (error: string) => void;
}

export default function GeminiImageGenerator({
  twitterId,
  tweetContent,
  onComplete,
  onError
}: GeminiImageGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<GeminiImageResponse | null>(null);
  const animationSpeed = 500; // 固定値として設定（変更不可）
  const [currentImage, setCurrentImage] = useState(0); // 0: 1枚目, 1: 2枚目
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [supportsWebM, setSupportsWebM] = useState(true);
  const [showStats, setShowStats] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const framesRef = useRef<ImageData[]>([]);
  const gifWorkerRef = useRef<Worker | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  
  // アニメーションの自動切り替え
  useEffect(() => {
    if (!imageData || !imageData.image1 || !imageData.image2) return;
    
    // 以前のインターバルをクリア
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    
    // 新しいインターバルを設定
    animationIntervalRef.current = setInterval(() => {
      setCurrentImage(prev => prev === 0 ? 1 : 0);
    }, animationSpeed);
    
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [imageData]);

  // ブラウザがサポートするミメタイプを確認
  useEffect(() => {
    // 各種形式のサポートをチェック
    const supportedFormats = [
      'video/webm; codecs=vp9',
      'video/webm; codecs=vp8,opus',
      'video/webm; codecs=vp8',
      'video/webm',
      'video/mp4; codecs=h264,aac',
      'video/mp4; codecs=h264',
      'video/mp4'
    ];
    
    const hasWebMSupport = supportedFormats.slice(0, 3).some(format => 
      MediaRecorder.isTypeSupported(format)
    );
    
    setSupportsWebM(hasWebMSupport);
    
    // Safari用の特別なメッセージをログ
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      console.log('Safari detected. Using compatible recording format.');
    }
    
    return () => {
      // クリーンアップ
      if (gifWorkerRef.current) {
        gifWorkerRef.current.terminate();
      }
    };
  }, []);

  // アニメーション録画機能
  const startRecording = async () => {
    if (!canvasRef.current || !imageData || isRecording) return;
    
    setCountdown(3);
    
    // カウントダウンタイマー
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          beginRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // 実際の録画処理
  const beginRecording = async () => {
    if (!canvasRef.current || !imageData) return;
    
    try {
      // キャンバスからストリームを取得（フレームレートを60fpsに増加）
      const stream = canvasRef.current.captureStream(60); // 60fps
      
      // ブラウザがサポートする最適なフォーマットを選択
      const supportedFormats = [
        'video/webm; codecs=vp9',
        'video/webm; codecs=vp8,opus',
        'video/webm; codecs=vp8',
        'video/webm',
        'video/mp4; codecs=h264,aac',
        'video/mp4; codecs=h264',
        'video/mp4'
      ];
      
      let mimeType = '';
      for (const format of supportedFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          console.log(`Using supported format: ${format}`);
          break;
        }
      }
      
      if (!mimeType) {
        console.warn('No specific MIME type is supported, using default');
      }
      
      // MediaRecorderを初期化（より高いビットレートを設定）
      const options: MediaRecorderOptions = mimeType 
        ? { 
            mimeType,
            videoBitsPerSecond: 8000000 // 8Mbps（高品質）
          }
        : {};
        
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      // 録画データを集める
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      // 録画が停止したときの処理
      mediaRecorderRef.current.onstop = () => {
        const blobType = mimeType || 'video/webm';
        const videoBlob = new Blob(chunksRef.current, { type: blobType });
        setVideoBlob(videoBlob);
        setIsRecording(false);
      };
      
      // 録画開始
      mediaRecorderRef.current.start();
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      
      // 8秒後に録画を自動停止（5秒から延長）
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          
          // 録画が正常に停止したというフィードバックをコンソールに表示
          console.log('Recording stopped after 8 seconds');
        }
      }, 8000);
      
    } catch (err) {
      console.error('録画の開始に失敗しました:', err);
      setError('録画の開始に失敗しました。お使いのブラウザが録画機能をサポートしていない可能性があります。別のブラウザをお試しください。');
      setIsRecording(false);
    }
  };
  
  // 録画停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };
  
  // キャンバスにアニメーションをレンダリング
  useEffect(() => {
    if (!canvasRef.current || !imageData || !imageData.image1 || !imageData.image2) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 1枚目の画像を読み込む
    const img1 = new Image();
    img1.src = `data:image/png;base64,${imageData.image1}`;
    
    // 2枚目の画像を読み込む
    const img2 = new Image();
    img2.src = `data:image/png;base64,${imageData.image2}`;
    
    // 両方の画像がロードされたら描画
    img1.onload = () => {
      img2.onload = () => {
        // 描画関数
        const draw = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // 現在のイメージを描画
          const currentImg = currentImage === 0 ? img1 : img2;
          
          // 画像の拡大率を調整（全体が表示されるようにさらに小さくする）
          const scale = 1.0; // 拡大率を1.3から1.0に変更（原寸大に）
          const scaledWidth = currentImg.width * scale;
          const scaledHeight = currentImg.height * scale;
          
          // 画像をキャンバスの中央に配置
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          
          // 背景を描画
          ctx.fillStyle = '#ffffff'; // グレーから白に変更
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // キャンバスボーダー
          ctx.strokeStyle = '#f0f0f0'; // より薄いグレーに変更
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
          
          // 白い枠を描画（サンプル画像のようなシンプルなデザイン）
          ctx.fillStyle = '#ffffff';
          // より広い余白を確保
          ctx.fillRect(x - 60, y - 60, scaledWidth + 120, scaledHeight + 120);
          
          // 外側の枠線を描画
          ctx.strokeStyle = '#f0f0f0'; // より薄いグレーに変更
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 60, y - 60, scaledWidth + 120, scaledHeight + 120);
          
          // 内側の枠を描画
          ctx.strokeStyle = '#f9f9f9'; // ほとんど見えないように
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 20, y - 20, scaledWidth + 40, scaledHeight + 40);
          
          // 画像を描画
          ctx.drawImage(currentImg, x, y, scaledWidth, scaledHeight);
          
          // カウントダウン表示
          if (countdown > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 80px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2);
          }
          
          // 録画中の表示
          if (isRecording) {
            // 録画中インジケーター（右上）
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(canvas.width - 40, 40, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // 録画時間表示
            const elapsedTimeMs = Date.now() - recordingStartTimeRef.current;
            const seconds = Math.floor(elapsedTimeMs / 1000);
            
            ctx.font = 'bold 16px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            ctx.fillText(`REC ${seconds}s / 8s`, canvas.width - 70, 45);
          }
          
          requestAnimationFrame(draw);
        };
        
        // アニメーションを開始
        draw();
      };
    };
  }, [imageData, currentImage, countdown, isRecording]);
  
  // 画像生成処理
  const generateImages = async () => {
    if (!twitterId && (!tweetContent || tweetContent.length === 0)) {
      setError('TwitterIDまたはツイート内容が必要です');
      onError?.('TwitterIDまたはツイート内容が必要です');
      return;
    }
    
    // すでにロード中の場合は重複リクエストを防止
    if (loading) {
      console.log('Already loading images, skipping duplicate request');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Generating avatar for Twitter ID:', twitterId);
      
      // 一意のリクエストIDを生成
      const requestId = Date.now().toString();
      
      // APIエンドポイントを呼び出して画像を生成
      const response = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify({
          twitterId,
          tweetContent,
          requestId
        }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data: GeminiImageResponse = await response.json();
      console.log('API response received, has image1:', !!data.image1, 'has image2:', !!data.image2, 'has stats:', !!data.stats);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.image1 || !data.image2) {
        console.error('Images missing from response:', data);
        throw new Error('画像の生成に失敗しました');
      }
      
      setImageData(data);
      onComplete?.(data);
      
      // ステータスがある場合は表示
      if (data.stats) {
        setShowStats(true);
      }
    } catch (err) {
      console.error('Error generating images:', err);
      const errorMessage = err instanceof Error ? err.message : '画像生成中にエラーが発生しました';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // コンポーネントがマウントされたら自動で生成開始（twitterIdまたはtweetContentがある場合）
  useEffect(() => {
    // 既に画像データがある場合や、ロード中の場合は何もしない
    if (loading || imageData) return;
    
    // requestIdを使って重複リクエストを防止
    const requestId = Math.random().toString(36).substring(2, 15);
    const localStorageKey = `pixel-me-request-${twitterId || 'custom'}`;
    
    // 最近のリクエストをチェック
    const lastRequest = localStorage.getItem(localStorageKey);
    const now = Date.now();
    
    if (lastRequest) {
      const { timestamp, id } = JSON.parse(lastRequest);
      
      // 10秒以内に同じTwitterIDでリクエストがあった場合はスキップ
      if (now - timestamp < 10000) {
        console.log('Skipping duplicate request within 10 seconds');
        return;
      }
    }
    
    // 新しいリクエスト情報を保存
    localStorage.setItem(localStorageKey, JSON.stringify({
      timestamp: now,
      id: requestId
    }));
    
    // twitterIdかtweetContentがある場合のみ実行
    if (twitterId || (tweetContent && tweetContent.length > 0)) {
      console.log('Initiating image generation with requestId:', requestId);
      generateImages();
    }
  }, [twitterId, tweetContent, loading, imageData]);
  
  // Twitterシェア用のURLを生成（動画付きシェアに変更）
  const generateTwitterShareUrl = () => {
    const baseUrl = 'https://twitter.com/intent/tweet';
    const text = encodeURIComponent(`レトロゲーム風のピクセルアバターを #PixelMe で生成してみたよ！\n\n▼ 自分も作ってみる
https://pixel-me.vercel.app`);
    const hashtags = encodeURIComponent('AI,ピクセルアート,レトロゲーム');
    
    return `${baseUrl}?text=${text}&hashtags=${hashtags}`;
  };
  
  return (
    <div className="w-full">
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-accent/10 border border-accent/30 text-accent px-4 py-3 rounded-md mb-4">
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs mt-1 opacity-80">ネットワーク接続を確認してください</p>
        </div>
      )}
      
      {/* ローディング表示 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative w-16 h-16">
            <div className="absolute w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex flex-col items-center mt-4">
            <p className="text-foreground pixel-font">GENERATING...</p>
            <div className="w-32 h-2 bg-background/30 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary animate-[pulse_2s_ease-in-out_infinite] w-1/2"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* 画像表示 */}
      {imageData && imageData.image1 && imageData.image2 && (
        <div className="flex flex-col items-center">
          {/* キャラクターとステータスの横並びレイアウト */}
          <div className="w-full flex flex-col md:flex-row md:items-start md:space-x-6">
            {/* キャラクター画像表示エリア */}
            <div className="md:w-1/2 flex flex-col items-center">
          <div className="relative w-64 h-64 border-4 border-border rounded-lg overflow-hidden bg-background/80 p-2 pixel-border">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-b from-primary/10 to-accent/10"></div>
              <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }}></div>
            </div>
            <img
              src={`data:image/png;base64,${currentImage === 0 ? imageData.image1 : imageData.image2}`}
              alt="Generated Pixel Avatar"
              className="pixelated w-full h-full object-contain relative z-10"
            />
          </div>
          
              {/* 録画用の非表示キャンバス */}
              <canvas 
                ref={canvasRef} 
                width="800" 
                height="800" 
                className="hidden" 
              />
          
          {/* 画像切り替えボタン */}
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => setCurrentImage(0)}
              className={`w-3 h-3 rounded-full transition-all ${currentImage === 0 ? 'bg-primary scale-125' : 'bg-muted'}`}
              aria-label="Switch to image 1"
            ></button>
            <button
              onClick={() => setCurrentImage(1)}
              className={`w-3 h-3 rounded-full transition-all ${currentImage === 1 ? 'bg-primary scale-125' : 'bg-muted'}`}
              aria-label="Switch to image 2"
            ></button>
              </div>
            </div>
            
            {/* ステータス表示エリア */}
            <div className="md:w-1/2 mt-6 md:mt-0">
              {/* キャラクターステータス表示 */}
              {imageData.stats && (
                <div className="w-full bg-background/20 p-4 rounded-md pixel-border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold pixel-font text-primary text-lg">キャラクターステータス</h3>
                    <button 
                      onClick={() => setShowStats(!showStats)}
                      className="text-xs text-muted hover:text-primary transition-colors"
                    >
                      {showStats ? '隠す' : '表示'}
                    </button>
                  </div>
                  
                  {showStats && (
                    <div className="space-y-3 text-sm animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">クラス:</span>
                        <span className="bg-primary/10 px-2 py-0.5 rounded text-primary">{imageData.stats.class}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">レベル:</span>
                        <span className="font-mono text-lg">{imageData.stats.level}</span>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">戦闘力:</span>
                          <span className="font-mono text-accent text-lg">{imageData.stats.power.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-accent rounded-full" 
                            style={{ width: `${Math.min(100, (imageData.stats.power / 9999) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="text-sm">知性</div>
                            <div className="font-medium">{imageData.stats.intelligence}</div>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${imageData.stats.intelligence}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="text-sm">創造性</div>
                            <div className="font-medium">{imageData.stats.creativity}</div>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-pink-500 rounded-full" 
                              style={{ width: `${imageData.stats.creativity}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="text-sm">技術力</div>
                            <div className="font-medium">{imageData.stats.techSkill}</div>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${imageData.stats.techSkill}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <div className="text-sm">運</div>
                            <div className="font-medium">{imageData.stats.luck}</div>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-yellow-500 rounded-full" 
                              style={{ width: `${imageData.stats.luck}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium mb-2">特技</div>
                          <div className="flex flex-wrap gap-2">
                            {imageData.stats.specialty.map((skill, index) => (
                              <div key={index} className="bg-secondary/10 px-3 py-1 rounded-full text-secondary font-medium text-sm">
                                {skill}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* コントロールボタンセクション - 横幅いっぱいに */}
          <div className="w-full mt-6">
            {/* 録画・ダウンロードボタン */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {!videoBlob ? (
                <button
                  onClick={startRecording}
                  disabled={isRecording || countdown > 0}
                  className={`w-full ${isRecording || countdown > 0 ? 'bg-gray-500' : 'bg-primary hover:bg-primary-hover'} text-white rounded-md px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary pixel-border pixel-font flex items-center justify-center`}
                >
                  {isRecording ? (
                    <>
                      <span className="animate-pulse mr-2">●</span>
                      録画中...
                    </>
                  ) : countdown > 0 ? (
                    `${countdown}秒後に録画開始...`
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      アニメーションを録画 (8秒)
                    </>
                  )}
                </button>
              ) : (
                <>
                  <a
                    href={URL.createObjectURL(videoBlob)}
                    download={supportsWebM ? "pixelme-avatar-animation.webm" : "pixelme-avatar-animation.mp4"}
                    className="bg-secondary text-white rounded-md px-4 py-2 transition-all hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary pixel-border pixel-font flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    動画をダウンロード
                  </a>
                  
                  <button
                    onClick={() => setVideoBlob(null)}
                    className="bg-accent/80 text-white rounded-md px-4 py-2 transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent pixel-border pixel-font flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    やり直す
                  </button>
                </>
              )}
            </div>
            
            {/* ダウンロードとシェアボタン */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:image/png;base64,${currentImage === 0 ? imageData.image1 : imageData.image2}`;
                  link.download = `pixel-avatar-${currentImage + 1}.png`;
                  link.click();
                }}
                className="bg-secondary text-white rounded-md px-4 py-2 transition-all hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary pixel-border pixel-font flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                画像保存
              </button>
              
              <a
                href={generateTwitterShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1DA1F2] text-white rounded-md px-4 py-2 transition-all hover:bg-[#1a94df] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DA1F2] pixel-border pixel-font flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4 mr-2" viewBox="0 0 16 16">
                  <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                </svg>
                Xでシェア
              </a>
            </div>
          </div>
          
          {/* Xシェアのヘルプメッセージ（動画がある場合のみ表示） */}
          {videoBlob && (
            <div className="mt-6 bg-primary/5 rounded-md p-4 text-sm border border-primary/20">
              <h4 className="font-bold pixel-font text-primary mb-2 text-center">Xで動画付きシェアする方法</h4>
              <ol className="list-decimal pl-5 space-y-2 text-foreground/90">
                <li>「動画をダウンロード」ボタンをタップして動画を保存</li>
                <li>
                  <a 
                    href={generateTwitterShareUrl()} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Xの投稿画面を開く
                  </a>
                </li>
                <li>投稿画面で「メディアを追加」ボタンをタップ</li>
                <li>ダウンロードした動画ファイルを選択</li>
                <li>投稿ボタンをタップして共有完了！</li>
              </ol>
              <div className="mt-3 flex justify-center">
                <a
                  href={generateTwitterShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[#1DA1F2] hover:text-[#1a94df] font-medium pixel-font text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4 mr-1" viewBox="0 0 16 16">
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                  </svg>
                  X投稿画面を開く
                </a>
              </div>
              
              {/* スマホ用のヒント */}
              <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                <div className="text-xs text-center text-blue-800">
                  <span className="font-semibold">動画のサイズについて:</span> 動画サイズが大きい（高画質）ため、ダウンロードに時間がかかる場合があります
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-yellow-50 rounded-md border border-yellow-200">
                <p className="text-xs text-center text-yellow-800">
                  <span className="font-semibold">注意:</span> iPhoneの場合は、「ファイル」アプリでダウンロードした動画を確認できます
                </p>
                {/^((?!chrome|android).)*safari/i.test(navigator.userAgent) && (
                  <p className="text-xs text-center text-yellow-800 mt-2">
                    <span className="font-semibold">Safariユーザー向け:</span> 動画が再生できない場合は、Chrome、Edge、Firefoxなどの他のブラウザを使用してみてください
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 生成ボタン（初期表示用） */}
      {!loading && !imageData && (
        <button
          onClick={generateImages}
          className="w-full bg-primary text-white rounded-md px-4 py-3 transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary pixel-border pixel-font"
        >
          ピクセルアバターを生成
        </button>
      )}
      
      {/* CSS for pixelated images */}
      <style jsx global>{`
        .pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
} 