use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod burn_boost_token {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        decimals: u8,
        initial_supply: u64,
        base_market_cap: u64,
    ) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;
        token_data.authority = ctx.accounts.authority.key();
        token_data.mint = ctx.accounts.mint.key();
        token_data.name = name;
        token_data.symbol = symbol;
        token_data.decimals = decimals;
        token_data.initial_supply = initial_supply;
        token_data.current_supply = initial_supply;
        token_data.total_burned = 0;
        token_data.base_market_cap = base_market_cap;
        token_data.current_boost_multiplier = 10000; // 100% in basis points
        token_data.burn_transaction_count = 0;
        token_data.bump = ctx.bumps.token_data;

        // Mint initial supply to authority
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.authority_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, initial_supply)?;

        Ok(())
    }

    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidBurnAmount);

        let token_data = &mut ctx.accounts.token_data;
        let user_data = &mut ctx.accounts.user_data;

        // Update burn statistics
        token_data.total_burned = token_data.total_burned.checked_add(amount).unwrap();
        token_data.current_supply = token_data.current_supply.checked_sub(amount).unwrap();
        token_data.burn_transaction_count = token_data.burn_transaction_count.checked_add(1).unwrap();
        
        // Update user burn amount
        user_data.burned_amount = user_data.burned_amount.checked_add(amount).unwrap();

        // Calculate and update market cap boost
        let old_multiplier = token_data.current_boost_multiplier;
        update_market_cap_boost(token_data)?;

        // Burn tokens from user's account
        let cpi_accounts = token::Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, amount)?;

        // Emit events
        emit!(TokensBurned {
            user: ctx.accounts.user.key(),
            amount,
            new_market_cap_multiplier: token_data.current_boost_multiplier,
        });

        if old_multiplier != token_data.current_boost_multiplier {
            emit!(MarketCapBoosted {
                old_multiplier,
                new_multiplier: token_data.current_boost_multiplier,
                percentage_burned: get_burned_percentage(token_data)?,
            });
        }

        Ok(())
    }

    pub fn get_token_stats(ctx: Context<GetTokenStats>) -> Result<TokenStats> {
        let token_data = &ctx.accounts.token_data;
        
        Ok(TokenStats {
            initial_supply: token_data.initial_supply,
            current_supply: token_data.current_supply,
            total_burned: token_data.total_burned,
            burned_percentage: get_burned_percentage(token_data)?,
            current_market_cap: get_current_market_cap(token_data)?,
            boost_percentage: get_boost_percentage(token_data)?,
            burn_transaction_count: token_data.burn_transaction_count,
        })
    }

    pub fn calculate_boost_from_burn(
        ctx: Context<CalculateBoost>,
        burn_amount: u64,
    ) -> Result<u64> {
        let token_data = &ctx.accounts.token_data;
        let potential_total_burned = token_data.total_burned.checked_add(burn_amount).unwrap();
        let potential_burned_percentage = (potential_total_burned as u128)
            .checked_mul(10000)
            .unwrap()
            .checked_div(token_data.initial_supply as u128)
            .unwrap() as u64;
        
        let potential_boost_amount = potential_burned_percentage
            .checked_mul(10)
            .unwrap()
            .checked_div(100)
            .unwrap();
        
        let max_boost = 5000; // 50% max boost
        Ok(std::cmp::min(potential_boost_amount, max_boost))
    }
}

// Helper functions
fn update_market_cap_boost(token_data: &mut TokenData) -> Result<()> {
    let burned_percentage = get_burned_percentage(token_data)?;
    
    // Calculate boost: 0.1% boost for every 1% burned
    let boost_amount = burned_percentage.checked_mul(10).unwrap().checked_div(100).unwrap();
    
    // Cap the maximum boost at 50%
    let max_boost = 5000;
    let capped_boost = std::cmp::min(boost_amount, max_boost);
    
    // Update multiplier (10000 = 100%, 15000 = 150%)
    token_data.current_boost_multiplier = 10000_u64.checked_add(capped_boost).unwrap();
    
    Ok(())
}

fn get_burned_percentage(token_data: &TokenData) -> Result<u64> {
    if token_data.initial_supply == 0 {
        return Ok(0);
    }
    
    Ok((token_data.total_burned as u128)
        .checked_mul(10000)
        .unwrap()
        .checked_div(token_data.initial_supply as u128)
        .unwrap() as u64)
}

fn get_current_market_cap(token_data: &TokenData) -> Result<u64> {
    Ok((token_data.base_market_cap as u128)
        .checked_mul(token_data.current_boost_multiplier as u128)
        .unwrap()
        .checked_div(10000)
        .unwrap() as u64)
}

fn get_boost_percentage(token_data: &TokenData) -> Result<u64> {
    Ok(token_data.current_boost_multiplier.checked_sub(10000).unwrap())
}

// Account structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + TokenData::INIT_SPACE,
        seeds = [b"token_data", mint.key().as_ref()],
        bump
    )]
    pub token_data: Account<'info, TokenData>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"token_data", mint.key().as_ref()],
        bump = token_data.bump
    )]
    pub token_data: Account<'info, TokenData>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserData::INIT_SPACE,
        seeds = [b"user_data", user.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub user_data: Account<'info, UserData>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetTokenStats<'info> {
    #[account(
        seeds = [b"token_data", mint.key().as_ref()],
        bump = token_data.bump
    )]
    pub token_data: Account<'info, TokenData>,
    pub mint: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct CalculateBoost<'info> {
    #[account(
        seeds = [b"token_data", mint.key().as_ref()],
        bump = token_data.bump
    )]
    pub token_data: Account<'info, TokenData>,
    pub mint: Account<'info, Mint>,
}

// Data structures
#[account]
#[derive(InitSpace)]
pub struct TokenData {
    pub authority: Pubkey,
    pub mint: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(16)]
    pub symbol: String,
    pub decimals: u8,
    pub initial_supply: u64,
    pub current_supply: u64,
    pub total_burned: u64,
    pub base_market_cap: u64,
    pub current_boost_multiplier: u64,
    pub burn_transaction_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserData {
    pub user: Pubkey,
    pub burned_amount: u64,
    pub bump: u8,
}

// Return types
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TokenStats {
    pub initial_supply: u64,
    pub current_supply: u64,
    pub total_burned: u64,
    pub burned_percentage: u64,
    pub current_market_cap: u64,
    pub boost_percentage: u64,
    pub burn_transaction_count: u64,
}

// Events
#[event]
pub struct TokensBurned {
    pub user: Pubkey,
    pub amount: u64,
    pub new_market_cap_multiplier: u64,
}

#[event]
pub struct MarketCapBoosted {
    pub old_multiplier: u64,
    pub new_multiplier: u64,
    pub percentage_burned: u64,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Burn amount must be greater than zero")]
    InvalidBurnAmount,
    #[msg("Insufficient balance to burn")]
    InsufficientBalance,
}