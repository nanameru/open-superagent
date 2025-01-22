import SearchInput from '@/components/search';

export default async function Home() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#343541]">
      <div className="relative flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl space-y-6 px-4">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white">
              何かお手伝いできることはありますか？
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300">
              あらゆることに対応できるAIアシスタントです
            </p>
          </div>
          <SearchInput />
        </div>
      </div>
    </div>
  );
}
