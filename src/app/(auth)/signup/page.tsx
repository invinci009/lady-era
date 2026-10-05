import { redirect } from 'next/navigation'

// Registration is disabled — this is a single-tenant white-label app.
export default function SignupPage() {
  redirect('/login')
}
