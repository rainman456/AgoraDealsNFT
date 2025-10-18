use anchor_lang::prelude::*;
use anchor_client::{Client, Cluster};
use solana_sdk::{
    commitment_config::CommitmentConfig,
    signature::{Keypair, Signer, EncodableKey},
    pubkey::Pubkey,
    system_program,
};
use std::rc::Rc;

#[test]
fn test_initialize_marketplace() {
    let program_id = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".parse::<Pubkey>().unwrap();
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap_or_else(|_| "/root/.config/solana/id.json".to_string());
    let payer = Keypair::read_from_file(&*shellexpand::tilde(&anchor_wallet)).unwrap();

    let client = Client::new_with_options(Cluster::Localnet, Rc::new(payer), CommitmentConfig::processed());
    let program = client.program(program_id).unwrap();

    // Derive marketplace PDA
    let (marketplace_pda, _) = Pubkey::find_program_address(&[b"marketplace"], &program_id);

    println!("=== Test: Initialize Marketplace ===");
    println!("Marketplace PDA: {}", marketplace_pda);

    // Initialize marketplace
    let tx = program
        .request()
        .accounts(my_program::accounts::Initialize {
            marketplace: marketplace_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::Initialize {})
        .send()
        .unwrap();

    println!("Initialize marketplace signature: {}", tx);

    // Verify marketplace state
    let marketplace: my_program::Marketplace = program.account(marketplace_pda).unwrap();
    assert_eq!(marketplace.authority, program.payer());
    assert_eq!(marketplace.total_coupons, 0);
    assert_eq!(marketplace.total_merchants, 0);
    assert_eq!(marketplace.fee_basis_points, 250);
    println!("✅ Marketplace initialized successfully");
}

#[test]
fn test_register_merchant() {
    let program_id = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".parse::<Pubkey>().unwrap();
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap_or_else(|_| "/root/.config/solana/id.json".to_string());
    let payer = Keypair::read_from_file(&*shellexpand::tilde(&anchor_wallet)).unwrap();

    let client = Client::new_with_options(Cluster::Localnet, Rc::new(payer), CommitmentConfig::processed());
    let program = client.program(program_id).unwrap();

    // Initialize marketplace first
    let (marketplace_pda, _) = Pubkey::find_program_address(&[b"marketplace"], &program_id);
    
    let _tx = program
        .request()
        .accounts(my_program::accounts::Initialize {
            marketplace: marketplace_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::Initialize {})
        .send()
        .unwrap();

    // Derive merchant PDA
    let (merchant_pda, _) = Pubkey::find_program_address(&[b"merchant", program.payer().as_ref()], &program_id);

    println!("=== Test: Register Merchant ===");
    println!("Merchant PDA: {}", merchant_pda);

    // Register merchant
    let tx = program
        .request()
        .accounts(my_program::accounts::RegisterMerchant {
            merchant: merchant_pda,
            marketplace: marketplace_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::RegisterMerchant {
            name: "Test Coffee Shop".to_string(),
            category: "Food & Beverage".to_string(),
        })
        .send()
        .unwrap();

    println!("Register merchant signature: {}", tx);

    // Verify merchant state
    let merchant: my_program::Merchant = program.account(merchant_pda).unwrap();
    assert_eq!(merchant.authority, program.payer());
    assert_eq!(merchant.name, "Test Coffee Shop");
    assert_eq!(merchant.category, "Food & Beverage");
    assert_eq!(merchant.total_coupons_created, 0);
    assert_eq!(merchant.total_coupons_redeemed, 0);
    assert!(merchant.is_active);

    // Verify marketplace updated
    let marketplace: my_program::Marketplace = program.account(marketplace_pda).unwrap();
    assert_eq!(marketplace.total_merchants, 1);
    println!("✅ Merchant registered successfully");
}

#[test]
fn test_create_coupon_promotion() {
    let program_id = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".parse::<Pubkey>().unwrap();
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap_or_else(|_| "/root/.config/solana/id.json".to_string());
    let payer = Keypair::read_from_file(&*shellexpand::tilde(&anchor_wallet)).unwrap();

    let client = Client::new_with_options(Cluster::Localnet, Rc::new(payer), CommitmentConfig::processed());
    let program = client.program(program_id).unwrap();

    // Setup marketplace and merchant
    let (marketplace_pda, _) = Pubkey::find_program_address(&[b"marketplace"], &program_id);
    let (merchant_pda, _) = Pubkey::find_program_address(&[b"merchant", program.payer().as_ref()], &program_id);

    let _tx1 = program
        .request()
        .accounts(my_program::accounts::Initialize {
            marketplace: marketplace_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::Initialize {})
        .send()
        .unwrap();

    let _tx2 = program
        .request()
        .accounts(my_program::accounts::RegisterMerchant {
            merchant: merchant_pda,
            marketplace: marketplace_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::RegisterMerchant {
            name: "Test Coffee Shop".to_string(),
            category: "Food & Beverage".to_string(),
        })
        .send()
        .unwrap();

    // Create promotion
    let (promotion_pda, _) = Pubkey::find_program_address(
        &[b"promotion", merchant_pda.as_ref(), &0u64.to_le_bytes()],
        &program_id
    );

    let expiry_timestamp = chrono::Utc::now().timestamp() + 86400; // 24 hours from now

    println!("=== Test: Create Coupon Promotion ===");
    println!("Promotion PDA: {}", promotion_pda);

    let tx = program
        .request()
        .accounts(my_program::accounts::CreateCouponPromotion {
            promotion: promotion_pda,
            merchant: merchant_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::CreateCouponPromotion {
            discount_percentage: 20,
            max_supply: 100,
            expiry_timestamp,
            category: "Coffee".to_string(),
            description: "20% off any coffee drink".to_string(),
            price: 1000000, // 0.001 SOL
        })
        .send()
        .unwrap();

    println!("Create promotion signature: {}", tx);

    // Verify promotion state
    let promotion: my_program::Promotion = program.account(promotion_pda).unwrap();
    assert_eq!(promotion.merchant, merchant_pda);
    assert_eq!(promotion.discount_percentage, 20);
    assert_eq!(promotion.max_supply, 100);
    assert_eq!(promotion.current_supply, 0);
    assert_eq!(promotion.category, "Coffee");
    assert_eq!(promotion.description, "20% off any coffee drink");
    assert_eq!(promotion.price, 1000000);
    assert!(promotion.is_active);
    println!("✅ Promotion created successfully");
}

#[test]
fn test_mint_coupon() {
    let program_id = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".parse::<Pubkey>().unwrap();
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap_or_else(|_| "/root/.config/solana/id.json".to_string());
    let payer = Keypair::read_from_file(&*shellexpand::tilde(&anchor_wallet)).unwrap();

    let client = Client::new_with_options(Cluster::Localnet, Rc::new(payer), CommitmentConfig::processed());
    let program = client.program(program_id).unwrap();

    // Setup marketplace, merchant, and promotion
    let (marketplace_pda, _) = Pubkey::find_program_address(&[b"marketplace"], &program_id);
    let (merchant_pda, _) = Pubkey::find_program_address(&[b"merchant", program.payer().as_ref()], &program_id);
    let (promotion_pda, _) = Pubkey::find_program_address(
        &[b"promotion", merchant_pda.as_ref(), &0u64.to_le_bytes()],
        &program_id
    );

    let _setup_txs = setup_marketplace_merchant_and_promotion(&program, marketplace_pda, merchant_pda, promotion_pda);

    // Derive coupon PDA
    let (coupon_pda, _) = Pubkey::find_program_address(
        &[b"coupon", promotion_pda.as_ref(), &0u32.to_le_bytes()],
        &program_id
    );

    println!("=== Test: Mint Coupon ===");
    println!("Coupon PDA: {}", coupon_pda);

    // Mint coupon
    let tx = program
        .request()
        .accounts(my_program::accounts::MintCoupon {
            coupon: coupon_pda,
            promotion: promotion_pda,
            merchant: merchant_pda,
            marketplace: marketplace_pda,
            recipient: program.payer(),
            payer: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::MintCoupon {
            coupon_id: 1,
        })
        .send()
        .unwrap();

    println!("Mint coupon signature: {}", tx);

    // Verify coupon state
    let coupon: my_program::Coupon = program.account(coupon_pda).unwrap();
    assert_eq!(coupon.id, 1);
    assert_eq!(coupon.promotion, promotion_pda);
    assert_eq!(coupon.owner, program.payer());
    assert_eq!(coupon.merchant, merchant_pda);
    assert_eq!(coupon.discount_percentage, 20);
    assert!(!coupon.is_redeemed);

    // Verify promotion updated
    let promotion: my_program::Promotion = program.account(promotion_pda).unwrap();
    assert_eq!(promotion.current_supply, 1);

    // Verify merchant updated
    let merchant: my_program::Merchant = program.account(merchant_pda).unwrap();
    assert_eq!(merchant.total_coupons_created, 1);

    // Verify marketplace updated
    let marketplace: my_program::Marketplace = program.account(marketplace_pda).unwrap();
    assert_eq!(marketplace.total_coupons, 1);
    println!("✅ Coupon minted successfully");
}

#[test]
fn test_transfer_coupon() {
    let program_id = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".parse::<Pubkey>().unwrap();
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap_or_else(|_| "/root/.config/solana/id.json".to_string());
    let payer = Keypair::read_from_file(&*shellexpand::tilde(&anchor_wallet)).unwrap();

    let client = Client::new_with_options(Cluster::Localnet, Rc::new(payer), CommitmentConfig::processed());
    let program = client.program(program_id).unwrap();

    // Setup and mint a coupon first
    let (marketplace_pda, _) = Pubkey::find_program_address(&[b"marketplace"], &program_id);
    let (merchant_pda, _) = Pubkey::find_program_address(&[b"merchant", program.payer().as_ref()], &program_id);
    let (promotion_pda, _) = Pubkey::find_program_address(
        &[b"promotion", merchant_pda.as_ref(), &0u64.to_le_bytes()],
        &program_id
    );
    let (coupon_pda, _) = Pubkey::find_program_address(
        &[b"coupon", promotion_pda.as_ref(), &0u32.to_le_bytes()],
        &program_id
    );

    let _setup_txs = setup_marketplace_merchant_and_promotion(&program, marketplace_pda, merchant_pda, promotion_pda);

    // Mint coupon
    let _mint_tx = program
        .request()
        .accounts(my_program::accounts::MintCoupon {
            coupon: coupon_pda,
            promotion: promotion_pda,
            merchant: merchant_pda,
            marketplace: marketplace_pda,
            recipient: program.payer(),
            payer: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::MintCoupon {
            coupon_id: 1,
        })
        .send()
        .unwrap();

    // Create new owner
    let new_owner = Keypair::new();

    println!("=== Test: Transfer Coupon ===");
    println!("New owner: {}", new_owner.pubkey());

    // Transfer coupon
    let tx = program
        .request()
        .accounts(my_program::accounts::TransferCoupon {
            coupon: coupon_pda,
            new_owner: new_owner.pubkey(),
            from_authority: program.payer(),
        })
        .args(my_program::instruction::TransferCoupon {})
        .send()
        .unwrap();

    println!("Transfer coupon signature: {}", tx);

    // Verify coupon owner updated
    let coupon: my_program::Coupon = program.account(coupon_pda).unwrap();
    assert_eq!(coupon.owner, new_owner.pubkey());
    println!("✅ Coupon transferred successfully");
}

#[test]
fn test_redeem_coupon() {
    let program_id = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".parse::<Pubkey>().unwrap();
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap_or_else(|_| "/root/.config/solana/id.json".to_string());
    let payer = Keypair::read_from_file(&*shellexpand::tilde(&anchor_wallet)).unwrap();

    let client = Client::new_with_options(Cluster::Localnet, Rc::new(payer), CommitmentConfig::processed());
    let program = client.program(program_id).unwrap();

    // Setup and mint a coupon
    let (marketplace_pda, _) = Pubkey::find_program_address(&[b"marketplace"], &program_id);
    let (merchant_pda, _) = Pubkey::find_program_address(&[b"merchant", program.payer().as_ref()], &program_id);
    let (promotion_pda, _) = Pubkey::find_program_address(
        &[b"promotion", merchant_pda.as_ref(), &0u64.to_le_bytes()],
        &program_id
    );
    let (coupon_pda, _) = Pubkey::find_program_address(
        &[b"coupon", promotion_pda.as_ref(), &0u32.to_le_bytes()],
        &program_id
    );

    let _setup_txs = setup_marketplace_merchant_and_promotion(&program, marketplace_pda, merchant_pda, promotion_pda);

    let _mint_tx = program
        .request()
        .accounts(my_program::accounts::MintCoupon {
            coupon: coupon_pda,
            promotion: promotion_pda,
            merchant: merchant_pda,
            marketplace: marketplace_pda,
            recipient: program.payer(),
            payer: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::MintCoupon {
            coupon_id: 1,
        })
        .send()
        .unwrap();

    println!("=== Test: Redeem Coupon ===");

    // Redeem coupon
    let tx = program
        .request()
        .accounts(my_program::accounts::RedeemCoupon {
            coupon: coupon_pda,
            merchant: merchant_pda,
            user: program.payer(),
            merchant_authority: program.payer(),
        })
        .args(my_program::instruction::RedeemCoupon {})
        .send()
        .unwrap();

    println!("Redeem coupon signature: {}", tx);

    // Verify coupon is redeemed
    let coupon: my_program::Coupon = program.account(coupon_pda).unwrap();
    assert!(coupon.is_redeemed);
    assert!(coupon.redeemed_at > 0);

    // Verify merchant stats updated
    let merchant: my_program::Merchant = program.account(merchant_pda).unwrap();
    assert_eq!(merchant.total_coupons_redeemed, 1);
    println!("✅ Coupon redeemed successfully");
}

#[test]
fn test_list_and_buy_coupon() {
    let program_id = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".parse::<Pubkey>().unwrap();
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap_or_else(|_| "/root/.config/solana/id.json".to_string());
    let payer = Keypair::read_from_file(&*shellexpand::tilde(&anchor_wallet)).unwrap();

    let client = Client::new_with_options(Cluster::Localnet, Rc::new(payer), CommitmentConfig::processed());
    let program = client.program(program_id).unwrap();

    // Setup and mint a coupon
    let (marketplace_pda, _) = Pubkey::find_program_address(&[b"marketplace"], &program_id);
    let (merchant_pda, _) = Pubkey::find_program_address(&[b"merchant", program.payer().as_ref()], &program_id);
    let (promotion_pda, _) = Pubkey::find_program_address(
        &[b"promotion", merchant_pda.as_ref(), &0u64.to_le_bytes()],
        &program_id
    );
    let (coupon_pda, _) = Pubkey::find_program_address(
        &[b"coupon", promotion_pda.as_ref(), &0u32.to_le_bytes()],
        &program_id
    );

    let _setup_txs = setup_marketplace_merchant_and_promotion(&program, marketplace_pda, merchant_pda, promotion_pda);

    let _mint_tx = program
        .request()
        .accounts(my_program::accounts::MintCoupon {
            coupon: coupon_pda,
            promotion: promotion_pda,
            merchant: merchant_pda,
            marketplace: marketplace_pda,
            recipient: program.payer(),
            payer: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::MintCoupon {
            coupon_id: 1,
        })
        .send()
        .unwrap();

    // List coupon for sale
    let (listing_pda, _) = Pubkey::find_program_address(&[b"listing", coupon_pda.as_ref()], &program_id);
    let list_price = 2000000; // 0.002 SOL

    println!("=== Test: List and Buy Coupon ===");
    println!("Listing PDA: {}", listing_pda);

    let list_tx = program
        .request()
        .accounts(my_program::accounts::ListCouponForSale {
            listing: listing_pda,
            coupon: coupon_pda,
            seller: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::ListCouponForSale {
            price: list_price,
        })
        .send()
        .unwrap();

    println!("List coupon signature: {}", list_tx);

    // Verify listing created
    let listing: my_program::Listing = program.account(listing_pda).unwrap();
    assert_eq!(listing.coupon, coupon_pda);
    assert_eq!(listing.seller, program.payer());
    assert_eq!(listing.price, list_price);
    assert!(listing.is_active);

    // Create buyer
    let buyer = Keypair::new();

    // Buy listed coupon
    let buy_tx = program
        .request()
        .accounts(my_program::accounts::BuyListedCoupon {
            listing: listing_pda,
            coupon: coupon_pda,
            marketplace: marketplace_pda,
            seller: program.payer(),
            buyer: buyer.pubkey(),
            marketplace_authority: program.payer(),
        })
        .args(my_program::instruction::BuyListedCoupon {})
        .signer(&buyer)
        .send()
        .unwrap();

    println!("Buy coupon signature: {}", buy_tx);

    // Verify coupon ownership transferred
    let coupon: my_program::Coupon = program.account(coupon_pda).unwrap();
    assert_eq!(coupon.owner, buyer.pubkey());

    // Verify listing deactivated
    let listing: my_program::Listing = program.account(listing_pda).unwrap();
    assert!(!listing.is_active);
    println!("✅ Coupon listed and bought successfully");
}

#[test]
fn test_error_cases() {
    let program_id = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".parse::<Pubkey>().unwrap();
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap_or_else(|_| "/root/.config/solana/id.json".to_string());
    let payer = Keypair::read_from_file(&*shellexpand::tilde(&anchor_wallet)).unwrap();

    let client = Client::new_with_options(Cluster::Localnet, Rc::new(payer), CommitmentConfig::processed());
    let program = client.program(program_id).unwrap();

    // Setup marketplace and merchant
    let (marketplace_pda, _) = Pubkey::find_program_address(&[b"marketplace"], &program_id);
    let (merchant_pda, _) = Pubkey::find_program_address(&[b"merchant", program.payer().as_ref()], &program_id);

    let _setup_txs = setup_marketplace_and_merchant(&program, marketplace_pda, merchant_pda);

    println!("=== Test: Error Cases ===");

    // Test invalid discount percentage
    let (promotion_pda, _) = Pubkey::find_program_address(
        &[b"promotion", merchant_pda.as_ref(), &0u64.to_le_bytes()],
        &program_id
    );

    let result = program
        .request()
        .accounts(my_program::accounts::CreateCouponPromotion {
            promotion: promotion_pda,
            merchant: merchant_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::CreateCouponPromotion {
            discount_percentage: 150, // Invalid: > 100
            max_supply: 100,
            expiry_timestamp: chrono::Utc::now().timestamp() + 86400,
            category: "Coffee".to_string(),
            description: "Invalid discount".to_string(),
            price: 1000000,
        })
        .send();

    assert!(result.is_err());
    println!("✅ Expected error for invalid discount: {:?}", result.err());

    // Test expired promotion
    let (expired_promotion_pda, _) = Pubkey::find_program_address(
        &[b"promotion", merchant_pda.as_ref(), &1u64.to_le_bytes()],
        &program_id
    );

    let result2 = program
        .request()
        .accounts(my_program::accounts::CreateCouponPromotion {
            promotion: expired_promotion_pda,
            merchant: merchant_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::CreateCouponPromotion {
            discount_percentage: 20,
            max_supply: 100,
            expiry_timestamp: chrono::Utc::now().timestamp() - 3600, // Expired 1 hour ago
            category: "Coffee".to_string(),
            description: "Expired promotion".to_string(),
            price: 1000000,
        })
        .send();

    assert!(result2.is_err());
    println!("✅ Expected error for expired promotion: {:?}", result2.err());
}

#[test]
fn test_access_control() {
    let program_id = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".parse::<Pubkey>().unwrap();
    let anchor_wallet = std::env::var("ANCHOR_WALLET").unwrap_or_else(|_| "/root/.config/solana/id.json".to_string());
    let payer = Keypair::read_from_file(&*shellexpand::tilde(&anchor_wallet)).unwrap();
    let unauthorized_user = Keypair::new();

    let client = Client::new_with_options(Cluster::Localnet, Rc::new(payer), CommitmentConfig::processed());
    let program = client.program(program_id).unwrap();

    // Setup marketplace and merchant
    let (marketplace_pda, _) = Pubkey::find_program_address(&[b"marketplace"], &program_id);
    let (merchant_pda, _) = Pubkey::find_program_address(&[b"merchant", program.payer().as_ref()], &program_id);

    let _setup_txs = setup_marketplace_and_merchant(&program, marketplace_pda, merchant_pda);

    println!("=== Test: Access Control ===");

    // Try to create promotion with unauthorized user
    let unauthorized_client = Client::new_with_options(Cluster::Localnet, Rc::new(unauthorized_user), CommitmentConfig::processed());
    let unauthorized_program = unauthorized_client.program(program_id).unwrap();

    let (promotion_pda, _) = Pubkey::find_program_address(
        &[b"promotion", merchant_pda.as_ref(), &0u64.to_le_bytes()],
        &program_id
    );

    let result = unauthorized_program
        .request()
        .accounts(my_program::accounts::CreateCouponPromotion {
            promotion: promotion_pda,
            merchant: merchant_pda,
            authority: unauthorized_program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::CreateCouponPromotion {
            discount_percentage: 20,
            max_supply: 100,
            expiry_timestamp: chrono::Utc::now().timestamp() + 86400,
            category: "Coffee".to_string(),
            description: "Unauthorized promotion".to_string(),
            price: 1000000,
        })
        .send();

    assert!(result.is_err());
    println!("✅ Unauthorized user correctly blocked from creating promotion");
}

// Helper function to setup marketplace and merchant
fn setup_marketplace_and_merchant(
    program: &anchor_client::Program<Rc<Keypair>>,
    marketplace_pda: Pubkey,
    merchant_pda: Pubkey,
) -> Vec<anchor_client::solana_sdk::signature::Signature> {
    let mut txs = Vec::new();

    // Initialize marketplace
    let tx1 = program
        .request()
        .accounts(my_program::accounts::Initialize {
            marketplace: marketplace_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::Initialize {})
        .send()
        .unwrap();
    txs.push(tx1);

    // Register merchant
    let tx2 = program
        .request()
        .accounts(my_program::accounts::RegisterMerchant {
            merchant: merchant_pda,
            marketplace: marketplace_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::RegisterMerchant {
            name: "Test Coffee Shop".to_string(),
            category: "Food & Beverage".to_string(),
        })
        .send()
        .unwrap();
    txs.push(tx2);

    txs
}

// Helper function to setup marketplace, merchant, and promotion
fn setup_marketplace_merchant_and_promotion(
    program: &anchor_client::Program<Rc<Keypair>>,
    marketplace_pda: Pubkey,
    merchant_pda: Pubkey,
    promotion_pda: Pubkey,
) -> Vec<anchor_client::solana_sdk::signature::Signature> {
    let mut txs = setup_marketplace_and_merchant(program, marketplace_pda, merchant_pda);

    // Create promotion
    let tx3 = program
        .request()
        .accounts(my_program::accounts::CreateCouponPromotion {
            promotion: promotion_pda,
            merchant: merchant_pda,
            authority: program.payer(),
            system_program: system_program::id(),
        })
        .args(my_program::instruction::CreateCouponPromotion {
            discount_percentage: 20,
            max_supply: 100,
            expiry_timestamp: chrono::Utc::now().timestamp() + 86400,
            category: "Coffee".to_string(),
            description: "20% off any coffee drink".to_string(),
            price: 1000000,
        })
        .send()
        .unwrap();
    txs.push(tx3);

    txs
}