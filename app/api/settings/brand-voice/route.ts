import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEMO_MODE, DEMO_BRAND_VOICE } from '@/lib/demo'

let demoBrandVoice = { ...DEMO_BRAND_VOICE }

export async function GET() {
  try {
    if (DEMO_MODE) {
      return NextResponse.json({ success: true, data: demoBrandVoice })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('brand_voice')
      .select('*')
      .eq('user_id', authUser.id)
      .is('location_id', null)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data ?? null })
  } catch (err) {
    console.error('[api/settings/brand-voice GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (DEMO_MODE) {
      const body = await request.json()
      demoBrandVoice = { ...demoBrandVoice, ...body }
      return NextResponse.json({ success: true, data: demoBrandVoice })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tone, language, owner_name, sign_off, custom_instructions, location_id } = body

    const upsertData = {
      user_id: authUser.id,
      location_id: location_id || null,
      tone: tone ?? 'professional',
      language: language ?? 'en',
      owner_name: owner_name || null,
      sign_off: sign_off || null,
      custom_instructions: custom_instructions || null,
    }

    const { data, error } = await supabase
      .from('brand_voice')
      .upsert(upsertData, { onConflict: 'user_id,location_id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[api/settings/brand-voice PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
