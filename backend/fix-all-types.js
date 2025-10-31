const fs = require('fs');
const path = require('path');

// Fix all controller files
const controllers = [
  'src/controllers/coupon.ts',
  'src/controllers/redemption-ticket.ts',
  'src/controllers/rating.ts',
  'src/controllers/group-deal.ts',
  'src/controllers/external.ts',
  'src/controllers/promotion.ts',
  'src/controllers/staking.ts',
  'src/controllers/merchant.ts',
  'src/controllers/marketplace.ts',
  'src/controllers/social.ts',
  'src/controllers/redemption.ts',
  'src/controllers/merchant-dashboard.ts',
  'src/controllers/user-stats.ts'
];

controllers.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add Promise<void> return type to async methods
  content = content.replace(
    /async (\w+)\(req: Request, res: Response\) \{/g,
    'async $1(req: Request, res: Response): Promise<void> {'
  );
  
  // Fix return res.status patterns - this is tricky, we'll do it manually
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('All controller return types fixed!');