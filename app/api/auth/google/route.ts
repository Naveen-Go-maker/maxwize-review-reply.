import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/google'

export async function GET() {
  try {
    const url = getAuthorizationUrl()
    return NextResponse.json({ success: true, data: { url } })
  } catch (error) {
    console.error('[api/auth/google]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}
