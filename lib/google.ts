import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { parseGoogleStarRating, extractLocationId, extractReviewId } from './utils'
import type { GoogleLocation, GoogleReview, GoogleAccount } from '@/types'

// ============================================================
// OAUTH CLIENT
// ============================================================

export function createOAuthClient(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

export function getAuthorizationUrl(): string {
  const client = createOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  })
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuthClient()
  const { tokens } = await client.getToken(code)
  return tokens
}

export function createAuthenticatedClient(accessToken: string, refreshToken?: string): OAuth2Client {
  const client = createOAuthClient()
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return client
}

// ============================================================
// GOOGLE MY BUSINESS API BASE
// ============================================================

async function makeGmbRequest<T>(
  accessToken: string,
  refreshToken: string,
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const client = createAuthenticatedClient(accessToken, refreshToken)

  // Ensure the token is fresh
  const { credentials } = await client.refreshAccessToken().catch(() => ({
    credentials: { access_token: accessToken },
  }))

  const token = credentials.access_token ?? accessToken

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorData: { error?: { message?: string; code?: number } } = {}
    try {
      errorData = JSON.parse(errorText)
    } catch {
      // Not JSON
    }

    if (response.status === 429) {
      throw new Error('Google API rate limit exceeded. Please try again later.')
    }
    if (response.status === 401) {
      throw new Error('Google authentication expired. Please reconnect your account.')
    }
    if (response.status === 403) {
      throw new Error('Insufficient permissions to access Google Business Profile.')
    }

    throw new Error(errorData.error?.message ?? `Google API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

// ============================================================
// ACCOUNTS
// ============================================================

export async function fetchAccounts(
  accessToken: string,
  refreshToken: string
): Promise<GoogleAccount[]> {
  const data = await makeGmbRequest<{ accounts?: GoogleAccount[] }>(
    accessToken,
    refreshToken,
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
  )
  return data.accounts ?? []
}

// ============================================================
// LOCATIONS
// ============================================================

export async function fetchLocations(
  accessToken: string,
  refreshToken: string,
  accountId: string
): Promise<GoogleLocation[]> {
  const allLocations: GoogleLocation[] = []
  let pageToken: string | undefined

  do {
    const url = new URL(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations`
    )
    url.searchParams.set('readMask', 'name,title,storefrontAddress,primaryCategory')
    url.searchParams.set('pageSize', '100')
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }

    const data = await makeGmbRequest<{
      locations?: Array<{
        name: string
        title: string
        storefrontAddress?: {
          addressLines?: string[]
          locality?: string
          administrativeArea?: string
          postalCode?: string
          regionCode?: string
        }
        primaryCategory?: {
          displayName: string
          categoryId: string
        }
      }>
      nextPageToken?: string
    }>(accessToken, refreshToken, url.toString())

    const locations = (data.locations ?? []).map((loc) => ({
      name: loc.name,
      locationName: loc.title,
      address: {
        addressLines: loc.storefrontAddress?.addressLines ?? [],
        locality: loc.storefrontAddress?.locality ?? '',
        administrativeArea: loc.storefrontAddress?.administrativeArea ?? '',
        postalCode: loc.storefrontAddress?.postalCode ?? '',
        regionCode: loc.storefrontAddress?.regionCode ?? '',
      },
      primaryCategory: {
        displayName: loc.primaryCategory?.displayName ?? 'Business',
        categoryId: loc.primaryCategory?.categoryId ?? '',
      },
    }))

    allLocations.push(...locations)
    pageToken = data.nextPageToken
  } while (pageToken)

  return allLocations
}

// ============================================================
// REVIEWS
// ============================================================

export async function fetchReviews(
  accessToken: string,
  refreshToken: string,
  accountId: string,
  locationId: string,
  options: { pageSize?: number; pageToken?: string } = {}
): Promise<{ reviews: GoogleReview[]; nextPageToken?: string; totalReviewCount?: number }> {
  const url = new URL(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`
  )
  url.searchParams.set('pageSize', String(options.pageSize ?? 50))
  if (options.pageToken) {
    url.searchParams.set('pageToken', options.pageToken)
  }

  const data = await makeGmbRequest<{
    reviews?: GoogleReview[]
    nextPageToken?: string
    totalReviewCount?: number
  }>(accessToken, refreshToken, url.toString())

  return {
    reviews: data.reviews ?? [],
    nextPageToken: data.nextPageToken,
    totalReviewCount: data.totalReviewCount,
  }
}

export async function fetchAllReviews(
  accessToken: string,
  refreshToken: string,
  accountId: string,
  locationId: string
): Promise<GoogleReview[]> {
  const allReviews: GoogleReview[] = []
  let pageToken: string | undefined

  do {
    const result = await fetchReviews(accessToken, refreshToken, accountId, locationId, {
      pageSize: 50,
      pageToken,
    })
    allReviews.push(...result.reviews)
    pageToken = result.nextPageToken

    // Rate limit protection
    if (pageToken) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  } while (pageToken)

  return allReviews
}

// ============================================================
// POST RESPONSE
// ============================================================

export async function postResponse(
  accessToken: string,
  refreshToken: string,
  accountId: string,
  locationId: string,
  reviewId: string,
  comment: string
): Promise<{ success: boolean }> {
  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`

  await makeGmbRequest(accessToken, refreshToken, url, {
    method: 'PUT',
    body: JSON.stringify({ comment }),
  })

  return { success: true }
}

export async function deleteResponse(
  accessToken: string,
  refreshToken: string,
  accountId: string,
  locationId: string,
  reviewId: string
): Promise<{ success: boolean }> {
  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`

  await makeGmbRequest(accessToken, refreshToken, url, {
    method: 'DELETE',
  })

  return { success: true }
}

// ============================================================
// TOKEN REFRESH
// ============================================================

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expiry_date?: number | null
}> {
  const client = createOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await client.refreshAccessToken()
  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date,
  }
}

// ============================================================
// USER INFO
// ============================================================

export async function getUserInfo(accessToken: string): Promise<{
  id: string
  email: string
  name: string
  picture: string
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Google user info')
  }

  return response.json()
}
