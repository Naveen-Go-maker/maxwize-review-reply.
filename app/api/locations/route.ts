import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEMO_MODE, DEMO_LOCATIONS } from '@/lib/demo'

export async function GET() {
  try {
    if (DEMO_MODE) {
      return NextResponse.json({ success: true, data: DEMO_LOCATIONS })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: locations })
  } catch (err) {
    console.error('[api/locations GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, is_active } = body

    if (DEMO_MODE) {
      const location = DEMO_LOCATIONS.find((l) => l.id === id)
      if (!location) {
        return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: { ...location, is_active } })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Location ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('locations')
      .update({ is_active })
      .eq('id', id)
      .eq('user_id', authUser.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[api/locations PATCH]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
