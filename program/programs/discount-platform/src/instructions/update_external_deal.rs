
pub fn handler(
    ctx: Context<UpdateExternalDeal>,
    external_id: String,
    title: String,
    description: String,
    original_price: u64,
    discounted_price: u64,
    category: String,
    image_url: String,
    affiliate_url: String,
    expiry_timestamp: i64,
) -> Result<()> {
    require!(
        ctx.accounts.oracle_authority.key() == ctx.accounts.oracle_config.authority,
        OracleError::UnauthorizedOracle
    );
    
    let deal = &mut ctx.accounts.external_deal;
    let current_time = Clock::get()?.unix_timestamp;
    
    // First-time initialization
    if deal.oracle_authority == Pubkey::default() {
        deal.oracle_authority = ctx.accounts.oracle_authority.key();
        deal.source = DealSource::Skyscanner; // Or pass as param
        deal.external_id = external_id;
        deal.verification_count = 1;
        deal.is_verified = false;
    } else {
        // Update existing deal
        require!(
            current_time - deal.last_updated >= ctx.accounts.oracle_config.update_interval,
            OracleError::UpdateTooFrequent
        );
        deal.verification_count += 1;
    }
    
    // Update deal data
    deal.title = title.clone();
    deal.description = description;
    deal.original_price = original_price;
    deal.discounted_price = discounted_price;
    deal.discount_percentage = ((original_price - discounted_price) * 100 / original_price) as u8;
    deal.category = category;
    deal.image_url = image_url;
    deal.affiliate_url = affiliate_url;
    deal.expiry_timestamp = expiry_timestamp;
    deal.last_updated = current_time;
    
    // Mark as verified after threshold
    if deal.verification_count >= ctx.accounts.oracle_config.min_verification_count {
        deal.is_verified = true;
    }
    
    emit!(ExternalDealUpdated {
        deal: deal.key(),
        source: deal.source,
        external_id: deal.external_id.clone(),
        price: discounted_price,
        verified: deal.is_verified,
    });
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(external_id: String)]
pub struct UpdateExternalDeal<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + ExternalDeal::INIT_SPACE,
        seeds = [b"external_deal", external_id.as_bytes()],
        bump
    )]
    pub external_deal: Account<'info, ExternalDeal>,
    
    pub oracle_config: Account<'info, OracleConfig>,
    
    pub oracle_authority: Signer<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
