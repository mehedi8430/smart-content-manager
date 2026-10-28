import { SignupForm } from "@/app/signup/_components/signup-form"
import { AuthLayout } from "@/components/auth-layout"

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  )
}
