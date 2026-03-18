import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect based on role
    if (path === '/dashboard') {
      const role = (token?.role as string)?.toLowerCase() || 'admin'
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url))
    }

    // Role-based access control
    if (path.startsWith('/dashboard/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/dashboard/${(token?.role as string)?.toLowerCase()}`, req.url))
    }
    if (path.startsWith('/dashboard/formateur') && token?.role !== 'FORMATEUR' && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/dashboard/${(token?.role as string)?.toLowerCase()}`, req.url))
    }
    if (path.startsWith('/dashboard/stagiaire') && token?.role !== 'STAGIAIRE' && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/dashboard/${(token?.role as string)?.toLowerCase()}`, req.url))
    }
    if (path.startsWith('/dashboard/tuteur') && token?.role !== 'TUTEUR' && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/dashboard/${(token?.role as string)?.toLowerCase()}`, req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*'],
}
