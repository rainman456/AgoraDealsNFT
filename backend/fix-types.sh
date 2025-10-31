#!/bin/bash

# Fix all controller methods to return Promise<void>
echo "Fixing controller return types..."

# List of controller files
controllers=(
  "src/controllers/auction.ts"
  "src/controllers/badge.ts"
  "src/controllers/coupon.ts"
  "src/controllers/external.ts"
  "src/controllers/group-deal.ts"
  "src/controllers/marketplace.ts"
  "src/controllers/merchant-dashboard.ts"
  "src/controllers/merchant.ts"
  "src/controllers/promotion.ts"
  "src/controllers/rating.ts"
  "src/controllers/redemption-ticket.ts"
  "src/controllers/redemption.ts"
  "src/controllers/social.ts"
  "src/controllers/staking.ts"
  "src/controllers/user-stats.ts"
)

for file in "${controllers[@]}"; do
  if [ -f "$file" ]; then
    # Add Promise<void> return type to async methods
    sed -i 's/async \([a-zA-Z_]*\)(req: Request, res: Response) {/async \1(req: Request, res: Response): Promise<void> {/g' "$file"
    
    # Fix return statements - change "return res.status" to "res.status" and add return
    # This is a simplified approach - we'll handle this in the TypeScript files directly
  fi
done

echo "Controller return types fixed!"
