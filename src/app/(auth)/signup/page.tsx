import { redirect } from 'next/navigation'

// Registration is disabled — this is a single-tenant app for PM Zaika Restaurant only.
export default function SignupPage() {
  redirect('/login')
}
