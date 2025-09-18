// scripts/seed-firestore.cjs
// Tek yol: GOOGLE_APPLICATION_CREDENTIALS ile çalışır.
// (keys/startex-admin.json yolunu export edeceğiz)
require('dotenv').config()
const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

function assertEnv() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS tanımlı değil. \n' +
      'Örnek:\n' +
      'export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/keys/startex-admin.json"'
    )
  }
}

async function main() {
  assertEnv()
  console.log('→ Using GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS)

  initializeApp({ credential: applicationDefault() })
  const db = getFirestore()

  // ---------- Demo verisi (UI’nin beklediği tiplere uyumlu) ----------
  const startups = [
    {
      id: '1',
      ownerAddress: 'SP3663BM...9VJ3',
      name: 'FriaN',
      description: 'AI finance tools for creators',
      logoUrl: 'https://placehold.co/256x256?text=FriaN',
      coverUrl: 'https://placehold.co/1600x400?text=FriaN+Cover',
      website: 'https://fria.n',
      twitter: 'https://twitter.com/fria_n',
      github: 'https://github.com/ahmetmat/FriaN',
      telegram: '',
      tags: ['ai','finance'],
      totalSupply: 1_000_000,
      circulatingSupply: 250_000,
      tokenSymbol: 'FRIAN',
      tokenName: 'FriaN',
      score: 120,
      rank: 1,
      verified: true,
    },
    {
      id: '2',
      ownerAddress: 'SP2ABC...XYZ',
      name: 'Startex Labs',
      description: 'Dev tools for tokenized startups',
      logoUrl: 'https://placehold.co/256x256?text=STEX',
      coverUrl: 'https://placehold.co/1600x400?text=Startex',
      website: 'https://startex.dev',
      twitter: 'https://twitter.com/startexlabs',
      github: 'https://github.com/startex/labs',
      telegram: '',
      tags: ['devtools'],
      totalSupply: 2_000_000,
      circulatingSupply: 600_000,
      tokenSymbol: 'STEX',
      tokenName: 'Startex',
      score: 96,
      rank: 2,
      verified: false,
    },
    {
      id: '3',
      ownerAddress: 'SP3DEF...KLM',
      name: 'OpenEdu',
      description: 'Open-source education micro-grants',
      logoUrl: 'https://placehold.co/256x256?text=OEDU',
      coverUrl: 'https://placehold.co/1600x400?text=OpenEdu',
      website: 'https://openedu.org',
      twitter: 'https://twitter.com/openedu',
      github: 'https://github.com/openedu/core',
      telegram: '',
      tags: ['education','grants'],
      totalSupply: 500_000,
      circulatingSupply: 120_000,
      tokenSymbol: 'OEDU',
      tokenName: 'OpenEdu',
      score: 88,
      rank: 3,
      verified: false,
    },
  ]

  const posts = [
    { id: 'p1', startupId: '1', authorAddress: 'SP3663BM...9VJ3', authorName: 'FriaN Team', content: 'v0.1 released! 🚀', mediaUrls: [], metrics: { likes: 10, comments: 2, shares: 1 } },
    { id: 'p2', startupId: '2', authorAddress: 'SP2ABC...XYZ', authorName: 'Startex Team', content: 'Devnet is live.', mediaUrls: [], metrics: { likes: 4, comments: 0, shares: 0 } },
  ]

  const comments = [
    { id: 'c1', postId: 'p1', startupId: '1', authorAddress: 'SPUSER...111', authorName: 'community-user', content: 'Congrats!', parentCommentId: null },
  ]

  const leaderboardEntries = startups.map(s => ({
    id: `lb-${s.id}`,
    startupId: s.id,
    name: s.name,
    founder: s.ownerAddress,
    description: s.description,
    category: (s.tags && s.tags[0]) || 'general',
    score: s.score,
    rank: s.rank,
    previousRank: s.rank + 1,
    change: '-1',
    tokenSymbol: s.tokenSymbol,
    tokenPrice: s.rank === 1 ? 0.15 : s.rank === 2 ? 0.1 : 0.07,
    priceChange: '+4.2%',
    marketCap: (s.circulatingSupply || 0) * (s.rank === 1 ? 0.15 : 0.1),
    holders: 123 + s.rank,
    verified: !!s.verified,
    github: s.github,
    twitter: s.twitter,
    website: s.website,
    githubStats: { stars: 12, forks: 4, commits: 40 },
    socialStats: { twitterFollowers: 520, linkedinFollowers: 180 },
    platformStats: { posts: 3, views: 90 },
    competitionsWon: s.rank === 1 ? 2 : 0,
  }))

  const metricSnapshots = startups.map(s => ({
    id: `ms-${s.id}-w1`,
    startupId: s.id,
    period: 'weekly',
    github: { stars: 12, forks: 4, commits: 40, contributors: 3 },
    twitter: { followers: 500 + 20 * s.rank, impressions: 10000 + 500 * s.rank },
    traction: { users: 1000 + 100 * s.rank, revenue: 0, retention: 0.4 },
    aggregateScore: s.score,
  }))

  const orderbooks = [
    { tokenSymbol: 'FRIAN', tokenName: 'FriaN', bids: [{ price: 0.12, amount: 500 }], asks: [{ price: 0.15, amount: 300 }] },
    { tokenSymbol: 'STEX',  tokenName: 'Startex', bids: [{ price: 0.08, amount: 700 }], asks: [{ price: 0.10, amount: 500 }] },
    { tokenSymbol: 'OEDU',  tokenName: 'OpenEdu', bids: [{ price: 0.05, amount: 1000 }], asks: [{ price: 0.07, amount: 900 }] },
  ]

  const notificationPrefs = [
    { address: 'SP3663BM...9VJ3', email: 'founder@fria.n', allowEmail: true, allowPush: false, topics: ['funding','competitions'] },
  ]

  const reports = [
    { id: 'r1', reporterAddress: 'SPUSER...222', postId: 'p2', type: 'spam', details: 'low-effort post', status: 'pending' },
  ]

  const auditLogs = [
    { id: 'log1', actor: 'SP3663BM...9VJ3', action: 'startup.register', context: { startupId: '1' } },
  ]

  // ---------- Write ----------
  for (const s of startups) {
    await db.collection('startups').doc(s.id).set({
      ...s,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  }

  for (const p of posts) {
    await db.collection('posts').doc(p.id).set({
      ...p,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  for (const c of comments) {
    await db.collection('comments').doc(c.id).set({
      ...c,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  const lbRoot = db.collection('leaderboards').doc('overall')
  await lbRoot.set({ createdAt: FieldValue.serverTimestamp() }, { merge: true })
  for (const e of leaderboardEntries) {
    await lbRoot.collection('entries').doc(e.id).set({
      ...e,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  for (const m of metricSnapshots) {
    await db.collection('metricSnapshots').doc(m.id).set({
      ...m,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  for (const ob of orderbooks) {
    await db.collection('orderbooks').doc(ob.tokenSymbol).set({
      ...ob,
      spread: ob.asks[0].price - ob.bids[0].price,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  }

  for (const n of notificationPrefs) {
    await db.collection('notificationPreferences').doc(n.address).set({
      email: n.email || null,
      allowEmail: n.allowEmail,
      allowPush: n.allowPush,
      topics: n.topics || [],
      lastNotifiedAt: null,
    }, { merge: true })
  }

  for (const r of reports) {
    await db.collection('moderationReports').doc(r.id).set({
      ...r,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  for (const a of auditLogs) {
    await db.collection('auditLogs').doc(a.id).set({
      ...a,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  console.log('✅ Firestore seed tamam.')
}

main().catch(err => {
  console.error('Seed hata:', err)
  process.exit(1)
})