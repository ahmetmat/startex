
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u200))
(define-constant ERR_NOT_FOUND (err u201))
(define-constant ERR_ALREADY_TOKENIZED (err u202))
(define-constant ERR_INVALID_AMOUNT (err u203))


(define-constant TOKENIZATION_FEE u1000000) ;; 1 STX in microSTX

;; Startup token bilgileri
(define-map startup-tokens
  { startup-id: uint }
  {
    token-name: (string-ascii 32),
    token-symbol: (string-ascii 10),
    total-supply: uint,
    decimals: uint,
    created-at: uint
  }
)

;; Token bakiyelerini takip et
(define-map token-balances
  { startup-id: uint, holder: principal }
  { balance: uint }
)

;; Token allowances (transfer izinleri)
(define-map token-allowances
  { startup-id: uint, owner: principal, spender: principal }
  { allowance: uint }
)

;; Toplam supply takibi
(define-map token-supplies
  { startup-id: uint }
  { total-supply: uint }
)

;; Startup tokenize et
(define-public (tokenize-startup
    (startup-id uint)
    (token-name (string-ascii 32))
    (token-symbol (string-ascii 10))
    (initial-supply uint)
    (decimals uint)
  )
  (let 
    (

      (caller tx-sender)
    )
    
    (try! (stx-transfer? TOKENIZATION_FEE caller CONTRACT_OWNER))
    
    (asserts! (is-none (map-get? startup-tokens { startup-id: startup-id })) ERR_ALREADY_TOKENIZED)
    
    (asserts! (> initial-supply u0) ERR_INVALID_AMOUNT)
    (asserts! (<= decimals u8) ERR_INVALID_AMOUNT)
    (asserts! (> (len token-name) u0) ERR_INVALID_AMOUNT)
    (asserts! (> (len token-symbol) u0) ERR_INVALID_AMOUNT)
    
    (map-set startup-tokens
      { startup-id: startup-id }
      {
        token-name: token-name,
        token-symbol: token-symbol,
        total-supply: initial-supply,
        decimals: decimals,
        created-at: stacks-block-height
      }
    )
    
    (map-set token-balances
      { startup-id: startup-id, holder: caller }
      { balance: initial-supply }
    )
    
    ;; Total supply'yi kaydet
    (map-set token-supplies
      { startup-id: startup-id }
      { total-supply: initial-supply }
    )
    
    (ok true)
  )
)

;; Token transfer
(define-public (transfer
    (startup-id uint)
    (amount uint)
    (sender principal)
    (recipient principal)
  )
  (let 
    (
      (sender-balance (default-to u0 (get balance (map-get? token-balances { startup-id: startup-id, holder: sender }))))
    )
    (asserts! (or (is-eq tx-sender sender)
                  (>= (default-to u0 (get allowance (map-get? token-allowances { startup-id: startup-id, owner: sender, spender: tx-sender }))) amount))
              ERR_NOT_AUTHORIZED)
    
    (asserts! (>= sender-balance amount) ERR_INVALID_AMOUNT)
    
    (map-set token-balances
      { startup-id: startup-id, holder: sender }
      { balance: (- sender-balance amount) }
    )
    
    (map-set token-balances
      { startup-id: startup-id, holder: recipient }
      { balance: (+ (default-to u0 (get balance (map-get? token-balances { startup-id: startup-id, holder: recipient }))) amount) }
    )
    
    (if (not (is-eq tx-sender sender))
      (let 
        (
          (current-allowance (default-to u0 (get allowance (map-get? token-allowances { startup-id: startup-id, owner: sender, spender: tx-sender }))))
        )
        (map-set token-allowances
          { startup-id: startup-id, owner: sender, spender: tx-sender }
          { allowance: (- current-allowance amount) }
        )
      )
      true
    )
    
    (ok true)
  )
)

;; Allowance ver
(define-public (approve
    (startup-id uint)
    (spender principal)
    (amount uint)
  )
  (begin
    (map-set token-allowances
      { startup-id: startup-id, owner: tx-sender, spender: spender }
      { allowance: amount }
    )
    (ok true)
  )
)

;; Yeni token mint (sadece startup sahibi)
(define-public (mint-tokens
    (startup-id uint)
    (amount uint)
    (recipient principal)
  )
  (let 
    (
      (token-info (unwrap! (map-get? startup-tokens { startup-id: startup-id }) ERR_NOT_FOUND))
      (current-supply (get total-supply (unwrap! (map-get? token-supplies { startup-id: startup-id }) ERR_NOT_FOUND)))
    )
   
    (map-set token-balances
      { startup-id: startup-id, holder: recipient }
      { balance: (+ (default-to u0 (get balance (map-get? token-balances { startup-id: startup-id, holder: recipient }))) amount) }
    )
    
    (map-set token-supplies
      { startup-id: startup-id }
      { total-supply: (+ current-supply amount) }
    )
    
    (ok true)
  )
)

;; Read-only fonksiyonlar
(define-read-only (get-token-info (startup-id uint))
  (map-get? startup-tokens { startup-id: startup-id })
)

(define-read-only (get-balance (startup-id uint) (holder principal))
  (default-to u0 (get balance (map-get? token-balances { startup-id: startup-id, holder: holder })))
)

(define-read-only (get-allowance (startup-id uint) (owner principal) (spender principal))
  (default-to u0 (get allowance (map-get? token-allowances { startup-id: startup-id, owner: owner, spender: spender })))
)

(define-read-only (get-total-supply (startup-id uint))
  (default-to u0 (get total-supply (map-get? token-supplies { startup-id: startup-id })))
)