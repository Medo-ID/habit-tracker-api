import { SignJWT, jwtVerify, decodeJwt } from 'jose'
import { createSecretKey } from 'node:crypto'
import { env } from '../../env.ts'

export interface JwtPayload {
  id: string
  email: string
  username: string
  [key: string]: unknown
}

export type TokenType = 'access' | 'refresh'

export const generateTokens = async (payload: JwtPayload) => {
  if (!env.ACCESS_SECRET) {
    throw new Error('ACCESS_SECRET variable environment is not set!')
  }

  const accessSecretKey = createSecretKey(env.ACCESS_SECRET, 'utf-8')
  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_EXPIRES_IN || '5m')
    .sign(accessSecretKey)

  if (!env.REFRESH_SECRET) {
    throw new Error('REFRESH_SECRET variable environment is not set!')
  }

  const refreshSecretKey = createSecretKey(env.REFRESH_SECRET, 'utf-8')
  const refreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_EXPIRES_IN || '15d')
    .sign(refreshSecretKey)

  return { accessToken, refreshToken }
}

export const verifyToken = async (
  token: string,
  tokenType: TokenType
): Promise<JwtPayload> => {
  const secret = createSecretKey(
    tokenType === 'access' ? env.ACCESS_SECRET : env.REFRESH_SECRET,
    'utf-8'
  )
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JwtPayload
}
