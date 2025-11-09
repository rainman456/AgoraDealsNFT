# DealChain - Web3 Deal Discovery Platform

DealChain is a revolutionary Web3-powered deal discovery platform that transforms traditional discounts into tradable NFTs. Think of it as the next evolution of Groupon, but user-owned, borderless, and decentralized.

## Features

### Core Functionality
- **NFT-Based Deals**: Promotions and discounts minted as collectible, tradable NFTs
- **Deal Discovery**: Browse deals across multiple categories (flights, hotels, restaurants, experiences, shopping)
- **User Wallet**: Manage your NFT collection with transfer, listing, and redemption capabilities
- **Marketplace**: Buy and sell NFT deals from other users
- **Merchant Dashboard**: Create and manage promotional deals with analytics
- **QR Code Redemption**: Seamless real-world redemption flow with QR code verification
- **Social Features**: Share deals, rate, comment, and engage with the community

### User Experience
- **Web3 Abstraction**: All blockchain interactions handled via backend APIs
- **Multiple Auth Options**: Wallet-based login or traditional email/password
- **Responsive Design**: Mobile-first approach with full desktop support
- **Real-time Updates**: Live deal feeds and marketplace listings
- **Geo-based Discovery**: Find deals near your location

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui component library
- **State Management**: React Context API
- **API Client**: Axios with interceptors
- **Notifications**: React Toastify
- **QR Codes**: qrcode.react
- **Date Handling**: date-fns
- **Icons**: React Icons (Feather Icons)

## Design System

### Color Palette
- **Primary**: Purple (#7C3AED) - Brand color for CTAs and highlights
- **Accent**: Yellow (#F59E0B) - Discount badges and attention-grabbing elements
- **Neutrals**: Grays and whites for backgrounds and text
- **Semantic Colors**: Green for success, red for errors

### Typography
- **Headings**: Jost (Bold, 600, 700 weights)
- **Body**: DM Sans (Regular, Medium, 600 weights)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui base components
│   ├── DealCard.tsx    # Deal display card
│   ├── NFTCard.tsx     # NFT collection card
│   ├── Navbar.tsx      # Navigation component
│   └── RedemptionModal.tsx  # QR code redemption flow
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Authentication state management
├── lib/                # Utilities and configurations
│   ├── api.ts          # API client and type definitions
│   └── utils.ts        # Helper functions
├── pages/              # Route pages
│   ├── Home.tsx        # Landing page with deal feed
│   ├── DealDetail.tsx  # Individual deal details
│   ├── Wallet.tsx      # User NFT collection
│   ├── Marketplace.tsx # NFT marketplace
│   ├── MerchantDashboard.tsx  # Merchant deal management
│   └── Login.tsx       # Authentication page
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles and Tailwind imports
```

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dealchain
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your API base URL:
```
VITE_API_BASE_URL=https://api.dealchain.example.com
```

4. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
pnpm build
```

The production-ready files will be in the `dist/` directory.

## API Integration

The frontend communicates with the backend exclusively through REST APIs. All blockchain interactions are abstracted away from the frontend.

### Key API Endpoints

**Authentication**
- `POST /auth/wallet` - Connect wallet
- `POST /auth/login` - Email login
- `GET /auth/me` - Get current user

**Deals**
- `GET /deals` - List deals with filters
- `GET /deals/:id` - Get deal details
- `POST /deals/:id/claim` - Claim a deal
- `POST /deals/:id/rate` - Rate a deal

**NFTs**
- `GET /nfts/my-collection` - Get user's NFTs
- `POST /nfts/:id/transfer` - Transfer NFT
- `POST /nfts/:id/redeem` - Redeem NFT
- `POST /nfts/:id/qr` - Generate redemption QR code

**Marketplace**
- `GET /marketplace` - List marketplace items
- `POST /marketplace/list` - List NFT for sale
- `POST /marketplace/listings/:id/buy` - Purchase NFT

**Merchant**
- `POST /merchant/deals` - Create new deal
- `GET /merchant/deals` - Get merchant's deals
- `GET /merchant/deals/:id/analytics` - Get deal analytics

See `src/lib/api.ts` for complete API documentation and TypeScript types.

## Key Features Implementation

### Authentication Flow
1. User clicks "Connect Wallet" or enters email/password
2. Frontend calls backend auth endpoint
3. Backend handles wallet signature verification or password check
4. Backend returns JWT token
5. Token stored in localStorage and added to all subsequent requests

### Deal Claiming Flow
1. User browses deals on home page
2. Clicks "Claim Deal" on desired offer
3. Frontend calls `/deals/:id/claim` endpoint
4. Backend mints NFT and assigns to user's wallet
5. User redirected to wallet to view new NFT

### Redemption Flow
1. User selects NFT from wallet
2. Clicks "Redeem Now"
3. Modal opens with QR code generation
4. Backend creates unique redemption code
5. QR code displayed for merchant scanning
6. Frontend polls for redemption status
7. Success confirmation shown when merchant verifies

### Marketplace Flow
1. User lists NFT with desired price
2. Other users browse marketplace
3. Buyer clicks "Buy Now"
4. Backend handles transfer and payment
5. NFT ownership updated
6. Both parties notified

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

The app is a standard Vite React application and can be deployed to any static hosting service:
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Firebase Hosting

## Development Notes

### Backend Requirements
The frontend expects a backend API with the following capabilities:
- User authentication (wallet-based and email/password)
- Deal management and NFT minting
- NFT transfers and marketplace operations
- Redemption verification
- Social features (comments, ratings, sharing)

### Mock Data
For development without a backend, you can modify `src/lib/api.ts` to return mock data instead of making real API calls.

### Environment Variables
- `VITE_API_BASE_URL`: Backend API base URL (required)

## Future Enhancements

- [ ] Group deals with tiered unlocks
- [ ] Staking rewards for NFT holders
- [ ] On-chain reputation system with badges
- [ ] Integration with external NFT marketplaces (OpenSea)
- [ ] Advanced filtering and search
- [ ] User profiles and social feeds
- [ ] Push notifications for deal alerts
- [ ] Multi-language support
- [ ] Dark mode toggle

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue on GitHub.

---

Built with ❤️ for the Web3 community
