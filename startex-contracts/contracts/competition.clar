
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u400))
(define-constant ERR_NOT_FOUND (err u401))
(define-constant ERR_COMPETITION_ACTIVE (err u402))
(define-constant ERR_COMPETITION_ENDED (err u403))
(define-constant ERR_ALREADY_JOINED (err u404))
(define-constant ERR_NOT_JOINED (err u405))

(define-constant STATUS_UPCOMING u0)
(define-constant STATUS_ACTIVE u1)
(define-constant STATUS_ENDED u2)
(define-constant STATUS_REWARDS_DISTRIBUTED u3)

(define-map competitions
  { competition-id: uint }
  {
    name: (string-ascii 50),
    description: (string-ascii 200),
    start-block: uint,
    end-block: uint,
    status: uint,
    total-prize-pool: uint,
    min-participants: uint,
    max-participants: uint,
    entry-fee: uint,
    created-at: uint
  }
)

(define-map competition-participants
  { competition-id: uint, startup-id: uint }
  {
    joined-at: uint,
    initial-score: uint,
    final-score: uint,
    rank: uint,
    reward-claimed: bool
  }
)

(define-map competition-results
  { competition-id: uint }
  {
    winner-startup-id: uint,
    total-participants: uint,
    rewards-distributed: bool,
    ended-at: uint
  }
)

(define-map competition-startups
  { competition-id: uint, index: uint }
  { startup-id: uint }
)

(define-map startup-competition-count
  { competition-id: uint }
  { count: uint }
)

(define-data-var next-competition-id uint u1)

(define-public (create-competition
    (name (string-ascii 50))
    (description (string-ascii 200))
    (duration-blocks uint)
    (total-prize-pool uint)
    (min-participants uint)
    (max-participants uint)
    (entry-fee uint)
  )
  (let 
    (
      (competition-id (var-get next-competition-id))
      (start-block (+ stacks-block-height u144)) 
      (end-block (+ start-block duration-blocks))
    )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    
    (map-set competitions
      { competition-id: competition-id }
      {
        name: name,
        description: description,
        start-block: start-block,
        end-block: end-block,
        status: STATUS_UPCOMING,
        total-prize-pool: total-prize-pool,
        min-participants: min-participants,
        max-participants: max-participants,
        entry-fee: entry-fee,
        created-at: stacks-block-height
      }
    )
    
    (map-set startup-competition-count
      { competition-id: competition-id }
      { count: u0 }
    )
    
    (var-set next-competition-id (+ competition-id u1))
    (ok competition-id)
  )
)

(define-public (join-competition (competition-id uint) (startup-id uint))
  (let 
    (
      (competition (unwrap! (map-get? competitions { competition-id: competition-id }) ERR_NOT_FOUND))
      (participant-count (get count (unwrap! (map-get? startup-competition-count { competition-id: competition-id }) ERR_NOT_FOUND)))
      (caller tx-sender)
    )
    (asserts! (< stacks-block-height (get start-block competition)) ERR_COMPETITION_ACTIVE)
    
    (asserts! (< participant-count (get max-participants competition)) ERR_COMPETITION_ACTIVE)
    
    (asserts! (is-none (map-get? competition-participants { competition-id: competition-id, startup-id: startup-id })) ERR_ALREADY_JOINED)
    
    (if (> (get entry-fee competition) u0)
      (try! (stx-transfer? (get entry-fee competition) caller CONTRACT_OWNER))
      true
    )
    
    (map-set competition-participants
      { competition-id: competition-id, startup-id: startup-id }
      {
        joined-at: stacks-block-height,
        initial-score: u0,
        final-score: u0,
        rank: u0,
        reward-claimed: false
      }
    )
    
    (map-set competition-startups
      { competition-id: competition-id, index: participant-count }
      { startup-id: startup-id }
    )
    
    (map-set startup-competition-count
      { competition-id: competition-id }
      { count: (+ participant-count u1) }
    )
    
    (ok true)
  )
)

(define-public (start-competition (competition-id uint))
  (let 
    (
      (competition (unwrap! (map-get? competitions { competition-id: competition-id }) ERR_NOT_FOUND))
      (participant-count (get count (unwrap! (map-get? startup-competition-count { competition-id: competition-id }) ERR_NOT_FOUND)))
    )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (>= stacks-block-height (get start-block competition)) ERR_NOT_AUTHORIZED)
    (asserts! (>= participant-count (get min-participants competition)) ERR_NOT_AUTHORIZED)
    
    (map-set competitions
      { competition-id: competition-id }
      (merge competition { status: STATUS_ACTIVE })
    )
    
    (ok true)
  )
)


(define-public (end-competition (competition-id uint))
  (let 
    (
      (competition (unwrap! (map-get? competitions { competition-id: competition-id }) ERR_NOT_FOUND))
    )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (>= stacks-block-height (get end-block competition)) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status competition) STATUS_ACTIVE) ERR_COMPETITION_ENDED)
    
    (map-set competitions
      { competition-id: competition-id }
      (merge competition { status: STATUS_ENDED })
    )
    
    (map-set competition-results
      { competition-id: competition-id }
      {
        winner-startup-id: u1, 
        total-participants: (get count (unwrap! (map-get? startup-competition-count { competition-id: competition-id }) ERR_NOT_FOUND)),
        rewards-distributed: false,
        ended-at: stacks-block-height
      }
    )
    
    (ok true)
  )
)

(define-public (claim-reward (competition-id uint) (startup-id uint))
  (let 
    (
      (competition (unwrap! (map-get? competitions { competition-id: competition-id }) ERR_NOT_FOUND))
      (participant (unwrap! (map-get? competition-participants { competition-id: competition-id, startup-id: startup-id }) ERR_NOT_FOUND))
      (results (unwrap! (map-get? competition-results { competition-id: competition-id }) ERR_NOT_FOUND))
    )
    (asserts! (is-eq (get status competition) STATUS_ENDED) ERR_COMPETITION_ACTIVE)
    
    (asserts! (not (get reward-claimed participant)) ERR_NOT_AUTHORIZED)
    
    (let 
      (
        (rank (get rank participant))
        (prize-amount (calculate-prize-amount competition rank))
      )
      (if (> prize-amount u0)
        (try! (as-contract (stx-transfer? prize-amount tx-sender (get owner (unwrap! (contract-call? .startup-registry get-startup startup-id) ERR_NOT_FOUND)))))
        true
      )
      
      (map-set competition-participants
        { competition-id: competition-id, startup-id: startup-id }
        (merge participant { reward-claimed: true })
      )
      
      (ok prize-amount)
    )
  )
)

(define-private (calculate-prize-amount (competition (tuple (name (string-ascii 50)) (description (string-ascii 200)) (start-block uint) (end-block uint) (status uint) (total-prize-pool uint) (min-participants uint) (max-participants uint) (entry-fee uint) (created-at uint))) (rank uint))
  (let 
    (
      (total-prize (get total-prize-pool competition))
    )
    (if (is-eq rank u1)
      (/ (* total-prize u50) u100) ;; 1. %50
      (if (is-eq rank u2)
        (/ (* total-prize u30) u100) ;; 2. %30
        (if (is-eq rank u3)
          (/ (* total-prize u20) u100) ;; 3. %20
          u0 
        )
      )
    )
  )
)

(define-read-only (get-competition (competition-id uint))
  (map-get? competitions { competition-id: competition-id })
)

(define-read-only (get-participant (competition-id uint) (startup-id uint))
  (map-get? competition-participants { competition-id: competition-id, startup-id: startup-id })
)

(define-read-only (get-competition-results (competition-id uint))
  (map-get? competition-results { competition-id: competition-id })
)

(define-read-only (get-participant-count (competition-id uint))
  (default-to u0 (get count (map-get? startup-competition-count { competition-id: competition-id })))
)

(define-read-only (is-competition-active (competition-id uint))
  (match (map-get? competitions { competition-id: competition-id })
    competition (is-eq (get status competition) STATUS_ACTIVE)
    false
  )
)