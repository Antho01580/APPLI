import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: 'ADMIN' | 'FORMATEUR' | 'STAGIAIRE' | 'TUTEUR'
    }
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    id: string
  }
}
