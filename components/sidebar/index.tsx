import Logo from './logo'
import NewThread from './new-thread'
import Navigation from './navigation'
import AuthButtons from './auth-buttons'

export default function Sidebar() {
  return (
    <div className="fixed left-0 top-0 h-full w-[280px] bg-[#f9f9f9] dark:bg-[#000000] z-50 flex flex-col">
      <Logo />
      <NewThread />
      <Navigation />
      <AuthButtons />
    </div>
  )
}
