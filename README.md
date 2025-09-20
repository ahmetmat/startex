# 🚀 StartEx - Decentralized Social Finance for Startups
<div align="center">
  <img src="https://img.shields.io/badge/Built%20on-Stacks-orange" alt="Built on Stacks">
  <img src="https://img.shields.io/badge/Frontend-Next.js-blue" alt="Next.js">
  <img src="https://img.shields.io/badge/Smart%20Contracts-Clarity-purple" alt="Clarity">
  <img src="https://img.shields.io/badge/Database-Firebase-yellow" alt="Firebase">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License">
</div>

---

## 📖 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🚦 Getting Started](#-getting-started)
- [📱 Screenshots](#-screenshots)
- [🔧 Smart Contracts](#-smart-contracts)
- [🌐 Frontend Features](#-frontend-features)
- [🔄 API Integration](#-api-integration)
- [🚀 Deployment](#-deployment)
- [-- Roadmap](#-Roadmap)
- [📄 License](#-license)

---

## ✨ Overview

**StartEx** is a revolutionary platform that bridges the gap between traditional startup funding and decentralized finance. Built on the Stacks blockchain, it enables startups to tokenize their equity, compete in community-driven competitions, and get funded by a global network of supporters.

### 🎪 Why StartEx?

- **🪙 Tokenization Made Simple**: Convert your startup into tradeable tokens with just a few clicks
- **🏆 Community-Driven Competitions**: Compete with other startups and win prizes based on real metrics
- **📊 Real-Time Scoring**: GitHub activity, social media growth, and platform engagement automatically tracked
- **💰 Direct Community Funding**: Get funded directly by supporters who believe in your vision
- **🔒 Secure & Transparent**: Built on Bitcoin's security through Stacks blockchain

---

## 🎯 Key Features

### For Startups 🚀

- **One-Click Registration**: Connect your GitHub repo and launch your tokenized startup
- **Automated Metrics Tracking**: GitHub commits, stars, social media followers automatically synced
- **Competition Participation**: Join monthly competitions with real prize pools
- **Community Building**: Engage directly with supporters and investors
- **Token Management**: Create, distribute, and manage your startup tokens

### For Investors & Supporters 💎

- **Discover Promising Startups**: Browse curated startups with real-time metrics
- **Direct Investment**: Support startups by purchasing their tokens
- **Portfolio Tracking**: Monitor your investments with detailed analytics
- **Community Voting**: Participate in competitions and community decisions
- **Secondary Trading**: Trade startup tokens on the integrated marketplace

### For the Ecosystem 🌍

- **Transparent Leaderboards**: Real-time rankings based on objective metrics
- **Community Governance**: Decentralized decision making for platform evolution
- **Open Innovation**: Encourage collaboration between startups and supporters
- **Global Accessibility**: Available worldwide with crypto-native payments

---

## 🏗️ Architecture

StartEx combines multiple cutting-edge technologies to create a seamless, secure, and scalable platform:

### 🧱 Core Components

| Component          | Technology                    | Purpose                          |
| ------------------ | ----------------------------- | -------------------------------- |
| **Frontend**       | Next.js 14, React, TypeScript | User interface and interactions  |
| **Styling**        | Tailwind CSS                  | Modern, responsive design        |
| **Blockchain**     | Stacks, Clarity               | Smart contracts and tokenization |
| **Database**       | Firebase Firestore            | Off-chain data storage           |
| **Authentication** | Stacks Connect                | Wallet-based authentication      |
| **APIs**           | GitHub API, Custom REST       | External data integration        |

---

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git
- A Stacks-compatible wallet (Leather, Xverse)
- Firebase project (for off-chain data)

### 🔧 Installation

1. **Clone the repository**

```bash
   git clone https://github.com/yourusername/startex.git
   cd startex
```

2. **Install dependencies**

```bash
   cd startex-frontend
   npm install
```

3. **Set up environment variables**

```bash
   cp .env.example .env.local
```

Configure your `.env.local`:

```env
   # Stacks Network Configuration
   NEXT_PUBLIC_STACKS_NETWORK=testnet
   NEXT_PUBLIC_STACKS_RPC_URL=https://api.testnet.hiro.so

   # Smart Contract Addresses (deploy contracts first)
   NEXT_PUBLIC_REGISTRY_ADDR=your_registry_contract_address
   NEXT_PUBLIC_TOKEN_ADDR=your_token_contract_address
   NEXT_PUBLIC_METRICS_ADDR=your_metrics_contract_address
   NEXT_PUBLIC_COMPETITION_ADDR=your_competition_contract_address

   # Contract Names
   NEXT_PUBLIC_REGISTRY_NAME=startup-registry
   NEXT_PUBLIC_TOKEN_NAME=token-factory
   NEXT_PUBLIC_METRICS_NAME=scoring-system
   NEXT_PUBLIC_COMPETITION_NAME=competition

   # Firebase Configuration
   GOOGLE_APPLICATION_CREDENTIALS=path_to_your_firebase_service_account.json
```

4. **Deploy Smart Contracts**

```bash
   cd ../startex-contracts
   clarinet deployments apply -p deployments/testnet.devnet-plan.yaml
```

5. **Seed Firebase Database**

```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/keys/startex-admin.json"
   node scripts/seed-firestore.cjs
```

6. **Start the development server**

```bash
   cd ../startex-frontend
   npm run dev
```

7. **Open your browser** Navigate to [http://localhost:3000](http://localhost:3000) and start exploring! 🎉

---

## 📱 Screenshots

### 🏠 Homepage

The welcoming landing page showcasing platform statistics and trending startups

<img width="1679" height="962" alt="Screenshot 2025-09-20 at 18 07 21" src="https://github.com/user-attachments/assets/be061c79-a3ff-4520-a2e0-d002de425747" />
<img width="1206" height="962" alt="Screenshot 2025-09-20 at 18 11 44" src="https://github.com/user-attachments/assets/9c80469d-63d3-47ca-876a-c505fefe766c" />



### 🚀 Startup Registration

Seamless three-step registration process for new startups

<img width="719" height="955" alt="Screenshot 2025-09-20 at 18 08 05" src="https://github.com/user-attachments/assets/60351c18-27d1-48a5-8c2d-366c6cf85ee9" />
<img width="693" height="800" alt="Screenshot 2025-09-20 at 18 08 42" src="https://github.com/user-attachments/assets/a41012c4-a8a5-4046-bf85-568c0c16d515" />
<img width="752" height="921" alt="Screenshot 2025-09-20 at 18 08 53" src="https://github.com/user-attachments/assets/307d2295-f221-4ed0-98c7-0d767d51327d" />




### 📊 Dashboard

Comprehensive dashboard showing startup metrics, token performance, and competition status

<img width="1384" height="960" alt="Screenshot 2025-09-20 at 18 09 57" src="https://github.com/user-attachments/assets/c7a1eeb1-a6b7-4e60-81b1-f8cd9a89ea28" />


### 🏆 Competitions

Active competitions with real-time leaderboards and prize pools

<img width="1110" height="959" alt="Screenshot 2025-09-20 at 18 10 46" src="https://github.com/user-attachments/assets/a50ff5bd-b048-42f6-bbe0-d43dda435369" />


### 📈 Leaderboard

Real-time startup rankings with detailed metrics and direct investment options

<img width="1073" height="956" alt="Screenshot 2025-09-20 at 18 11 05" src="https://github.com/user-attachments/assets/b4c6e1b6-0227-4392-85d1-3694a3ccddc5" />


### 🟩 Trading Interface

Token trading platform with order books and portfolio management

<img width="1048" height="788" alt="Screenshot 2025-09-20 at 18 11 18" src="https://github.com/user-attachments/assets/1d3f3865-10d3-485d-b92a-4317ebff46fa" />


### 🔗 Wallet Integration

Seamless Stacks wallet connection with transaction management

<img width="343" height="451" alt="Screenshot 2025-09-20 at 18 13 57" src="https://github.com/user-attachments/assets/c8f74eb8-6e01-46f1-9396-cb2c33d4daa5" />


---

## 🔧 Smart Contracts

StartEx utilizes four core smart contracts written in Clarity:

### 📝 Startup Registry (`startup-registry.clar`)

Manages startup registration and profile data.

- `register-startup`: Register a new startup
- `update-startup`: Update startup information
- `get-startup`: Retrieve startup details
- `verify-startup`: Admin verification
  
https://explorer.hiro.so/txid/ST36G3BMMHWHT5DZ5MKVVVSSMSNE52KPFW5KVGRHR.startup-registry?chain=testnet

### 🌐 Token Factory (`token-factory.clar`)

Handles startup tokenization and token operations.

- `tokenize-startup`: Create tokens for a startup
- `transfer`: Transfer tokens between users
- `mint-tokens`: Mint additional tokens
- `get-balance`: Check token balance
  
https://explorer.hiro.so/txid/ST36G3BMMHWHT5DZ5MKVVVSSMSNE52KPFW5KVGRHR.token-factory?chain=testnet

### 📊 Scoring System (`scoring-system.clar`)

Tracks and calculates startup performance metrics.

- `initialize-metrics`: Set up metrics tracking
- `update-github-metrics`: Update GitHub statistics
- `update-social-metrics`: Update social media metrics
- `get-score`: Calculate total score

https://explorer.hiro.so/txid/ST36G3BMMHWHT5DZ5MKVVVSSMSNE52KPFW5KVGRHR.scoring-system?chain=testnet

### 🏆 Competition Engine (`competition.clar`)

Manages competitions and prize distribution.

- `create-competition`: Launch new competition
- `join-competition`: Register for competition
- `end-competition`: Conclude and distribute prizes
- `claim-reward`: Claim competition rewards
  
https://explorer.hiro.so/txid/0x3ca31b40f88098df06de5eb185b40f0adfd4a6cb76d2e989325a1d7da9170252?chain=testnet
https://explorer.hiro.so/txid/ST36G3BMMHWHT5DZ5MKVVVSSMSNE52KPFW5KVGRHR.competition?chain=testnet

---

## 🌐 Frontend Features

### 🎨 Design System

- Gradient-based glassmorphism design
- Responsive across devices
- WCAG 2.1 accessibility
- Dark/Light mode support

### 🔒 Authentication

- Wallet-based login (Leather, Xverse)
- Persistent sessions
- Auto network detection

### 🕒 Real-Time Updates

- Live metrics: GitHub & social
- Competition tracking
- Token prices
- In-app/email notifications

### 🎯 User Experience

- Guided onboarding
- Interactive tutorials
- Progressive enhancement
- Graceful error handling

---

## 🔄 API Integration

### 🐙 GitHub API

- Commits, stars, forks
- Contributors & PRs
- Code quality metrics

### 📱 Social Media APIs *(planned)*

- Twitter, LinkedIn, Discord/Telegram

### 🔗 Stacks Blockchain

- Real-time monitoring
- Contract state queries
- Fee estimation
- Token balance tracking

---

## 🚀 Deployment

### 🌐 Frontend Deployment (Vercel)

```bash
npm install -g vercel
vercel login
vercel --prod
```

### ⚙️ Smart Contract Deployment

#### Testnet

```bash
clarinet deployments apply -p deployments/testnet.devnet-plan.yaml
```

#### Mainnet

```bash
clarinet deployments apply -p deployments/mainnet.devnet-plan.yaml
```

---

## 🗺️ StartEx Roadmap

---

## 📍 Q1 2025 – Foundation & MVP
- ✅ Deploy core smart contracts (Registry, Token Factory, Scoring, Competition)
- ✅ Firebase Firestore integration for off-chain data
- ✅ Startup registration & tokenization flow
- ✅ Wallet authentication (Stacks Connect)
- ✅ Basic leaderboard with scoring system

---

## 📍 Q2 2025 – Community & Competitions
- 🚀 Launch competition engine (create, join, end competitions)
- 🚀 Pool-based donations with admin controls
- 🚀 Claim rewards for competition winners
- 🚀 Enhanced dashboard for startups (metrics, tokens, competitions)
- 🚀 Public leaderboards with donation & voting options

---

## 📍 Q3 2025 – Trading & Market Expansion
- 🔄 Implement token swap/trading functionality (bonding curve or marketplace)
- 🔄 Order book snapshots & live trading UI
- 🔄 Direct wallet-to-wallet startup donations
- 🔄 Investor portfolio tracking & analytics
- 🔄 Social engagement features (posts, comments)

---

## 📍 Q4 2025 – Governance & Mainnet Launch
- 🌐 DAO-based governance for competitions & funding rules
- 🌐 Community voting for platform upgrades
- 🌐 Full mainnet deployment of smart contracts
- 🌐 Direct listing on Stacks ecosystem dApps (e.g., ALEX)
- 🌐 Expanded API integrations (GitHub, Twitter, LinkedIn)

---

## 📍 2026 – Ecosystem Growth
- 🌍 Global startup discovery platform
- 🌍 Cross-chain support (Ethereum L2, Solana bridges)
- 🌍 AI-powered scoring models
- 🌍 Grant program for startups & contributors
- 🌍 Partnerships with accelerators & VCs

---

## 🛠️ Long-Term Vision
- 🔮 Decentralized startup exchange powering research, innovation, and entrepreneurship
- 🔮 Fully autonomous competitions & funding pools
- 🔮 Integration with DeSci, ClimateTech, and AI ecosystems
- 🔮 On-chain reputation & identity systems
- 🔮 Becoming the Nasdaq of Startups 🚀



---

## 📄 License

This project is licensed under the MIT License.

