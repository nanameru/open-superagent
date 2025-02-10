import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">登録ありがとうございます！</h2>
            <p className="text-gray-600 dark:text-gray-300">
              確認メールを送信しました。<br />
              メールに記載されている確認リンクをクリックして、<br />
              登録を完了してください。
            </p>
            <Link 
              href="/sign-in" 
              className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ログインページに戻る →
            </Link>
          </div>
          <FormMessage message={searchParams} />
        </div>
      </div>
    );
  }

  return (
    <>
      <form className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-gray-900 dark:text-white">新規登録</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              すでにアカウントをお持ちの方は{" "}
              <Link className="font-medium text-gray-900 dark:text-white hover:underline" href="/sign-in">
                ログイン
              </Link>
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-900 dark:text-gray-200">ユーザー名</Label>
              <Input 
                name="username" 
                placeholder="お名前" 
                required 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-gray-200">メールアドレス</Label>
              <Input 
                name="email" 
                placeholder="you@example.com" 
                required 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-200">パスワード</Label>
              <Input
                type="password"
                name="password"
                placeholder="6文字以上のパスワード"
                minLength={6}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <SubmitButton 
              formAction={signUpAction} 
              pendingText="登録中..."
              className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              アカウント作成
            </SubmitButton>
            <FormMessage message={searchParams} />
          </div>
        </div>
      </form>
      <SmtpMessage />
    </>
  );
}
