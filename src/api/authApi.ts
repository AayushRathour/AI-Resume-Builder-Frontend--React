import api from './axios'
import type { AuthResponse, RegisterRequest, LoginRequest, User, UpdateProfileRequest } from '../types'
import { EP_ADMIN, EP_AUTH } from '../config/endpoints'

type JwtPayload = {
  sub?: string
  userId?: number | string
  fullName?: string
  name?: string
  role?: string
  subscriptionPlan?: string
  email?: string
}

function decodeJwtPayload(token?: string): JwtPayload {
  if (!token) return {}

  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload)) as JwtPayload
  } catch {
    return {}
  }
}

function fallbackName(email?: string) {
  if (!email) return 'User'
  return email.split('@')[0]
}

async function normalizeAuthResponse(raw: Partial<AuthResponse>): Promise<AuthResponse> {
  const token = raw.token ?? ''
  const claims = decodeJwtPayload(token)

  let profile: Partial<User> = {}
  try {
    const response = await api.get<User>(EP_AUTH.PROFILE, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    profile = response.data ?? {}
  } catch {
    // Keep login resilient even if profile endpoint is unavailable.
  }

  const email = raw.email || profile.email || claims.email || claims.sub || ''

  return {
    token,
    email,
    fullName: raw.fullName || profile.fullName || claims.fullName || claims.name || fallbackName(email),
    role: raw.role || profile.role || claims.role || 'USER',
    subscriptionPlan: raw.subscriptionPlan || profile.subscriptionPlan || claims.subscriptionPlan || 'FREE',
    userId: Number(raw.userId ?? profile.userId ?? claims.userId ?? 0),
  }
}

export const authApi = {
  register: async (data: RegisterRequest) => {
    const raw = await api.post<Partial<AuthResponse>>(EP_AUTH.REGISTER, data).then(r => r.data)
    return normalizeAuthResponse(raw)
  },

  login: async (data: LoginRequest) => {
    const raw = await api.post<Partial<AuthResponse>>(EP_AUTH.LOGIN, data).then(r => r.data)
    return normalizeAuthResponse(raw)
  },

  getProfile: async () => {
    const r = await api.get(EP_AUTH.PROFILE)
    return {
      userId: Number(r.data?.userId ?? 0),
      fullName: r.data?.fullName ?? '',
      email: r.data?.email ?? '',
      phone: r.data?.phone ?? '',
      role: r.data?.role ?? 'USER',
      subscriptionPlan: r.data?.subscriptionPlan ?? 'FREE',
      isActive: r.data?.isActive ?? true,
      provider: r.data?.provider ?? 'LOCAL',
      createdAt: r.data?.createdAt ?? new Date().toISOString(),
    } as User
  },

  updateProfile: (_userId: number, data: UpdateProfileRequest) =>
    api.put(EP_AUTH.PROFILE, data).then(r => {
      const profile = r.data ?? {}
      return {
        userId: Number(profile.userId ?? 0),
        fullName: profile.fullName ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        role: profile.role ?? 'USER',
        subscriptionPlan: profile.subscriptionPlan ?? 'FREE',
        isActive: profile.isActive ?? true,
        provider: profile.provider ?? 'LOCAL',
        createdAt: profile.createdAt ?? new Date().toISOString(),
      } as User
    }),

  changePassword: (_userId: number, oldPassword: string, newPassword: string) =>
    api.put(EP_AUTH.UPDATE_PASSWORD, { oldPassword, newPassword }),

  updateSubscription: (_userId: number, plan: string) =>
    api.put(EP_AUTH.UPDATE_SUBSCRIPTION, { plan }).then(r => ({
      userId: Number(r.data?.userId ?? 0),
      fullName: r.data?.fullName ?? '',
      email: r.data?.email ?? '',
      phone: r.data?.phone ?? '',
      role: r.data?.role ?? 'USER',
      subscriptionPlan: r.data?.subscriptionPlan ?? plan ?? 'FREE',
      isActive: r.data?.isActive ?? true,
      provider: r.data?.provider ?? 'LOCAL',
      createdAt: r.data?.createdAt ?? new Date().toISOString(),
    } as User)),

  updateUserSubscription: (userId: number, plan: string) =>
    api.put(EP_ADMIN.UPDATE_SUBSCRIPTION(userId), { plan }).then(r => ({
      userId: Number(r.data?.userId ?? userId),
      fullName: r.data?.fullName ?? '',
      email: r.data?.email ?? '',
      phone: r.data?.phone ?? '',
      role: r.data?.role ?? 'USER',
      subscriptionPlan: r.data?.subscriptionPlan ?? plan ?? 'FREE',
      isActive: r.data?.isActive ?? true,
      provider: r.data?.provider ?? 'LOCAL',
      createdAt: r.data?.createdAt ?? new Date().toISOString(),
    } as User)),

  deactivateUser: (_userId: number) =>
    api.delete(EP_AUTH.DEACTIVATE),

  getAllUsers: () =>
    api.get<User[]>(EP_ADMIN.USERS).then(r => r.data),

  upgradeUserToAdmin: (userId: number) =>
    api.put<User>(EP_ADMIN.UPGRADE_USER(userId)).then(r => r.data),

  suspendUser: (userId: number) =>
    api.put<User>(EP_ADMIN.SUSPEND_USER(userId)).then(r => r.data),

  deleteUser: (userId: number) =>
    api.delete(EP_ADMIN.DELETE_USER(userId)),
}
