import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, fetchAccounts, getUserInfo } from '@/lib/google'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const origin = url.origin

  if (error) {
    return NextResponse.redirect(`${origin}/locations?error=google_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/locations?error=no_code`)
  }

  try {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.redirect(`${origin}/login`)
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/locations?error=no_token`)
    }

    // Fetch Google user info to get account ID
    const userInfo = await getUserInfo(tokens.access_token)

    // Fetch accounts to get the first account ID
    const accounts = await fetchAccounts(tokens.access_token, tokens.refresh_token ?? '')

    const accountId = accounts.length > 0
      ? accounts[0].name.split('/')[1] // Extract account ID from "accounts/{id}"
      : userInfo.id

    // Store tokens in user profile
    await supabase
      .from('users')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token ?? null,
        google_account_id: accountId,
      })
      .eq('id', authUser.id)

    return NextResponse.redirect(`${origin}/locations?connected=true`)
  } catch (err) {
    console.error('[api/auth/google/callback]', err)
    return NextResponse.redirect(`${origin}/locations?error=callback_failed`)
  }
}
