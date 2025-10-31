# AgoraDeals NFT Platform - API Documentation

## Overview

This is a comprehensive NFT-based discount coupon platform built on Solana blockchain. The platform enables merchants to create promotions, mint NFT coupons, and users to purchase, trade, and redeem these coupons.

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.agoradeals.com/api/v1
```

## Authentication

Most endpoints require wallet authentication. Include the wallet address in request body or headers:

```json
{
  "walletAddress": "YourSolanaWalletAddress..."
}
```

---

## Core Features

### 1. NFT Promotions / Coupons

#### Mint Coupon
```http
POST /coupons/mint
```

**Request Body:**
```json
{
  "promotionId": "promotion_pda_or_id",
  "recipientAddress": "user_wallet_address",
  "walletAddress": "merchant_wallet_address"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coupon": {
      "id": "coupon_id",
      "onChainAddress": "coupon_pda",
      "nftMint": "nft_mint_address",
      "couponId": 1,
      "owner": "user_wallet",
      "discountPercentage": 20,
      "expiryTimestamp": "2024-12-31T23:59:59Z"
    },
    "transactionSignature": "tx_signature"
  }
}
```

---

### 2. Merchant Dashboard

#### Get Analytics
```http
GET /merchant-dashboard/:merchantAddress/analytics?startDate=2024-01-01&endDate=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPromotions": 10,
      "activePromotions": 5,
      "totalCoupons": 100,
      "totalRedemptions": 75,
      "redemptionRate": "75.00",
      "totalRevenue": 5000,
      "auctionRevenue": 1200
    },
    "categoryBreakdown": {
      "Food": {
        "promotions": 3,
        "coupons": 40,
        "redemptions": 30
      }
    },
    "dailyStats": [
      {
        "date": "2024-01-01",
        "coupons": 5,
        "redemptions": 3,
        "tickets": 2
      }
    ],
    "topPromotions": [...],
    "tickets": {...},
    "groupDeals": {...},
    "auctions": {...}
  }
}
```

#### Get Recent Activity
```http
GET /merchant-dashboard/:merchantAddress/recent-activity?limit=50
```

---

### 3. Redemption Tickets

#### Generate Ticket
```http
POST /redemption-tickets/generate
```

**Request Body:**
```json
{
  "couponId": "coupon_id_or_pda",
  "walletAddress": "user_wallet",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "ticket_id",
      "onChainAddress": "ticket_pda",
      "ticketHash": "hash_hex_string",
      "expiresAt": "2024-01-01T12:05:00Z",
      "qrCode": "data:image/png;base64,..."
    },
    "transactionSignature": "tx_signature"
  }
}
```

#### Verify and Redeem Ticket
```http
POST /redemption-tickets/verify-and-redeem
```

**Request Body:**
```json
{
  "ticketId": "ticket_id_or_pda",
  "ticketHash": "hash_hex_string",
  "walletAddress": "merchant_wallet",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Cancel Ticket
```http
POST /redemption-tickets/:ticketId/cancel
```

#### Get User Tickets
```http
GET /redemption-tickets/user/:userAddress?status=active
```

#### Get Merchant Tickets
```http
GET /redemption-tickets/merchant/:merchantAddress?status=consumed
```

---

### 4. Group Deals

#### Create Group Deal
```http
POST /group-deals/create
```

**Request Body:**
```json
{
  "promotionId": "promotion_id",
  "title": "Group Buy - 50% Off",
  "description": "Get 50% off when we reach 100 participants",
  "category": "Food",
  "tiers": [
    {
      "minParticipants": 10,
      "discountPercentage": 20,
      "pricePerUnit": 10
    },
    {
      "minParticipants": 50,
      "discountPercentage": 35,
      "pricePerUnit": 8
    },
    {
      "minParticipants": 100,
      "discountPercentage": 50,
      "pricePerUnit": 5
    }
  ],
  "targetParticipants": 100,
  "maxParticipants": 150,
  "durationDays": 7,
  "walletAddress": "merchant_wallet"
}
```

#### Join Group Deal
```http
POST /group-deals/:dealId/join
```

**Request Body:**
```json
{
  "quantity": 2,
  "walletAddress": "user_wallet"
}
```

#### Get Group Deals
```http
GET /group-deals?page=1&limit=20&status=active&category=Food
```

#### Finalize Group Deal
```http
POST /group-deals/:dealId/finalize
```

---

### 5. Auctions

#### Create Auction
```http
POST /auctions/create
```

**Request Body:**
```json
{
  "couponId": "coupon_id",
  "title": "Premium Coupon Auction",
  "description": "50% off luxury dining",
  "category": "Food",
  "startingPrice": 5,
  "reservePrice": 10,
  "buyNowPrice": 20,
  "durationDays": 3,
  "extendOnBid": true,
  "extensionTime": 300,
  "walletAddress": "seller_wallet"
}
```

#### Place Bid
```http
POST /auctions/:auctionId/bid
```

**Request Body:**
```json
{
  "amount": 15,
  "walletAddress": "bidder_wallet"
}
```

#### Settle Auction
```http
POST /auctions/:auctionId/settle
```

#### Get Auctions
```http
GET /auctions?page=1&limit=20&status=active&category=Food
```

---

### 6. Marketplace

#### List Coupon for Sale
```http
POST /marketplace/list
```

**Request Body:**
```json
{
  "couponId": "coupon_id",
  "price": 10,
  "walletAddress": "seller_wallet"
}
```

#### Buy Listing
```http
POST /marketplace/buy
```

**Request Body:**
```json
{
  "listingId": "listing_id",
  "walletAddress": "buyer_wallet"
}
```

#### Get Listings
```http
GET /marketplace/listings?page=1&limit=20
```

---

### 7. Social Features

#### Track Share
```http
POST /social/share
```

**Request Body:**
```json
{
  "itemId": "coupon_or_promotion_id",
  "itemType": "coupon",
  "platform": "twitter",
  "walletAddress": "user_wallet"
}
```

#### Track View
```http
POST /social/view
```

**Request Body:**
```json
{
  "itemId": "coupon_id",
  "itemType": "coupon"
}
```

#### Get Trending
```http
GET /social/trending?category=Food&timeframe=7d&limit=20
```

**Timeframe options:** `24h`, `7d`, `30d`

#### Get Popular
```http
GET /social/popular?category=Food&limit=20
```

#### Rate Coupon
```http
POST /social/rate
```

**Request Body:**
```json
{
  "couponId": "coupon_id",
  "rating": 5,
  "review": "Great deal!",
  "walletAddress": "user_wallet"
}
```

#### Get Feed
```http
GET /social/feed?category=Food&limit=50
```

---

### 8. Merchant Management

#### Register Merchant
```http
POST /merchants/register
```

**Request Body:**
```json
{
  "name": "Joe's Pizza",
  "category": "Food",
  "description": "Best pizza in town",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "website": "https://joespizza.com",
  "email": "contact@joespizza.com",
  "phone": "+1234567890",
  "walletAddress": "merchant_wallet"
}
```

#### Get Merchant Profile
```http
GET /merchants/:merchantId
```

#### Get All Merchants
```http
GET /merchants?page=1&limit=20&category=Food
```

---

### 9. Promotions

#### Create Promotion
```http
POST /promotions/create
```

**Request Body:**
```json
{
  "title": "Summer Sale",
  "description": "50% off all items",
  "discountPercentage": 50,
  "maxSupply": 100,
  "expiryDays": 30,
  "category": "Food",
  "price": 5,
  "walletAddress": "merchant_wallet"
}
```

#### Get Promotions
```http
GET /promotions?page=1&limit=20&category=Food&merchantId=merchant_id
```

---

### 10. User Stats & Badges

#### Get User Stats
```http
GET /user-stats/:userAddress
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRedemptions": 25,
    "reputationScore": 250,
    "tier": "Silver",
    "badges": [1, 2, 5],
    "lastActivity": "2024-01-01T12:00:00Z"
  }
}
```

#### Get User Badges
```http
GET /badges/user/:userAddress
```

---

### 11. Staking & Rewards

#### Stake Coupon
```http
POST /staking/stake
```

**Request Body:**
```json
{
  "couponId": "coupon_id",
  "walletAddress": "user_wallet"
}
```

#### Unstake Coupon
```http
POST /staking/unstake
```

#### Claim Rewards
```http
POST /staking/claim-rewards
```

#### Get Staking Info
```http
GET /staking/:userAddress
```

---

### 12. External Deal Aggregator

#### Get External Deals
```http
GET /external/deals?source=skyscanner&category=Travel&page=1&limit=20
```

**Sources:** `skyscanner`, `booking`, `shopify`, `amazon`

#### Sync External Deals
```http
POST /external/sync
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common Error Codes

- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (not authorized for this action)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

- **Public endpoints:** 100 requests per minute
- **Authenticated endpoints:** 300 requests per minute
- **Merchant endpoints:** 500 requests per minute

---

## Pagination

Endpoints supporting pagination use these query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Response format:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Webhooks

Subscribe to events:

- `coupon.minted`
- `coupon.redeemed`
- `ticket.generated`
- `ticket.redeemed`
- `auction.bid_placed`
- `auction.settled`
- `group_deal.target_reached`

---

## SDKs & Libraries

- **JavaScript/TypeScript:** `@agoradeals/sdk`
- **Python:** `agoradeals-python`
- **Rust:** `agoradeals-rs`

---

## Support

- **Documentation:** https://docs.agoradeals.com
- **Discord:** https://discord.gg/agoradeals
- **Email:** support@agoradeals.com

---

## Changelog

### v1.0.0 (2024-01-01)
- Initial release
- Core coupon minting and redemption
- Marketplace functionality
- Redemption tickets
- Group deals
- Auctions
- Social features
- Merchant dashboard
