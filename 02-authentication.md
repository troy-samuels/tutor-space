# 02 - Authentication

## Objective

Implement secure authentication with email/password and OAuth (Google, Facebook) using Supabase Auth. Create login, signup, password reset flows, and protected route middleware.

## Prerequisites

- Completed **00-project-setup.md** and **01-database-schema.md**
- Supabase project with Auth enabled
- Email templates configured in Supabase (optional but recommended)

## Features to Build

- Email/password signup and login
- Google OAuth
- Password reset flow
- Protected routes
- Auth state management
- User session handling
- Role-based access control
- Subscription-aware feature gating (Professional vs Growth vs Studio)
- Student portal access checks for shared resources, packages, and AI transcripts

## Implementation Steps

### Step 1: Configure Supabase Auth

In Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled by default)
3. Enable **Google** provider:
   - Create OAuth credentials in Google Cloud Console
   - Add authorized redirect URI: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase
4. Configure **Email Templates** (optional):
   - Customize signup confirmation email
   - Customize password reset email
   - Add your branding
5. Set **User Metadata Defaults**:
   - In Supabase Auth settings, set `user_metadata.plan` default to `'professional'`
   - Store `role` and preferred language in metadata for onboarding personalization
   - Create an admin note documenting how to upgrade users to Growth/Studio tiers

### Step 2: Create Auth Actions

Create `lib/actions/auth.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
        role: formData.get('role') as string || 'tutor',
        plan: 'professional',
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  // Queue onboarding job to seed subscriptions, default package templates, and resource folders

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

type OAuthProvider = 'google'

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

### Step 3: Create Auth Callback Route

Create `app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return to error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/error`)
}
```

### Step 4: Create Login Page

Create `app/(auth)/login/page.tsx`:

```typescript
import { signIn, signInWithOAuth } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your tutor account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="space-y-2">
            <form action={signInWithOAuth.bind(null, 'google')}>
              <Button type="submit" variant="outline" className="w-full">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>
            </form>
          </div>

          <div className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 5: Create Signup Page

Create `app/(auth)/signup/page.tsx`:

```typescript
import { signUp, signInWithOAuth } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Get started with your tutor platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="space-y-2">
            <form action={signInWithOAuth.bind(null, 'google')}>
              <Button type="submit" variant="outline" className="w-full">
                {/* Google icon SVG */}
                Sign up with Google
              </Button>
            </form>
          </div>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 6: Create Protected Route Middleware

Update your existing `middleware.ts`:

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { createClient } from './lib/supabase/server'

export async function middleware(request: NextRequest) {
  // Update session
  const response = await updateSession(request)

  // Protected routes check
  const protectedRoutes = ['/dashboard', '/settings', '/students', '/bookings']
  const growthRoutes = ['/growth', '/ads', '/leads']
  const studioRoutes = ['/studio', '/group-sessions', '/marketplace', '/ceo']

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isGrowthRoute = growthRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isStudioRoute = studioRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    if (isGrowthRoute || isStudioRoute) {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const plan = data?.[0]?.plan_name ?? 'professional'
      const hasGrowthAccess = plan === 'growth' || plan === 'studio'
      const hasStudioAccess = plan === 'studio'

      if (isStudioRoute && !hasStudioAccess) {
        return NextResponse.redirect(new URL('/upgrade?plan=studio', request.url))
      }

      if (isGrowthRoute && !hasGrowthAccess) {
        return NextResponse.redirect(new URL('/upgrade?plan=growth', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

> **Plan-aware routing** keeps Growth and Studio-only routes behind `/upgrade` CTAs so Professional users see a friendly upsell instead of a 403.

### Step 7: Create Auth Hook

Create `lib/hooks/useAuth.ts`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

type Entitlements = {
  plan: 'professional' | 'growth' | 'studio'
  growth: boolean
  studio: boolean
}

const DEFAULT_ENTITLEMENTS: Entitlements = {
  plan: 'professional',
  growth: false,
  studio: false,
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [entitlements, setEntitlements] =
    useState<Entitlements>(DEFAULT_ENTITLEMENTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await Promise.all([
          loadProfile(session.user.id),
          loadEntitlements(session.user.id),
        ])
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        await Promise.all([
          loadProfile(session.user.id),
          loadEntitlements(session.user.id),
        ])
      } else {
        setUser(null)
        setProfile(null)
        setEntitlements(DEFAULT_ENTITLEMENTS)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
    }
  }

  async function loadEntitlements(userId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    const plan = (data?.[0]?.plan_name as Entitlements['plan']) ?? 'professional'
    setEntitlements({
      plan,
      growth: plan === 'growth' || plan === 'studio',
      studio: plan === 'studio',
    })
  }

  return { user, profile, entitlements, loading }
}
```

### Step 8: Create User Context Provider

Create `components/providers/auth-provider.tsx`:

```typescript
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

type AuthContextType = ReturnType<typeof useAuth>

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  entitlements: {
    plan: 'professional',
    growth: false,
    studio: false,
  },
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => useContext(AuthContext)
```

Update `app/layout.tsx` to include the provider:

```typescript
import { AuthProvider } from '@/components/providers/auth-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

### Step 9: Create Password Reset Pages

Create `app/(auth)/forgot-password/page.tsx`:

```typescript
import { resetPassword } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={resetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-blue-600 hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

Create `app/(auth)/reset-password/page.tsx`:

```typescript
import { updatePassword } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>
            <Button type="submit" className="w-full">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 10: Build Auth UI Components

Create `components/auth/auth-loader.tsx`:

```typescript
'use client'

import { Loader2 } from 'lucide-react'

type AuthLoaderProps = {
  label?: string
}

export function AuthLoader({ label = 'Checking authentication...' }: AuthLoaderProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
```

Create `components/auth/auth-button.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthContext } from '@/components/providers/auth-provider'
import { AuthLoader } from './auth-loader'

export function AuthButton() {
  const { user, profile, loading } = useAuthContext()

  if (loading) {
    return <AuthLoader />
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link href="/login">Sign in</Link>
      </Button>
    )
  }

  const displayName = profile?.full_name ?? user.email ?? 'Account'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col text-left">
        <span className="text-sm font-medium">{displayName}</span>
        <span className="text-xs text-muted-foreground capitalize">
          {profile?.role ?? 'member'}
        </span>
      </div>
      <form action={signOut}>
        <Button type="submit" size="sm" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  )
}
```

Create `components/auth/protected-route.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { AuthLoader } from './auth-loader'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!loading && !user) {
      const params = new URLSearchParams()
      const hasQuery = searchParams.toString()

      params.set('redirect', hasQuery ? `${pathname}?${hasQuery}` : pathname)
      router.replace(`/login?${params.toString()}`)
    }
  }, [user, loading, router, pathname, searchParams])

  if (loading || !user) {
    return <AuthLoader />
  }

  return <>{children}</>
}
```

Create `components/auth/role-guard.tsx`:

```typescript
'use client'

import { ReactNode } from 'react'
import { Profile } from '@/lib/types'
import { useAuthContext } from '@/components/providers/auth-provider'
import { AuthLoader } from './auth-loader'

type RoleGuardProps = {
  allow: Array<Profile['role']>
  fallback?: ReactNode
  children: ReactNode
}

export function RoleGuard({ allow, fallback = null, children }: RoleGuardProps) {
  const { profile, loading } = useAuthContext()

  if (loading) {
    return <AuthLoader label="Loading permissions..." />
  }

  if (!profile || !allow.includes(profile.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
```

Use the components inside protected layouts, e.g. wrap your dashboard layout:

```typescript
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
```

### Step 11: Enhance Error Handling & Feedback

Update `lib/actions/auth.ts` to return structured form states:

```typescript
type AuthFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export const AUTH_FORM_INITIAL_STATE: AuthFormState = { status: 'idle' }

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    if (error.status === 429) {
      return {
        status: 'error',
        message: 'Too many attempts. Please wait a moment before trying again.',
      }
    }

    return {
      status: 'error',
      message: error.message ?? 'Unable to sign in. Double-check your credentials.',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
```

Apply the same pattern to `signUp`, `resetPassword`, and `updatePassword` so every action returns `{ status, message }` on failure.

Update `app/(auth)/login/page.tsx` to display inline errors and toast notifications:

```typescript
'use client'

import { useEffect } from 'react'
import { useFormState } from 'react-dom'
import { signIn, AUTH_FORM_INITIAL_STATE } from '@/lib/actions/auth'
import { useToast } from '@/components/ui/use-toast'
// existing imports...

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, AUTH_FORM_INITIAL_STATE)
  const { toast } = useToast()

  useEffect(() => {
    if (state.status === 'error' && state.message) {
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: state.message,
      })
    }
  }, [state, toast])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      {/* ... */}
      <form action={formAction} className="space-y-4">
        {/* fields */}
        {state.status === 'error' && state.message ? (
          <p className="text-sm text-red-500">{state.message}</p>
        ) : null}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
      {/* ... */}
    </div>
  )
}
```

Mirror the update for the signup and password reset pages. Log unexpected errors to `console.error` (server-side) or to your logging service to aid debugging.

### Step 12: Harden Auth Security & Sessions

In Supabase Dashboard → **Authentication** → **Settings**:

1. Increase password requirements (length, uppercase, numeric, symbol).
2. Enable **Confirm email** for new users if you want double opt-in.
3. Turn on **Refresh token rotation** and set a reasonable **Refresh token reuse interval**.
4. Configure **Rate limits** for email OTP/password reset to prevent abuse.
5. Review OAuth provider settings (Google, Facebook) for correct production callback URLs before launch.

Add server-side validations:

```typescript
const password = formData.get('password') as string
if (!password || password.length < 8) {
  return { status: 'error', message: 'Password must be at least 8 characters.' }
}
```

Set strict cookie settings in `lib/supabase/server.ts`:

```typescript
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}
```

Consider adding CAPTCHA to public forms, logging authentication events to a monitoring tool (PostHog, Sentry), and scheduling a quarterly review of Supabase security settings.

### Step 13: Wire Auth Components into the UI

1. Protect authenticated areas by wrapping layouts:

```typescript
// app/(dashboard)/layout.tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
```

2. Use `AuthButton` in navigation and headers:

```typescript
// components/navigation/top-nav.tsx
'use client'

import Link from 'next/link'
import { AuthButton } from '@/components/auth/auth-button'

export function TopNav() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/dashboard" className="text-lg font-semibold">
        Tutor Platform
      </Link>
      <AuthButton />
    </header>
  )
}
```

3. Gate feature sections by role:

```typescript
// app/(dashboard)/admin/page.tsx
import { RoleGuard } from '@/components/auth/role-guard'

export default function AdminPage() {
  return (
    <RoleGuard allow={['admin']} fallback={<p>Access denied</p>}>
      {/* admin-only content */}
    </RoleGuard>
  )
}
```

4. Gate premium sections by plan using `entitlements` from the auth context:

```typescript
// components/dashboard/growth-wall.tsx
'use client'

import { useAuthContext } from '@/components/providers/auth-provider'

export function GrowthWall({ children }: { children: React.ReactNode }) {
  const { entitlements, loading } = useAuthContext()

  if (loading) return null

  if (!entitlements.growth) {
    return (
      <div className="rounded border border-dashed p-6 text-center">
        <h3 className="text-lg font-semibold">Upgrade to Growth</h3>
        <p className="text-sm text-muted-foreground">
          Unlock ad campaigns, lead hub, and the AI marketing suite.
        </p>
        {/* Upgrade CTA */}
      </div>
    )
  }

  return <>{children}</>
}
```

5. Avoid hydration mismatches by only reading auth state inside client components. Server components should rely on Supabase server helpers (`createClient`) or pass serialized props from loaders.

### Step 14: Add Auth E2E Tests & Monitoring

1. Install Playwright and scaffold tests:

```bash
npx playwright install
npx playwright codegen http://localhost:3000
```

2. Create `tests/auth.spec.ts` covering:
   - Email/password signup and login
   - Google/Facebook OAuth redirects (use `storageState` mocks or skip in CI)
   - Protected route redirect when signed out
   - Password reset request flow (assert success toast)

```typescript
import { test, expect } from '@playwright/test'

test('redirects anonymous user from dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})
```

3. Enable Supabase Auth logs & alerts:
   - Supabase Dashboard → **Logs** → create alert for repeated login failures
   - Connect to Slack/Email for security notifications

4. If you use Sentry or PostHog, forward auth errors with `console.error` hooks in server actions:

```typescript
if (error) {
  console.error('[auth:sign-in]', error)
  // Sentry.captureException(error)
  return { status: 'error', message: 'Unable to sign in right now.' }
}
```

### Step 15: Polish UX for Accessibility & Mobile

1. Add loading states to buttons during form submission with `useFormStatus`:

```tsx
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign In'}
    </Button>
  )
}
```

2. Provide semantic feedback using `aria-live` regions for errors/success messages:

```tsx
<p role="status" aria-live="polite" className="text-sm text-red-500">
  {state.status === 'error' ? state.message : null}
</p>
```

3. Ensure social login buttons have accessible labels:

```tsx
<Button type="submit" variant="outline" className="w-full" aria-label="Continue with Google">
  {/* icon + text */}
</Button>
```

4. Test forms on mobile devices:
   - Verify virtual keyboard doesn't obscure inputs (tailwind `pb-24` spacer if needed).
   - Use responsive grid to keep layout single-column below `md`.
   - Enable `inputMode` attributes where applicable (`inputMode="email"`).

5. Surface auth status in the header for screen readers (`aria-live="polite"` on avatar area).

6. Document edge cases (account locked, email not confirmed) and update copy to guide users back to the app.

### Step 16: Deployment & Environment Checklist

1. Staging verification:
   - Push migrations and Supabase policies to staging project.
   - Run Playwright suite against staging URL (`PLAYWRIGHT_TEST_BASE_URL` env).
   - Validate Google/Facebook OAuth redirect URIs for staging and production.

2. Environment variables:
   - `NEXT_PUBLIC_APP_URL` set per environment (development, staging, production).
   - Store Supabase keys and OAuth secrets in Vercel/Netlify environment settings (never commit them).
   - Rotate Supabase service role key if shared publicly during development.

3. Middleware & edge:
   - Confirm `middleware.ts` behaves correctly on Vercel Edge (no node-specific APIs).
   - Monitor edge-specific logs for auth exchanges.

4. Incident preparedness:
   - Create a runbook describing password reset flow, provider outages, and how to disable auth temporarily.
   - Set up uptime monitoring (e.g., Vercel checks or Pingdom) for `/login` and `/auth/callback`.

5. Final go-live checklist:
   - ✅ Staging E2E tests pass
   - ✅ OAuth providers approved by Google/Facebook (production status)
   - ✅ Email templates localized and branded
   - ✅ Logging/alerting enabled
   - ✅ Documentation updated with support escalation contacts

### Step 17: Keep Profile Data in Sync

1. Ensure `profiles` table trigger is active (from `01-database-schema.md`) so new users get a profile row automatically.
2. Add a Supabase Edge Function (`supabase/functions/sync-profile/index.ts`) to handle updates when user metadata changes:

```ts
import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const payload = await req.json()
  const user = payload.record

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name,
    avatar_url: user.user_metadata?.avatar_url,
    timezone: user.user_metadata?.timezone ?? 'UTC',
    subscription_status: user.user_metadata?.plan ? 'active' : 'free',
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[sync-profile] failed', error)
    return new Response('Error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})
```

3. In Supabase Dashboard → **Auth** → **Hooks**, add a `user_updated` hook pointing to the Edge Function.
4. From the frontend `signUp` action, send role/plan/metadata when creating the user to keep both records aligned:

```ts
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name,
      role,
      phone,
      plan,
    },
  },
})
```

5. Expose a helper for refreshing profile client-side when metadata changes:

```ts
export async function refreshProfile() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}
```

6. Consider an admin reconciliation job (weekly cron) to detect profile/auth mismatches and alert the team.

### Step 18: Plan Advanced Auth Enhancements

1. **Multi-factor Authentication (MFA)**:
   - Evaluate Supabase Authenticator App support (WebAuthn, TOTP).
   - Place MFA enrollment in account settings; store recovery codes securely.
2. **Magic Links / Passwordless**:
   - Offer email magic link sign-in as an alternative for students.
   - Update `middleware` to treat passwordless sessions identical to password-based ones.
3. **Audit Trail**:
   - Create `auth_events` table with logs for sign-in, sign-out, password reset, and role changes.
   - Insert entries via Edge Function or server actions.
4. **Session Management UI**:
   - Surface active devices/sessions and allow users to revoke them.
5. **Internationalization**:
   - Localize auth pages and emails (using `next-intl` or similar).
6. **Performance**:
   - Cache public profile data (ISR) while keeping private data live via Supabase.
7. **Subscription Upgrades**:
   - Build self-serve upgrade/downgrade flows that update `subscriptions`, purge cached entitlements, and notify middleware of new access.
   - Ensure Growth/Studio add-ons (ads, lead hub, AI assistant, marketplace) respect updated entitlements instantly.
8. Track these ideas in the backlog so you can prioritize after completing core features.

### Step 19: Monitor Auth Health Post-Launch

1. Define core KPIs:
   - Sign-up conversion rate (form submission → confirmed user).
   - Password reset success rate.
   - OAuth vs. email usage split.
   - Daily active sessions, churn (users not logging in for >14 days).
2. Instrument analytics:
   - Send auth events (`sign_in`, `sign_out`, `password_reset_requested`) to PostHog or Segment.
   - Dashboards should highlight spikes in failures or unusual traffic patterns.
   - Log `plan_upgrade`, `plan_downgrade`, and `add_on_enabled` events so marketing funnels can attribute Growth/Studio conversions.
3. Alerting:
   - Configure alerts for 5xx errors on `/auth/*` routes.
   - Notify on repeated failed logins from same IP (possible attack).
4. Support alignment:
   - Build canned responses/macros for common auth issues.
   - Document escalation paths when Supabase or OAuth providers are down.
5. Quarterly review:
   - Audit RLS policies and access logs.
   - Rotate secrets (service role key, OAuth secrets).
   - Review metrics and iterate on UX improvements.

## Testing Checklist

- [ ] Can sign up with email/password
- [ ] Receive confirmation email (check spam)
- [ ] Can sign in with email/password
- [ ] Can sign in with Google OAuth
- [ ] Profile automatically created on signup
- [ ] Protected routes redirect to login
- [ ] Can request password reset
- [ ] Password reset email arrives
- [ ] Can set new password
- [ ] Session persists across page refreshes
- [ ] AuthButton displays the signed-in user and supports sign out
- [ ] ProtectedRoute redirects unauthenticated users
- [ ] RoleGuard hides screens for unauthorized roles
- [ ] Growth/Studio-only pages redirect Professional users to `/upgrade`
- [ ] entitlements from `useAuth` update after plan upgrades/downgrades
- [ ] Error messages surface in forms and toasts
- [ ] Logs capture unexpected auth errors
- [ ] Playwright tests pass locally and in CI
- [ ] Supabase auth alerts fire on repeated failures
- [ ] Can sign out successfully
- [ ] Auth state updates in real-time

## AI Tool Prompts

### Create Auth Components
```
Create reusable auth components:
1. AuthButton - Sign in/out button that shows user state
2. ProtectedRoute - Wrapper component that checks auth
3. RoleGuard - Check user role before rendering
4. AuthLoader - Loading state during auth check
5. PlanGate - Render children only when entitlements include Growth/Studio access
Use TypeScript and our useAuth hook.
```

### Add Error Handling
```
Enhance auth actions with better error handling:
1. Display user-friendly error messages
2. Handle rate limiting
3. Show toast notifications
4. Log errors for debugging
5. Validate inputs before submission
```

## Common Gotchas

### Issue: "Invalid session" after OAuth
**Solution**: Check redirect URL in Google Cloud Console matches Supabase callback URL exactly

### Issue: Profile not created automatically
**Solution**: Verify trigger function exists and is enabled in Supabase

### Issue: Session not persisting
**Solution**: Check middleware is updating cookies correctly, verify cookie settings

### Issue: Can't sign in after signup
**Solution**: Email confirmation may be required - check Supabase Auth settings

## Next Steps

Once authentication is working:
1. Proceed to **03-basic-dashboard.md**
2. Test with multiple user accounts
3. Set up error monitoring (Sentry)

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Server Actions Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Auth Security Checklist](https://supabase.com/docs/guides/auth/overview#best-practices)
- [shadcn/ui Toast Component](https://ui.shadcn.com/docs/components/toast)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Success Criteria

✅ Users can create accounts, confirm email (if enabled), and sign in with password or Google  
✅ Auth middleware and ProtectedRoute prevent unauthorized access  
✅ Password reset flow sends emails and allows password updates  
✅ useAuth hook + AuthProvider expose user/profile state across the app  
✅ Plan-based entitlements flow through `useAuth` and gate Growth/Studio-only routes  
✅ Error handling surfaces user-friendly messages and logs unexpected failures  
✅ Supabase Auth settings enforce the chosen security posture

**Estimated Time**: 3-4 hours

---

With authentication foundations shipped and monitored, you're ready to build the core product experience. Continue with **03-basic-dashboard.md** to create the dashboard shell, navigation, and initial screens.
