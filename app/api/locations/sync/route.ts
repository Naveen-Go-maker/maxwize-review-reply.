import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchLocations, fetchAllReviews } from '@/lib/google'
import { parseGoogleStarRating } from '@/lib/utils'
import { PLANS } from '@/lib/constants'
import { DEMO_MODE, DEMO_LOCATIONS } from '@/lib/demo'

export async function POST() {
  try {
    if (DEMO_MODE) {
      return NextResponse.json({
        success: true,
        data: { locations: DEMO_LOCATIONS, new_reviews: 0 },
      })
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!user?.google_access_token || !user?.google_account_id) {
      return NextResponse.json(
        { success: false, error: 'Google Business Profile not connected' },
        { status: 400 }
      )
    }

    const planConfig = PLANS[user.plan]

    // Fetch locations from Google
    const googleLocations = await fetchLocations(
      user.google_access_token,
      user.google_refresh_token ?? '',
      user.google_account_id
    )

    // Enforce location limits
    const locationsToSync = googleLocations.slice(0, planConfig.maxLocations)
    const upsertedLocations = []

    for (const googleLocation of locationsToSync) {
      const locationId = googleLocation.name.split('/').pop()!
      const addressParts = [
        ...(googleLocation.address.addressLines ?? []),
        googleLocation.address.locality,
        googleLocation.address.administrativeArea,
      ].filter(Boolean)

      const { data: loc, error } = await supabase
        .from('locations')
        .upsert(
          {
            user_id: authUser.id,
            google_location_id: locationId,
            name: googleLocation.locationName,
            address: addressParts.join(', '),
            category: googleLocation.primaryCategory?.displayName ?? null,
            is_active: true,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,google_location_id' }
        )
        .select()
        .single()

      if (loc) upsertedLocations.push(loc)
    }

    // Sync reviews for each location
    let totalNewReviews = 0

    for (const location of upsertedLocations) {
      try {
        const googleReviews = await fetchAllReviews(
          user.google_access_token,
          user.google_refresh_token ?? '',
          user.google_account_id,
          location.google_location_id
        )

        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('google_review_id')
          .eq('location_id', location.id)

        const existingIds = new Set(existingReviews?.map((r) => r.google_review_id) ?? [])

        for (const gr of googleReviews) {
          if (!existingIds.has(gr.reviewId)) {
            const rating = parseGoogleStarRating(gr.starRating)
            await supabase.from('reviews').insert({
              location_id: location.id,
              google_review_id: gr.reviewId,
              reviewer_name: gr.reviewer.isAnonymous ? 'Anonymous' : gr.reviewer.displayName,
              reviewer_photo_url: gr.reviewer.isAnonymous ? null : gr.reviewer.profilePhotoUrl,
              rating,
              text: gr.comment || null,
              review_language: 'en',
              google_created_at: gr.createTime,
            })
            totalNewReviews++
          }
        }

        await supabase
          .from('locations')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', location.id)
      } catch (locationError) {
        console.error(`Failed to sync reviews for location ${location.id}:`, locationError)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        locations: upsertedLocations,
        new_reviews: totalNewReviews,
      },
    })
  } catch (err) {
    console.error('[api/locations/sync POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
