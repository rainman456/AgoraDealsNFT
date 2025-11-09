# Backend API Documentation

## Base URL
```
http://localhost:3001/api/v1
```

## Table of Contents
1. [Data Models](#data-models)
2. [Authentication](#authentication)
3. [Promotions](#promotions)
4. [Coupons](#coupons)
5. [Marketplace & Listings](#marketplace--listings)
6. [Redemption](#redemption)
7. [Social & Activity](#social--activity)
8. [Merchants](#merchants)
9. [Users & Stats](#users--stats)
10. [Group Deals](#group-deals)
11. [Auctions](#auctions)
12. [Badges](#badges)
13. [Staking](#staking)
14. [Comments & Ratings](#comments--ratings)
15. [External Deals](#external-deals)
16. [File Upload](#file-upload)

---

## Data Models

### User Model
```typescript
{
  _id: ObjectId,
  walletAddress: string,           // Unique Solana wallet address
  encryptedPrivateKey: string,     // Encrypted private key
  iv: string,                      // Initialization vector for encryption
  authTag: string,                 // Authentication tag for encryption
  username?: string,
  email?: string,
  totalPurchases: number,          // Default: 0
  totalRedemptions: number,        // Default: 0
  reputationScore: number,         // Default: 0
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond',
  badgesEarned: string[],
  preferences: {
    categories: string[],
    locationEnabled: boolean,
    notifications: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Merchant Model
```typescript
{
  _id: ObjectId,
  email: string,                   // Unique
  walletAddress?: string,          // Unique Solana wallet
  encryptedPrivateKey?: string,
  iv?: string,
  authTag?: string,
  authority?: string,
  onChainAddress?: string,         // Unique on-chain PDA
  name: string,                    // Business name
  category: string,                // Business category
  description?: string,
  location?: {
    latitude: number,
    longitude: number,
    address?: string
  },
  totalCouponsCreated: number,     // Default: 0
  totalCouponsRedeemed: number,    // Default: 0
  isActive: boolean,               // Default: true
  averageRating: number,           // Default: 0
  totalRatings: number,            // Default: 0
  createdAt: Date,
  updatedAt: Date
}
```

### Promotion Model
```typescript
{
  _id: ObjectId,
  onChainAddress: string,          // Unique on-chain PDA
  merchant: string,                // Merchant's onChainAddress
  title: string,
  description: string,
  category: string,
  discountPercentage: number,      // 0-100
  maxSupply: number,               // Total available
  currentSupply: number,           // Currently minted
  price: number,                   // Price to purchase
  originalPrice?: number,          // Original price before discount
  imageUrl?: string,
  expiryTimestamp: Date,
  isActive: boolean,               // Default: true
  stats: {
    totalMinted: number,
    totalRedeemed: number,
    averageRating: number,
    totalRatings: number,
    totalComments: number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Coupon Model
```typescript
{
  _id: ObjectId,
  onChainAddress: string,          // Unique on-chain PDA
  couponId: number,
  nftMint: string,                 // Unique NFT mint address
  promotion: string,               // Promotion's onChainAddress
  owner: string,                   // Owner's wallet address
  merchant: string,                // Merchant's onChainAddress
  discountPercentage: number,
  expiryTimestamp: Date,
  isRedeemed: boolean,             // Default: false
  redeemedAt?: Date,
  redemptionCode?: string,
  isListed: boolean,               // Default: false
  listingPrice?: number,
  transferHistory: [{
    from: string,
    to: string,
    timestamp: Date,
    transactionSignature: string
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication

### Register User
**POST** `/auth/register/user`

Creates a new user account with embedded wallet.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "walletAddress": "8xKz...9mPq",
      "username": "john_doe",
      "email": "john@example.com",
      "tier": "Bronze",
      "reputationScore": 0
    },
    "message": "User registered successfully"
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `409`: Email or username already exists
- `500`: Server error

---

### Register Merchant
**POST** `/auth/register/merchant`

Creates a new merchant account with embedded wallet.

**Request Body:**
```json
{
  "name": "Joe's Pizza",
  "email": "joe@pizza.com",
  "category": "food",
  "description": "Best pizza in town",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Main St, New York, NY 10001",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "merchant": {
      "id": "507f1f77bcf86cd799439011",
      "walletAddress": "9yLm...3nQr",
      "onChainAddress": "7xKp...2mPs",
      "name": "Joe's Pizza",
      "email": "joe@pizza.com",
      "category": "food",
      "isActive": true
    },
    "message": "Merchant registered successfully"
  }
}
```

---

### Get User by Wallet
**GET** `/auth/user/:walletAddress`

Retrieves user information by wallet address.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "walletAddress": "8xKz...9mPq",
    "username": "john_doe",
    "email": "john@example.com",
    "tier": "Gold",
    "reputationScore": 450,
    "totalPurchases": 25,
    "totalRedemptions": 20,
    "badgesEarned": ["early_adopter", "deal_hunter"]
  }
}
```

---

### Get Merchant by Wallet
**GET** `/auth/merchant/:walletAddress`

Retrieves merchant information by wallet address.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "walletAddress": "9yLm...3nQr",
    "onChainAddress": "7xKp...2mPs",
    "name": "Joe's Pizza",
    "category": "food",
    "averageRating": 4.5,
    "totalCouponsCreated": 150,
    "totalCouponsRedeemed": 120
  }
}
```

---

## Promotions

### Create Promotion
**POST** `/promotions`

Creates a new promotion/deal.

**Headers:**
```
X-Wallet-Address: <merchant-wallet-address>
```

**Request Body:**
```json
{
  "walletAddress": "9yLm...3nQr",
  "email": "joe@pizza.com",
  "title": "50% Off Large Pizza",
  "description": "Get half off any large pizza. Valid for dine-in or takeout.",
  "discountPercentage": 50,
  "price": 15.99,
  "category": "food",
  "maxSupply": 100,
  "expiryDays": 30,
  "imageUrl": "https://example.com/pizza.jpg"
}
```

**Alternative expiry:**
```json
{
  "expiryTimestamp": "2024-12-31T23:59:59Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "promotion": {
      "id": "507f1f77bcf86cd799439011",
      "onChainAddress": "6xJn...4mPr",
      "title": "50% Off Large Pizza",
      "description": "Get half off any large pizza...",
      "category": "food",
      "discountPercentage": 50,
      "maxSupply": 100,
      "price": 15.99,
      "originalPrice": 31.98,
      "imageUrl": "https://example.com/pizza.jpg",
      "expiryTimestamp": "2024-12-31T23:59:59.000Z"
    },
    "transactionSignature": "5xKm...8nQs"
  }
}
```

---

### List Promotions
**GET** `/promotions`

Retrieves a paginated list of promotions with filters.

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `category` (string): Filter by category
- `minDiscount` (number): Minimum discount percentage
- `search` (string): Search in title/description
- `sortBy` (string): 'discount' | 'price' | 'createdAt'
- `sortOrder` (string): 'asc' | 'desc'
- `isActive` (boolean, default: true): Filter active/inactive
- `latitude` (number): User latitude for distance filtering
- `longitude` (number): User longitude for distance filtering
- `radius` (number): Search radius in km

**Example Request:**
```
GET /promotions?category=food&minDiscount=30&page=1&limit=10&sortBy=discount&sortOrder=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "promotions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "id": "507f1f77bcf86cd799439011",
        "onChainAddress": "6xJn...4mPr",
        "merchant": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Joe's Pizza",
          "businessName": "Joe's Pizza",
          "category": "food",
          "location": {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "address": "123 Main St"
          }
        },
        "title": "50% Off Large Pizza",
        "description": "Get half off any large pizza...",
        "category": "food",
        "discountPercentage": 50,
        "maxSupply": 100,
        "currentSupply": 45,
        "price": 15.99,
        "originalPrice": 31.98,
        "discountedPrice": 15.99,
        "expiryTimestamp": "2024-12-31T23:59:59.000Z",
        "endDate": "2024-12-31T23:59:59.000Z",
        "imageUrl": "https://example.com/pizza.jpg",
        "stats": {
          "totalMinted": 45,
          "totalRedeemed": 30,
          "averageRating": 4.5,
          "totalRatings": 25,
          "totalComments": 12
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### Get Promotion Details
**GET** `/promotions/:promotionId`

Retrieves detailed information about a specific promotion.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "id": "507f1f77bcf86cd799439011",
    "onChainAddress": "6xJn...4mPr",
    "merchant": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Joe's Pizza",
      "businessName": "Joe's Pizza",
      "category": "food",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "averageRating": 4.5
    },
    "title": "50% Off Large Pizza",
    "description": "Get half off any large pizza...",
    "category": "food",
    "discountPercentage": 50,
    "maxSupply": 100,
    "currentSupply": 45,
    "price": 15.99,
    "originalPrice": 31.98,
    "discountedPrice": 15.99,
    "expiryTimestamp": "2024-12-31T23:59:59.000Z",
    "endDate": "2024-12-31T23:59:59.000Z",
    "imageUrl": "https://example.com/pizza.jpg",
    "isActive": true,
    "stats": {
      "totalMinted": 45,
      "totalRedeemed": 30,
      "averageRating": 4.5,
      "totalRatings": 25,
      "totalComments": 12
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Update Promotion
**PUT** `/promotions/:promotionId`

Updates promotion details (merchant only).

**Headers:**
```
X-Wallet-Address: <merchant-wallet-address>
```

**Request Body:**
```json
{
  "walletAddress": "9yLm...3nQr",
  "title": "60% Off Large Pizza",
  "description": "Updated description",
  "price": 12.99,
  "maxSupply": 150
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "60% Off Large Pizza",
    "price": 12.99,
    "maxSupply": 150
  }
}
```

---

### Pause Promotion
**PATCH** `/promotions/:promotionId/pause`

Pauses an active promotion (merchant only).

**Headers:**
```
X-Wallet-Address: <merchant-wallet-address>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Promotion paused successfully"
}
```

---

### Resume Promotion
**PATCH** `/promotions/:promotionId/resume`

Resumes a paused promotion (merchant only).

**Response (200):**
```json
{
  "success": true,
  "message": "Promotion resumed successfully"
}
```

---

### Delete Promotion
**DELETE** `/promotions/:promotionId`

Soft deletes a promotion by marking it inactive (merchant only).

**Response (200):**
```json
{
  "success": true,
  "message": "Promotion deleted successfully"
}
```

---

## Coupons

### Mint Coupon
**POST** `/coupons/mint`

Mints a new coupon NFT from a promotion.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "promotionId": "507f1f77bcf86cd799439011"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "coupon": {
      "id": "507f1f77bcf86cd799439013",
      "onChainAddress": "5xJm...3nPq",
      "nftMint": "4xKn...2mPr",
      "couponId": 45,
      "promotion": "6xJn...4mPr",
      "owner": "8xKz...9mPq",
      "discountPercentage": 50,
      "expiryTimestamp": "2024-12-31T23:59:59.000Z",
      "isRedeemed": false
    },
    "transactionSignature": "7xLo...5nQs"
  }
}
```

---

### List Coupons
**GET** `/coupons`

Lists all coupons with filters.

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `owner` (string): Filter by owner wallet
- `promotion` (string): Filter by promotion ID
- `isRedeemed` (boolean)
- `isListed` (boolean)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "onChainAddress": "5xJm...3nPq",
        "nftMint": "4xKn...2mPr",
        "owner": "8xKz...9mPq",
        "promotion": {
          "title": "50% Off Large Pizza",
          "merchant": "Joe's Pizza"
        },
        "discountPercentage": 50,
        "isRedeemed": false,
        "isListed": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### Get My Coupons
**GET** `/coupons/my-coupons`

Retrieves coupons owned by the authenticated user.

**Headers:**
```
X-Wallet-Address: <user-wallet-address>
```

**Query Parameters:**
- `walletAddress` (string): Alternative to header

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "onChainAddress": "5xJm...3nPq",
      "nftMint": "4xKn...2mPr",
      "promotion": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "50% Off Large Pizza",
        "description": "Get half off...",
        "imageUrl": "https://example.com/pizza.jpg",
        "merchant": {
          "name": "Joe's Pizza",
          "businessName": "Joe's Pizza"
        },
        "discountPercentage": 50,
        "originalPrice": 31.98,
        "discountedPrice": 15.99,
        "endDate": "2024-12-31T23:59:59.000Z"
      },
      "isRedeemed": false,
      "expiryTimestamp": "2024-12-31T23:59:59.000Z"
    }
  ]
}
```

---

### Get Coupon Details
**GET** `/coupons/:couponId`

Retrieves detailed information about a specific coupon.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "onChainAddress": "5xJm...3nPq",
    "nftMint": "4xKn...2mPr",
    "couponId": 45,
    "owner": "8xKz...9mPq",
    "promotion": "6xJn...4mPr",
    "merchant": "7xKp...2mPs",
    "discountPercentage": 50,
    "expiryTimestamp": "2024-12-31T23:59:59.000Z",
    "isRedeemed": false,
    "isListed": false,
    "transferHistory": []
  }
}
```

---

### Transfer Coupon
**POST** `/coupons/transfer`

Transfers a coupon to another user.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "couponId": "507f1f77bcf86cd799439013",
  "recipientAddress": "9yLm...3nQr"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionSignature": "8xMp...6nQt"
  }
}
```

---

## Marketplace & Listings

### List Coupon for Sale
**POST** `/marketplace/list`

Lists a coupon for sale on the marketplace.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "couponId": "507f1f77bcf86cd799439013",
  "price": 10.00
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "listing": {
      "id": "507f1f77bcf86cd799439014",
      "onChainAddress": "6xKo...5nPs",
      "coupon": "5xJm...3nPq",
      "seller": "8xKz...9mPq",
      "price": 10.00,
      "isActive": true
    },
    "transactionSignature": "9xNq...7nQu"
  }
}
```

---

### Get Marketplace Listings
**GET** `/marketplace/listings`

Retrieves active marketplace listings.

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `category` (string)
- `minPrice` (number)
- `maxPrice` (number)
- `sortBy` (string): 'price' | 'createdAt'

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "onChainAddress": "6xKo...5nPs",
        "coupon": {
          "promotion": {
            "title": "50% Off Large Pizza",
            "imageUrl": "https://example.com/pizza.jpg"
          },
          "discountPercentage": 50
        },
        "seller": "8xKz...9mPq",
        "price": 10.00,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "totalPages": 2
    }
  }
}
```

---

### Buy Coupon from Marketplace
**POST** `/marketplace/buy`

Purchases a listed coupon.

**Request Body:**
```json
{
  "walletAddress": "9yLm...3nQr",
  "listingId": "507f1f77bcf86cd799439014"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionSignature": "1xOr...8nQv"
  }
}
```

---

### Cancel Listing
**POST** `/marketplace/cancel`

Cancels an active marketplace listing.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "listingId": "507f1f77bcf86cd799439014"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionSignature": "2xPs...9nQw"
  }
}
```

---

### Create Listing (Alternative)
**POST** `/listings`

Alternative endpoint to create a listing.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "couponId": "507f1f77bcf86cd799439013",
  "price": 10.00
}
```

---

### List All Listings
**GET** `/listings`

Alternative endpoint to get all listings.

---

### Get Listing by ID
**GET** `/listings/:listingId`

Get specific listing details.

---

### Deactivate Listing
**PATCH** `/listings/:listingId/deactivate`

Deactivates a listing.

---

### Delete Listing
**DELETE** `/listings/:listingId`

Deletes a listing.

---

## Redemption

### Generate QR Code
**POST** `/redemption/generate-qr`

Generates a QR code for coupon redemption.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "couponId": "507f1f77bcf86cd799439013"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "redemptionCode": "ABC123XYZ",
    "expiresAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### Redeem Coupon
**POST** `/redemption/redeem`

Redeems a coupon (merchant only).

**Request Body:**
```json
{
  "walletAddress": "9yLm...3nQr",
  "couponId": "507f1f77bcf86cd799439013",
  "redemptionCode": "ABC123XYZ"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionSignature": "3xQt...1nQx",
    "redeemedAt": "2024-01-15T10:45:00.000Z"
  }
}
```

---

### Get Redemption Status
**GET** `/redemption/:couponId/status`

Checks the redemption status of a coupon.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isRedeemed": false,
    "canRedeem": true,
    "expiryTimestamp": "2024-12-31T23:59:59.000Z"
  }
}
```

---

### Generate Redemption Ticket
**POST** `/redemption-tickets/generate`

Generates a time-limited redemption ticket.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "couponId": "507f1f77bcf86cd799439013"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "507f1f77bcf86cd799439015",
      "ticketAccount": "7xLp...6nPt",
      "couponId": "507f1f77bcf86cd799439013",
      "userId": "8xKz...9mPq",
      "merchantId": "9yLm...3nQr",
      "status": "pending",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "expiresAt": "2024-01-15T11:00:00.000Z"
    },
    "transactionSignature": "4xRu...2nQy"
  }
}
```

---

### Verify and Redeem Ticket
**POST** `/redemption-tickets/verify-and-redeem`

Verifies and redeems a redemption ticket (merchant only).

**Request Body:**
```json
{
  "walletAddress": "9yLm...3nQr",
  "ticketId": "507f1f77bcf86cd799439015"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionSignature": "5xSv...3nQz"
  }
}
```

---

### Cancel Redemption Ticket
**POST** `/redemption-tickets/:ticketId/cancel`

Cancels a pending redemption ticket.

**Response (200):**
```json
{
  "success": true,
  "message": "Ticket cancelled successfully"
}
```

---

### Get User Tickets
**GET** `/redemption-tickets/user/:userAddress`

Retrieves all tickets for a user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "status": "pending",
        "coupon": {
          "promotion": {
            "title": "50% Off Large Pizza"
          }
        },
        "expiresAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

---

### Get Merchant Tickets
**GET** `/redemption-tickets/merchant/:merchantAddress`

Retrieves all tickets for a merchant.

---

## Social & Activity

### Track Share
**POST** `/social/share`

Tracks when a user shares a deal.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "promotionId": "507f1f77bcf86cd799439011",
  "platform": "twitter"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shareCount": 15
  }
}
```

---

### Track View
**POST** `/social/view`

Tracks when a user views a deal.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "promotionId": "507f1f77bcf86cd799439011"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "viewCount": 250
  }
}
```

---

### Get Trending Deals
**GET** `/social/trending`

Retrieves trending deals based on activity.

**Query Parameters:**
- `limit` (number, default: 10)
- `timeframe` (string): 'day' | 'week' | 'month'

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trending": [
      {
        "promotion": {
          "_id": "507f1f77bcf86cd799439011",
          "title": "50% Off Large Pizza",
          "imageUrl": "https://example.com/pizza.jpg"
        },
        "views": 1250,
        "shares": 45,
        "mints": 78
      }
    ]
  }
}
```

---

### Get Popular Deals
**GET** `/social/popular`

Retrieves popular deals.

---

### Rate Coupon
**POST** `/social/rate`

Rates a coupon after redemption.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "couponId": "507f1f77bcf86cd799439013",
  "rating": 5
}
```

---

### Get Activity Feed
**GET** `/social/feed`

Retrieves community activity feed.

**Query Parameters:**
- `limit` (number, default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "type": "mint",
        "user": "john_doe",
        "promotion": "50% Off Large Pizza",
        "timestamp": "2024-01-15T10:30:00.000Z"
      },
      {
        "type": "redeem",
        "user": "jane_smith",
        "promotion": "Buy 1 Get 1 Free Coffee",
        "timestamp": "2024-01-15T10:25:00.000Z"
      }
    ]
  }
}
```

---

## Merchants

### Register Merchant
See [Authentication](#register-merchant)

---

### Get Merchant Profile
**GET** `/merchants/:merchantId`

Retrieves merchant profile information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Joe's Pizza",
    "category": "food",
    "description": "Best pizza in town",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St"
    },
    "averageRating": 4.5,
    "totalRatings": 150,
    "totalCouponsCreated": 200,
    "totalCouponsRedeemed": 180,
    "isActive": true
  }
}
```

---

### List Merchants
**GET** `/merchants`

Lists all merchants with filters.

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `category` (string)
- `latitude` (number)
- `longitude` (number)
- `radius` (number)

---

### Get Merchant Analytics
**GET** `/merchant-dashboard/:merchantAddress/analytics`

Retrieves analytics for a merchant.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPromotions": 50,
    "activePromotions": 35,
    "totalCouponsMinted": 1250,
    "totalRedemptions": 980,
    "revenue": 15750.50,
    "averageRating": 4.5,
    "topPromotions": [
      {
        "title": "50% Off Large Pizza",
        "minted": 250,
        "redeemed": 200
      }
    ]
  }
}
```

---

### Get Merchant Recent Activity
**GET** `/merchant-dashboard/:merchantAddress/recent-activity`

Retrieves recent activity for a merchant.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "type": "redemption",
        "promotion": "50% Off Large Pizza",
        "user": "8xKz...9mPq",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Users & Stats

### Get User Stats
**GET** `/user-stats/:userAddress`

Retrieves statistics for a user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "walletAddress": "8xKz...9mPq",
    "tier": "Gold",
    "reputationScore": 450,
    "totalPurchases": 25,
    "totalRedemptions": 20,
    "totalSavings": 350.75,
    "badgesEarned": ["early_adopter", "deal_hunter", "social_butterfly"]
  }
}
```

---

### Get User Badges
**GET** `/user-stats/:userAddress/badges`

Retrieves badges earned by a user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "early_adopter",
        "name": "Early Adopter",
        "description": "Joined in the first month",
        "imageUrl": "https://images.pexels.com/photos/6249905/pexels-photo-6249905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
        "earnedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Get Leaderboard
**GET** `/user-stats/leaderboard`

Retrieves the user leaderboard.

**Query Parameters:**
- `limit` (number, default: 10)
- `sortBy` (string): 'reputation' | 'purchases' | 'redemptions'

**Response (200):**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "john_doe",
        "walletAddress": "8xKz...9mPq",
        "tier": "Diamond",
        "reputationScore": 1250,
        "totalPurchases": 150
      }
    ]
  }
}
```

---

### Get Platform Stats
**GET** `/user-stats/stats/overview`

Retrieves overall platform statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 5000,
    "totalMerchants": 250,
    "totalPromotions": 1500,
    "totalCouponsMinted": 25000,
    "totalRedemptions": 18000,
    "totalSavings": 125000.50
  }
}
```

---

## Group Deals

### Create Group Deal
**POST** `/group-deals/create`

Creates a new group deal.

**Request Body:**
```json
{
  "walletAddress": "9yLm...3nQr",
  "promotionId": "507f1f77bcf86cd799439011",
  "targetParticipants": 50,
  "duration": 7,
  "tiers": [
    {
      "participants": 10,
      "discountPercentage": 30
    },
    {
      "participants": 25,
      "discountPercentage": 40
    },
    {
      "participants": 50,
      "discountPercentage": 50
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "groupDeal": {
      "id": "507f1f77bcf86cd799439016",
      "onChainAddress": "8xMq...7nPu",
      "promotion": "507f1f77bcf86cd799439011",
      "targetParticipants": 50,
      "currentParticipants": 0,
      "status": "active",
      "expiresAt": "2024-01-22T10:30:00.000Z"
    },
    "transactionSignature": "6xTw...4nR1"
  }
}
```

---

### Join Group Deal
**POST** `/group-deals/:dealId/join`

Joins an active group deal.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentParticipants": 15,
    "currentTier": {
      "participants": 10,
      "discountPercentage": 30
    },
    "transactionSignature": "7xUx...5nR2"
  }
}
```

---

### Finalize Group Deal
**POST** `/group-deals/:dealId/finalize`

Finalizes a group deal and mints coupons.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "finalParticipants": 52,
    "finalDiscount": 50,
    "transactionSignature": "8xVy...6nR3"
  }
}
```

---

### List Group Deals
**GET** `/group-deals`

Lists all group deals.

**Query Parameters:**
- `status` (string): 'active' | 'completed' | 'expired'
- `page` (number)
- `limit` (number)

---

### Get Group Deal Details
**GET** `/group-deals/:dealId`

Retrieves details of a specific group deal.

---

## Auctions

### Create Auction
**POST** `/auctions/create`

Creates a new auction for a coupon.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "couponId": "507f1f77bcf86cd799439013",
  "startingPrice": 5.00,
  "reservePrice": 8.00,
  "duration": 3
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "auction": {
      "id": "507f1f77bcf86cd799439017",
      "onChainAddress": "9xNr...8nPv",
      "coupon": "507f1f77bcf86cd799439013",
      "seller": "8xKz...9mPq",
      "startingPrice": 5.00,
      "currentBid": 5.00,
      "highestBidder": null,
      "status": "active",
      "endsAt": "2024-01-18T10:30:00.000Z"
    },
    "transactionSignature": "9xWz...7nR4"
  }
}
```

---

### Place Bid
**POST** `/auctions/:auctionId/bid`

Places a bid on an auction.

**Request Body:**
```json
{
  "walletAddress": "9yLm...3nQr",
  "bidAmount": 7.50
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentBid": 7.50,
    "highestBidder": "9yLm...3nQr",
    "transactionSignature": "1xX1...8nR5"
  }
}
```

---

### Settle Auction
**POST** `/auctions/:auctionId/settle`

Settles a completed auction.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "winner": "9yLm...3nQr",
    "finalPrice": 7.50,
    "transactionSignature": "2xY2...9nR6"
  }
}
```

---

### List Auctions
**GET** `/auctions`

Lists all auctions.

**Query Parameters:**
- `status` (string): 'active' | 'completed' | 'cancelled'
- `page` (number)
- `limit` (number)

---

### Get Auction Details
**GET** `/auctions/:auctionId`

Retrieves details of a specific auction.

---

## Badges

### Get Badge Types
**GET** `/badges/types`

Retrieves all available badge types.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "early_adopter",
        "name": "Early Adopter",
        "description": "Joined in the first month",
        "imageUrl": "https://images.pexels.com/photos/4610793/pexels-photo-4610793.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
        "criteria": {
          "type": "registration_date",
          "value": "2024-01-31"
        }
      }
    ]
  }
}
```

---

### Mint Badge
**POST** `/badges/mint`

Mints a badge NFT for a user.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "badgeType": "early_adopter"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "badge": {
      "id": "507f1f77bcf86cd799439018",
      "badgeType": "early_adopter",
      "owner": "8xKz...9mPq",
      "mintAddress": "3xZ3...1nPw"
    },
    "transactionSignature": "4x14...2nR7"
  }
}
```

---

### Auto Award Badge
**POST** `/badges/auto-award`

Automatically awards badges based on user activity.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq"
}
```

---

### Get User Badges
**GET** `/badges/user/:userAddress`

Retrieves all badges owned by a user.

---

### Check Badge Eligibility
**GET** `/badges/check-eligibility/:userAddress`

Checks which badges a user is eligible for.

---

## Staking

### Stake Coupon
**POST** `/staking/stake`

Stakes a coupon to earn rewards.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "couponId": "507f1f77bcf86cd799439013",
  "duration": 30
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stake": {
      "id": "507f1f77bcf86cd799439019",
      "coupon": "507f1f77bcf86cd799439013",
      "staker": "8xKz...9mPq",
      "stakedAt": "2024-01-15T10:30:00.000Z",
      "unlocksAt": "2024-02-14T10:30:00.000Z",
      "estimatedRewards": 2.50
    },
    "transactionSignature": "5x25...3nR8"
  }
}
```

---

### Claim Rewards
**POST** `/staking/claim`

Claims staking rewards.

**Request Body:**
```json
{
  "walletAddress": "8xKz...9mPq",
  "stakeId": "507f1f77bcf86cd799439019"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rewards": 2.50,
    "transactionSignature": "6x36...4nR9"
  }
}
```

---

### Get User Stakes
**GET** `/staking/user/:userAddress`

Retrieves all stakes for a user.

---

### Get Coupon Stake
**GET** `/staking/coupon/:couponId`

Retrieves stake information for a specific coupon.

---

### Get Staking Pool
**GET** `/staking/pool`

Retrieves staking pool information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalStaked": 150,
    "totalRewards": 375.50,
    "apy": 12.5
  }
}
```

---

## Comments & Ratings

### List Comments
**GET** `/promotions/:promotionId/comments`

Lists comments for a promotion.

**Query Parameters:**
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "user": {
          "username": "john_doe",
          "walletAddress": "8xKz...9mPq"
        },
        "content": "Great deal! Highly recommend.",
        "likes": 15,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### Create Comment
**POST** `/promotions/:promotionId/comments`

Creates a comment on a promotion.

**Request Body:**
```json
{
  "content": "Great deal! Highly recommend."
}
```

**Headers:**
```
X-Wallet-Address: <user-wallet-address>
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "507f1f77bcf86cd799439020",
      "content": "Great deal! Highly recommend.",
      "likes": 0,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### Like Comment
**POST** `/comments/:commentId/like`

Likes a comment.

**Headers:**
```
X-Wallet-Address: <user-wallet-address>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "likes": 16
  }
}
```

---

### Delete Comment
**DELETE** `/comments/:commentId`

Deletes a comment (author only).

**Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

### List Ratings
**GET** `/promotions/:promotionId/ratings`

Lists ratings for a promotion.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ratings": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "user": "8xKz...9mPq",
        "stars": 5,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### Create/Update Rating
**POST** `/promotions/:promotionId/ratings`

Creates or updates a rating for a promotion.

**Request Body:**
```json
{
  "stars": 5
}
```

**Headers:**
```
X-Wallet-Address: <user-wallet-address>
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "rating": {
      "id": "507f1f77bcf86cd799439021",
      "stars": 5,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### Get Rating Stats
**GET** `/promotions/:promotionId/ratings/stats`

Retrieves rating statistics for a promotion.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "average": 4.5,
    "total": 150,
    "distribution": {
      "5": 100,
      "4": 30,
      "3": 15,
      "2": 3,
      "1": 2
    }
  }
}
```

---

## External Deals

### Sync Flight Deals
**POST** `/external/sync-flights`

Syncs flight deals from external sources.

---

### Sync Hotel Deals
**POST** `/external/sync-hotels`

Syncs hotel deals from external sources.

---

### Get External Deals
**GET** `/external/deals`

Retrieves external deals.

---

### List External Deals
**GET** `/external-deals`

Lists all external deals.

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `source` (string)
- `category` (string)

---

### Get External Deal Details
**GET** `/external-deals/:dealId`

Retrieves details of a specific external deal.

---

### Create External Deal
**POST** `/external-deals`

Creates a new external deal (oracle only).

---

### Update External Deal
**PATCH** `/external-deals/:dealId`

Updates an external deal (oracle only).

---

## File Upload

### Upload Image
**POST** `/upload/:type`

Uploads an image file.

**Parameters:**
- `type` (path): 'promotions' | 'merchants' | 'users' | 'badges'

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `image`
- Accepted formats: jpg, jpeg, png, gif, webp
- Max size: 5MB

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/promotions/1705318200000-pizza.jpg",
    "filename": "1705318200000-pizza.jpg",
    "path": "uploads/promotions/1705318200000-pizza.jpg"
  }
}
```

---

### Delete Image
**DELETE** `/upload/:type/:filename`

Deletes an uploaded image.

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized access"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Not authorized to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Detailed error message (development only)"
}
```

---

## Common Headers

### Authentication
```
X-Wallet-Address: <wallet-address>
```

### Content Type
```
Content-Type: application/json
```

---

## Pagination

Most list endpoints support pagination with the following query parameters:

- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page

Pagination response format:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. This will be added in production.

---

## Webhooks

Webhook support is planned for future releases to notify external systems of:
- New promotions created
- Coupons minted
- Redemptions completed
- Marketplace transactions

---

## API Versioning

Current version: `v1`

All endpoints are prefixed with `/api/v1/`

---

## Support

For API support, please contact the development team or refer to the main README.md file.
