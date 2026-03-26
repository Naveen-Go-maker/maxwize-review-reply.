import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { DEMO_MODE, DEMO_USER, DEMO_USAGE } from '@/lib/demo'
import { getCurrentMonth } from '@/lib/utils'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  let usage = null

  if (DEMO_MODE) {
    user = DEMO_USER
    usage = DEMO_USAGE
  } else {
    // Dynamically import Supabase only when not in demo mode
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) redirect('/login')

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!userProfile) redirect('/login')
    user = userProfile

    const currentMonth = getCurrentMonth()
    const { data: usageData } = await supabase
      .from('usage_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .single()
    usage = usageData
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} usage={usage} />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
