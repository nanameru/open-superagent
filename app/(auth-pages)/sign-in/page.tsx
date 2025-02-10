import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <form className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter text-gray-900 dark:text-white">おかえりなさい</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            アカウントをお持ちでない方は{" "}
            <Link className="font-medium text-gray-900 dark:text-white hover:underline" href="/sign-up">
              新規登録
            </Link>
          </p>
        </div>
        <div className="space-y-4">
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
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-200">パスワード</Label>
              <Link
                className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                href="/forgot-password"
              >
                パスワードをお忘れの方
              </Link>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="パスワードを入力"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <SubmitButton 
            pendingText="ログイン中..." 
            formAction={signInAction}
            className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            ログイン
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </div>
    </form>
  );
}
