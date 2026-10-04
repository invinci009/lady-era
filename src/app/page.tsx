import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/firebase/auth'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  // Check for Firebase auth token
  const cookieStore = await cookies()
  const idToken = cookieStore.get('firebase_token')?.value

  if (idToken) {
    const user = await validateSession(idToken)
    if (user) {
      redirect('/dashboard')
    }
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
