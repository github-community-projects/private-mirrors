import NextAuth from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { nextAuthOptions } from '../lib/nextauth-options'

const handler = NextAuth(nextAuthOptions) as (
  req: NextRequest,
  res: NextResponse,
) => Promise<void>

export { handler as GET, handler as POST }
