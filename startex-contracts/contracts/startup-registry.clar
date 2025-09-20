;; -----------------------------
;; startup-registry.clar (multi-startup per owner)
;; -----------------------------

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u100))
(define-constant ERR_NOT_FOUND (err u102))
(define-constant ERR_INVALID_DATA (err u103))

(define-map startups
  { startup-id: uint }
  {
    owner: principal,
    name: (string-ascii 50),
    description: (string-ascii 200),
    github-repo: (string-ascii 100),
    website: (optional (string-ascii 100)),
    twitter: (optional (string-ascii 50)),
    token-address: (optional principal),
    created-at: uint,
    is-verified: bool,
    total-score: uint
  }
)

(define-map owner-startup-index
  { owner: principal, index: uint }
  { startup-id: uint }
)

(define-map owner-startup-count
  { owner: principal }
  { count: uint }
)

(define-data-var next-startup-id uint u1)

;; ---------------------------------
;; Public: register
;; ---------------------------------
(define-public (register-startup 
    (name (string-ascii 50))
    (description (string-ascii 200))
    (github-repo (string-ascii 100))
    (website (optional (string-ascii 100)))
    (twitter (optional (string-ascii 50)))
  )
  (let
    (
      (startup-id (var-get next-startup-id))
      (caller tx-sender)
      (current-count (default-to u0 (get count (map-get? owner-startup-count { owner: caller }))))
    )

    (asserts! (> (len name) u0) ERR_INVALID_DATA)
    (asserts! (> (len github-repo) u0) ERR_INVALID_DATA)

    (map-set startups
      { startup-id: startup-id }
      {
        owner: caller,
        name: name,
        description: description,
        github-repo: github-repo,
        website: website,
        twitter: twitter,
        token-address: none,
        created-at: (default-to u0 (get-block-info? time u0)),
        is-verified: false,
        total-score: u0
      }
    )

    (map-set owner-startup-index
      { owner: caller, index: current-count }
      { startup-id: startup-id }
    )

    (map-set owner-startup-count
      { owner: caller }
      { count: (+ current-count u1) }
    )

    (var-set next-startup-id (+ startup-id u1))
    (ok startup-id)
  )
)


(define-public (update-startup
    (startup-id uint)
    (name (string-ascii 50))
    (description (string-ascii 200))
    (website (optional (string-ascii 100)))
    (twitter (optional (string-ascii 50)))
  )
  (let
    (
      (startup (unwrap! (map-get? startups { startup-id: startup-id }) ERR_NOT_FOUND))
      (caller tx-sender)
    )
    (asserts! (is-eq caller (get owner startup)) ERR_NOT_AUTHORIZED)

    (map-set startups
      { startup-id: startup-id }
      (merge startup {
        name: name,
        description: description,
        website: website,
        twitter: twitter
      })
    )
    (ok true)
  )
)


(define-public (set-token-address (startup-id uint) (token-addr principal))
  (let ((startup (unwrap! (map-get? startups { startup-id: startup-id }) ERR_NOT_FOUND)))
    (map-set startups
      { startup-id: startup-id }
      (merge startup { token-address: (some token-addr) })
    )
    (ok true)
  )
)

(define-public (verify-startup (startup-id uint))
  (let ((startup (unwrap! (map-get? startups { startup-id: startup-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (map-set startups
      { startup-id: startup-id }
      (merge startup { is-verified: true })
    )
    (ok true)
  )
)

(define-public (update-score (startup-id uint) (new-score uint))
  (let ((startup (unwrap! (map-get? startups { startup-id: startup-id }) ERR_NOT_FOUND)))
    (map-set startups
      { startup-id: startup-id }
      (merge startup { total-score: new-score })
    )
    (ok true)
  )
)


(define-read-only (get-startup (startup-id uint))
  (map-get? startups { startup-id: startup-id })
)

(define-read-only (get-startup-by-owner (owner principal))
  (let
    (
      (c (default-to u0 (get count (map-get? owner-startup-count { owner: owner }))))
    )
    (if (> c u0)
      (match (map-get? owner-startup-index { owner: owner, index: (- c u1) })
        entry (map-get? startups { startup-id: (get startup-id entry) })
        none
      )
      none
    )
  )
)

(define-read-only (get-startup-count-by-owner (owner principal))
  (default-to u0 (get count (map-get? owner-startup-count { owner: owner })))
)

(define-read-only (get-startup-id-by-owner-index (owner principal) (index uint))
  (map-get? owner-startup-index { owner: owner, index: index })
)

(define-read-only (get-next-startup-id)
  (var-get next-startup-id)
)

(define-read-only (is-startup-owner (owner principal) (startup-id uint))
  (match (map-get? startups { startup-id: startup-id })
    startup (is-eq owner (get owner startup))
    false
  )
)