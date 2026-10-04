import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  // Check for Firebase auth token.
  // NOTE: firebase-admin is imported lazily inside try/catch. If the Admin
  // SDK bundle fails to init in this runtime (missing/malformed service
  // account, bundling issue, …), fall through to /login instead of 500ing.
  // redirect() must stay OUTSIDE try/catch — it works by throwing.
  const cookieStore = await cookies()
  const idToken = cookieStore.get('firebase_token')?.value

  let authed = false
  if (idToken) {
    try {
      const { validateSession } = await import('@/lib/firebase/auth')
      authed = (await validateSession(idToken)) !== null
    } catch (err) {
      console.error('HomePage: session validation unavailable:', err)
      authed = false
    }
  }

  if (authed) {
    redirect('/dashboard')
  }

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      query.set(key, value)
    }
  }
  const queryString = query.toString()

  redirect(queryString ? `/login?${queryString}` : '/login')
}
