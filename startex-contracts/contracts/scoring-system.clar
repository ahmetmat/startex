
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u300))
(define-constant ERR_NOT_FOUND (err u301))
(define-constant ERR_INVALID_DATA (err u302))

(define-constant GITHUB_WEIGHT u40)
(define-constant SOCIAL_WEIGHT u30)
(define-constant PLATFORM_WEIGHT u20)
(define-constant DEMO_WEIGHT u10)

(define-map startup-metrics
  { startup-id: uint }
  {
    github-commits: uint,
    github-stars: uint,
    github-forks: uint,
    twitter-followers: uint,
    linkedin-followers: uint,
    platform-posts: uint,
    demo-views: uint,
    last-updated: uint,
    total-score: uint
  }
)

(define-map weekly-snapshots
  { startup-id: uint, week: uint }
  {
    score: uint,
    github-growth: uint,
    social-growth: uint,
    platform-activity: uint,
    timestamp: uint
  }
)

(define-map authorized-oracles
  { oracle: principal }
  { is-authorized: bool }
)

(define-public (initialize-metrics (startup-id uint))
  (let 
    (
      (caller tx-sender)
    )
 
    (asserts! (is-none (map-get? startup-metrics { startup-id: startup-id })) ERR_INVALID_DATA)
    
    (map-set startup-metrics
      { startup-id: startup-id }
      {
        github-commits: u0,
        github-stars: u0,
        github-forks: u0,
        twitter-followers: u0,
        linkedin-followers: u0,
        platform-posts: u0,
        demo-views: u0,
        last-updated: stacks-block-height,
        total-score: u0
      }
    )
    
    (ok true)
  )
)

(define-public (update-github-metrics
    (startup-id uint)
    (commits uint)
    (stars uint)
    (forks uint)
  )
  (let 
    (
      (current-metrics (unwrap! (map-get? startup-metrics { startup-id: startup-id }) ERR_NOT_FOUND))
      (caller tx-sender)
    )
    (asserts! (or (default-to false (get is-authorized (map-get? authorized-oracles { oracle: caller })))
                  (is-eq caller CONTRACT_OWNER)) ERR_NOT_AUTHORIZED)
    
    (let 
      (
        (updated-metrics (merge current-metrics {
          github-commits: commits,
          github-stars: stars,
          github-forks: forks,
          last-updated: stacks-block-height
        }))
      )
      (map-set startup-metrics
        { startup-id: startup-id }
        updated-metrics
      )
      
      (try! (recalculate-score startup-id))
      (ok true)
    )
  )
)

(define-public (update-social-metrics
    (startup-id uint)
    (twitter-followers uint)
    (linkedin-followers uint)
  )
  (let 
    (
      (current-metrics (unwrap! (map-get? startup-metrics { startup-id: startup-id }) ERR_NOT_FOUND))
      (caller tx-sender)
    )
    (asserts! (or (default-to false (get is-authorized (map-get? authorized-oracles { oracle: caller })))
                  (is-eq caller CONTRACT_OWNER)) ERR_NOT_AUTHORIZED)
    
    (let 
      (
        (updated-metrics (merge current-metrics {
          twitter-followers: twitter-followers,
          linkedin-followers: linkedin-followers,
          last-updated: stacks-block-height
        }))
      )
      (map-set startup-metrics
        { startup-id: startup-id }
        updated-metrics
      )
      
      (try! (recalculate-score startup-id))
      (ok true)
    )
  )
)

(define-public (update-platform-metrics
    (startup-id uint)
    (posts uint)
    (demo-views uint)
  )
  (let 
    (
      (current-metrics (unwrap! (map-get? startup-metrics { startup-id: startup-id }) ERR_NOT_FOUND))
    )
    (let 
      (
        (updated-metrics (merge current-metrics {
          platform-posts: posts,
          demo-views: demo-views,
          last-updated: stacks-block-height
        }))
      )
      (map-set startup-metrics
        { startup-id: startup-id }
        updated-metrics
      )
      
      (try! (recalculate-score startup-id))
      (ok true)
    )
  )
)

(define-private (recalculate-score (startup-id uint))
  (let 
    (
      (metrics (unwrap! (map-get? startup-metrics { startup-id: startup-id }) ERR_NOT_FOUND))
      (github-score (calculate-github-score metrics))
      (social-score (calculate-social-score metrics))
      (platform-score (calculate-platform-score metrics))
      (demo-score (calculate-demo-score metrics))
    )
    (let 
      (
        (total-score (+ 
          (/ (* github-score GITHUB_WEIGHT) u100)
          (/ (* social-score SOCIAL_WEIGHT) u100)
          (/ (* platform-score PLATFORM_WEIGHT) u100)
          (/ (* demo-score DEMO_WEIGHT) u100)
        ))
      )
      (map-set startup-metrics
        { startup-id: startup-id }
        (merge metrics { total-score: total-score })
      )
      (ok total-score)
    )
  )
)

(define-private (calculate-github-score (metrics (tuple (github-commits uint) (github-stars uint) (github-forks uint) (twitter-followers uint) (linkedin-followers uint) (platform-posts uint) (demo-views uint) (last-updated uint) (total-score uint))))
  (let 
    (
      (commits (get github-commits metrics))
      (stars (get github-stars metrics))
      (forks (get github-forks metrics))
    )
    (+ (/ commits u10) (* stars u5) (* forks u10))
  )
)

(define-private (calculate-social-score (metrics (tuple (github-commits uint) (github-stars uint) (github-forks uint) (twitter-followers uint) (linkedin-followers uint) (platform-posts uint) (demo-views uint) (last-updated uint) (total-score uint))))
  (let 
    (
      (twitter (get twitter-followers metrics))
      (linkedin (get linkedin-followers metrics))
    )
    (+ (/ twitter u100) (/ linkedin u50))
  )
)

(define-private (calculate-platform-score (metrics (tuple (github-commits uint) (github-stars uint) (github-forks uint) (twitter-followers uint) (linkedin-followers uint) (platform-posts uint) (demo-views uint) (last-updated uint) (total-score uint))))
  (let 
    (
      (posts (get platform-posts metrics))
    )
    (* posts u20)
  )
)

(define-private (calculate-demo-score (metrics (tuple (github-commits uint) (github-stars uint) (github-forks uint) (twitter-followers uint) (linkedin-followers uint) (platform-posts uint) (demo-views uint) (last-updated uint) (total-score uint))))
  (let 
    (
      (views (get demo-views metrics))
    )
    (/ views u10)
  )
)

(define-public (take-weekly-snapshot (startup-id uint) (week uint))
  (let 
    (
      (metrics (unwrap! (map-get? startup-metrics { startup-id: startup-id }) ERR_NOT_FOUND))
    )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    
    (map-set weekly-snapshots
      { startup-id: startup-id, week: week }
      {
        score: (get total-score metrics),
        github-growth: u0, 
        social-growth: u0,
        platform-activity: (get platform-posts metrics),
        timestamp: stacks-block-height
      }
    )
    
    (ok true)
  )
)

(define-public (authorize-oracle (oracle principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (map-set authorized-oracles
      { oracle: oracle }
      { is-authorized: true }
    )
    (ok true)
  )
)

(define-read-only (get-metrics (startup-id uint))
  (map-get? startup-metrics { startup-id: startup-id })
)

(define-read-only (get-score (startup-id uint))
  (match (map-get? startup-metrics { startup-id: startup-id })
    metrics (some (get total-score metrics))
    none
  )
)

(define-read-only (get-weekly-snapshot (startup-id uint) (week uint))
  (map-get? weekly-snapshots { startup-id: startup-id, week: week })
)

(define-read-only (is-oracle-authorized (oracle principal))
  (default-to false (get is-authorized (map-get? authorized-oracles { oracle: oracle })))
)