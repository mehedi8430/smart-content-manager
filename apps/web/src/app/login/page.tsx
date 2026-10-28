import { LoginForm } from "@/app/login/_components/login-form"
import { AuthLayout } from "@/components/auth-layout"

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
