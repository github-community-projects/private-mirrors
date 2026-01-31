import { withAuth } from 'next-auth/middleware'

export const proxy = withAuth({
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - static (static files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|static|favicon.ico).*)',
  ],
}
