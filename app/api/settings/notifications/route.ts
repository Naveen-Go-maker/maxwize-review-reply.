import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEMO_MODE, DEMO_NOTIFICATION_PREFS } from '@/lib/demo'

let demoNotifPrefs = { ...DEMO_NOTIFICATION_PREFS }

export async function GET() {
  try {
    if (DEMO_MODE) {
      return NextResponse.json({ success: true, data: demoNotifPrefs })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('notification_prefs')
      .select('*')
      .eq('user_id', authUser.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data ?? null })
  } catch (err) {
    console.error('[api/settings/notifications GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (DEMO_MODE) {
      const body = await request.json()
      demoNotifPrefs = { ...demoNotifPrefs, ...body }
      return NextResponse.json({ success: true, data: demoNotifPrefs })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email_enabled,
      email_frequency,
      whatsapp_enabled,
      whatsapp_number,
      weekly_summary,
    } = body

    const { data, error } = await supabase
      .from('notification_prefs')
      .upsert(
        {
          user_id: authUser.id,
          email_enabled: email_enabled ?? true,
          email_frequency: email_frequency ?? 'immediate',
          whatsapp_enabled: whatsapp_enabled ?? false,
          whatsapp_number: whatsapp_number || null,
          weekly_summary: weekly_summary ?? true,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[api/settings/notifications PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
