import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  Timestamp,
  Firestore,
} from 'firebase/firestore'

import { getFirebaseApp } from './config'
import type {
  StartupProfile,
  StartupSocialPost,
  StartupComment,
  LeaderboardEntry,
  MetricSnapshot,
  OrderBookSnapshot,
  NotificationPreference,
  ModerationReport,
  AuditLogEntry,
} from './types'

let firestore: Firestore | undefined

export const getDb = (): Firestore => {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp())
  }
  return firestore
}

/* ---------- Helper utilities ---------- */
const withTimestamp = <T extends Record<string, unknown>>(payload: T) => ({
  ...payload,
  updatedAt: serverTimestamp(),
})

const getCollection = (path: string) => collection(getDb(), path)
const getDocRef = (path: string) => doc(getDb(), path)

/* ---------- Startup profile CRUD ---------- */
export const createOrUpdateStartupProfile = async (profile: StartupProfile) => {
  if (!profile.id) {
    throw new Error('Startup profile requires an id (startup-id from on-chain registry).')
  }

  const ref = getDocRef(`startups/${profile.id}`)
  await setDoc(ref, withTimestamp({ ...profile, createdAt: profile.createdAt || serverTimestamp() }), { merge: true })
}

export const getStartupProfile = async (startupId: string) => {
  const snapshot = await getDoc(getDocRef(`startups/${startupId}`))
  return snapshot.exists() ? (snapshot.data() as StartupProfile) : null
}

export const listStartupProfiles = async (limitCount = 20) => {
  const snapshot = await getDocs(query(getCollection('startups'), orderBy('score', 'desc'), limit(limitCount)))
  return snapshot.docs.map((docSnap) => docSnap.data() as StartupProfile)
}

export const getLatestStartupByOwner = async (ownerAddress: string) => {
  const snapshot = await getDocs(
    query(
      getCollection('startups'),
      where('ownerAddress', '==', ownerAddress),
      orderBy('createdAt', 'desc'),
      limit(1),
    ),
  )

  if (snapshot.empty) return null
  return snapshot.docs[0].data() as StartupProfile
}

/* ---------- Social posts & comments ---------- */
export const addStartupPost = async (startupId: string, post: StartupSocialPost) => {
  const ref = getDocRef(`startups/${startupId}/posts/${post.id}`)
  await setDoc(ref, withTimestamp({ ...post, createdAt: post.createdAt || serverTimestamp() }), { merge: true })
}

export const addStartupComment = async (
  startupId: string,
  postId: string,
  comment: StartupComment,
) => {
  const ref = getDocRef(`startups/${startupId}/posts/${postId}/comments/${comment.id}`)
  await setDoc(ref, withTimestamp({ ...comment, createdAt: comment.createdAt || serverTimestamp() }), { merge: true })
}

export const fetchStartupPosts = async (startupId: string, limitCount = 20) => {
  const snapshot = await getDocs(
    query(
      getCollection(`startups/${startupId}/posts`),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ),
  )

  return snapshot.docs.map((docSnap) => docSnap.data() as StartupSocialPost)
}

export const fetchStartupComments = async (startupId: string, postId: string, limitCount = 50) => {
  const snapshot = await getDocs(
    query(
      getCollection(`startups/${startupId}/posts/${postId}/comments`),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ),
  )

  return snapshot.docs.map((docSnap) => docSnap.data() as StartupComment)
}

/* ---------- Metrics & leaderboard snapshots ---------- */
export const saveMetricSnapshot = async (startupId: string, payload: MetricSnapshot) => {
  const ref = getDocRef(`startups/${startupId}/metricSnapshots/${payload.id}`)
  await setDoc(ref, withTimestamp({ ...payload, createdAt: payload.createdAt || serverTimestamp() }), { merge: true })
}

export const getLatestMetricSnapshot = async (startupId: string) => {
  const snapshot = await getDocs(
    query(
      getCollection(`startups/${startupId}/metricSnapshots`),
      orderBy('createdAt', 'desc'),
      limit(1),
    ),
  )

  if (snapshot.empty) return null
  return snapshot.docs[0].data() as MetricSnapshot
}

export const getLeaderboard = async (period: 'overall' | 'weekly' | 'monthly' = 'overall') => {
  const snapshot = await getDocs(
    query(
      getCollection(`leaderboards/${period}/entries`),
      orderBy('score', 'desc'),
      limit(100),
    ),
  )

  return snapshot.docs.map((docSnap) => docSnap.data() as LeaderboardEntry)
}

export const saveLeaderboardEntry = async (
  period: 'overall' | 'weekly' | 'monthly',
  entry: LeaderboardEntry,
) => {
  if (!entry.id) throw new Error('Leaderboard entry requires an id')
  const ref = getDocRef(`leaderboards/${period}/entries/${entry.id}`)
  const existing = await getDoc(ref)

  const existingCreatedAt = existing.exists() ? existing.data()?.createdAt : undefined

  const payload = pruneUndefined({
    ...entry,
    createdAt: existingCreatedAt ?? entry.createdAt ?? serverTimestamp(),
  })

  await setDoc(ref, withTimestamp(payload), { merge: true })
}

/* ---------- Order book snapshots ---------- */
export const getOrderBookSnapshot = async (tokenSymbol: string) => {
  const ref = getDocRef(`orderbooks/${tokenSymbol}`)
  const snapshot = await getDoc(ref)
  return snapshot.exists() ? (snapshot.data() as OrderBookSnapshot) : null
}

export const saveOrderBookSnapshot = async (snapshotPayload: OrderBookSnapshot) => {
  if (!snapshotPayload.tokenSymbol) throw new Error('Order book snapshot requires tokenSymbol')
  const ref = getDocRef(`orderbooks/${snapshotPayload.tokenSymbol}`)
  await setDoc(ref, withTimestamp({ ...snapshotPayload, updatedAt: serverTimestamp() }), { merge: true })
}

/* ---------- Notifications ---------- */
export const setNotificationPreferences = async (
  userId: string,
  preferences: NotificationPreference,
) => {
  const ref = getDocRef(`users/${userId}/notificationPreferences/default`)
  await setDoc(ref, withTimestamp({ ...preferences, updatedAt: serverTimestamp() }), { merge: true })
}

export const getNotificationPreferences = async (userId: string) => {
  const snapshot = await getDoc(getDocRef(`users/${userId}/notificationPreferences/default`))
  return snapshot.exists() ? (snapshot.data() as NotificationPreference) : null
}

/* ---------- Moderation & audit logs ---------- */
export const submitModerationReport = async (report: ModerationReport) => {
  if (!report.id) throw new Error('Moderation report requires id')
  const ref = getDocRef(`moderation/reports/${report.id}`)
  await setDoc(ref, withTimestamp({ ...report, createdAt: report.createdAt || serverTimestamp(), status: report.status || 'pending' }), { merge: true })
}

export const listModerationReports = async (status: ModerationReport['status'] = 'pending', limitCount = 50) => {
  const snapshot = await getDocs(
    query(
      getCollection('moderation/reports'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ),
  )

  return snapshot.docs.map((docSnap) => docSnap.data() as ModerationReport)
}

export const appendAuditLog = async (entry: AuditLogEntry) => {
  const ref = getDocRef(`auditLogs/${entry.id}`)
  await setDoc(ref, withTimestamp({ ...entry, createdAt: entry.createdAt || serverTimestamp() }), { merge: true })
}

export const listAuditLogs = async (limitCount = 100) => {
  const snapshot = await getDocs(
    query(
      getCollection('auditLogs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ),
  )

  return snapshot.docs.map((docSnap) => docSnap.data() as AuditLogEntry)
}

export const convertTimestamps = <T extends Record<string, unknown>>(data: T): T => {
  const result: Record<string, unknown> = {}

  Object.entries(data ?? {}).forEach(([key, value]) => {
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString()
      return
    }

    if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (item instanceof Timestamp) return item.toDate().toISOString()
        if (item && typeof item === 'object') {
          return convertTimestamps(item as Record<string, unknown>)
        }
        return item
      })
      return
    }

    if (value && typeof value === 'object' && !(value instanceof Date)) {
      result[key] = convertTimestamps(value as Record<string, unknown>)
      return
    }

    result[key] = value
  })

  return result as T
}
// undefined'ları objeden temizler (derin)
export function pruneUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj as any;
  if (Array.isArray(obj)) return obj.map(pruneUndefined).filter(v => v !== undefined) as any;
  if (typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) {
      const pv = pruneUndefined(v as any);
      if (pv !== undefined) out[k] = pv;
    }
    return out;
  }
  return obj as any;
}
