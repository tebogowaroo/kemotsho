"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@kemotsho/core/infra/firebase/client"
import { initiateLoginAction, verifyMfaAction } from "@/app/actions/mfa"
import { Button } from "@kemotsho/core/ui/button"
import { Input } from "@kemotsho/core/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@kemotsho/core/ui/card"
import { Label } from "@kemotsho/core/ui/label"
import Link from "next/link"

function LoginForm() {
  const searchParams = useSearchParams()
  // Initialize email from URL if present
  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [password, setPassword] = useState("")
  // MFA State
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [otp, setOtp] = useState("")
  const [tempIdToken, setTempIdToken] = useState<string | null>(null)
  const [mfaUserId, setMfaUserId] = useState<string | null>(null)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const redirectUrl = searchParams.get("redirect") || "/admin/dashboard"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await cred.user.getIdToken()
      
      // Step 1: Initiate Login (Check MFA)
      // We no longer create session immediately. We request OTP.
      const res = await initiateLoginAction(idToken)

      if (res.success && res.requireMfa && res.userId) {
          setTempIdToken(idToken)
          setMfaUserId(res.userId)
          setStep('mfa')
          setLoading(false)
      } else if (res.success === false) {
          setError(res.error || "Login failed")
          setLoading(false)
      } else {
         // Fallback currently shouldn't suffice as we enforce universal 2FA
         setError("Unexpected login state. Please contact support.")
         setLoading(false)
      }
    } catch (err: any) {
      console.error(err)
      setError("Invalid email or password.")
      setLoading(false)
    }
  }

  const handleMfaVerify = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!tempIdToken || !mfaUserId) return 
      
      setLoading(true)
      setError("")
      
      try {
          const res = await verifyMfaAction(mfaUserId, otp, tempIdToken)
          
          if (res.success && res.redirectPath) {
            router.refresh() // Sync cookies
            
            // Smart Redirect Logic
            const intended = searchParams.get("redirect")
            const isIntendedAdmin = intended?.startsWith("/admin")
            const isUserAdmin = res.redirectPath.startsWith("/admin")

            // Only honor the intended redirect if it matches the user's role capabilities
            if (intended && (!isIntendedAdmin || isUserAdmin)) {
                router.push(intended)
            } else {
                router.push(res.redirectPath)
            }
          } else {
              setError(res.error || "Verification failed")
              setLoading(false)
          }
      } catch (e: any) {
          setError(e.message || "System error")
          setLoading(false)
      }
  }

  return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {step === 'credentials' ? "Sign In" : "Identity Verification"}
          </CardTitle>
          {step === 'mfa' && (
              <CardDescription className="text-center">
                  We sent a 6-digit code to your email.
              </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {step === 'credentials' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="email@example.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                </div>
                {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Sign In"}
                </Button>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  Don&apos;t have an account?{" "}
                  <Link href={`/register${redirectUrl !== "/admin/dashboard" ? `?redirect=${redirectUrl}` : ""}`} className="text-blue-600 hover:underline">
                    Create Account
                  </Link>
                </div>
              </form>
          ) : (
              <form onSubmit={handleMfaVerify} className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input 
                        id="otp" 
                        type="text" 
                        placeholder="123456"
                        className="text-center text-lg tracking-widest"
                        maxLength={6}
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))} 
                        required 
                      />
                  </div>
                   {error && <p className="text-sm font-medium text-red-600 text-center">{error}</p>}
                   <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Verifying..." : "Verify Check"}
                   </Button>
                   <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full mt-2"
                    onClick={() => {
                        setStep('credentials')
                        setPassword("")
                        setError("")
                        setLoading(false)
                        setOtp("")
                    }}
                   >
                       Back to Login
                   </Button>
              </form>
          )}
        </CardContent>
      </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
