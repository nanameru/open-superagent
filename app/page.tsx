import SearchInput from '@/components/search';

export default async function Home() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0A0A0A]">
      <div className="relative flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl space-y-6 px-4">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-[#E0E0E0] whitespace-nowrap">
              何かお手伝いできることはありますか？
            </h1>
            <p className="text-base text-gray-600 dark:text-[#808080]">
              Xの検索に特化したAI検索ツールです。
            </p>
          </div>
          <SearchInput />
        </div>
      </div>
    </div>
  );
}
