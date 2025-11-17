# GigMate Free Model Summary

## Revenue Model Update

**Effective Date:** November 5, 2025

### What Changed

GigMate has moved to a **100% FREE platform** for all users. There are no subscription fees, no tier levels, and no premium memberships.

### New Revenue Structure

GigMate generates revenue through transaction fees on **EVERY transaction**:

#### **Ticket Sales: 12.5% Platform Fee**
- Applied to all ticket purchases through the platform
- Clean, transparent fee structure
- No hidden costs for users

#### **All Other Transactions: 10% Platform Fee**
This applies to **every transaction** on the platform:
- Cashless food & beverage sales
- Merchandise purchases
- Other in-venue transactions
- Digital content sales
- **Credit purchases** (10% added to purchase price)
- **Premium fan messaging** (10% included in messaging costs)
- **Any payment processed through GigMate**

#### **Credit System Revenue**
When fans purchase credits to message artists:
- Example: Fan wants 100 credits
- Credit value: $10.00
- Platform fee (10%): $1.00
- **Total charge to fan: $11.00**
- Artist receives the credits when earned
- GigMate keeps the 10% platform fee

### What This Means for Users

#### **For Musicians**
-  FREE account with full access to all features
-  No monthly subscription fees
-  Create unlimited events
-  Sell unlimited merchandise
-  Access all platform tools
-  Only pay when you earn (via ticket/merch sales)

#### **For Venues**
-  FREE account with full access to all features
-  No monthly subscription fees
-  Post unlimited events
-  Access all booking tools
-  Full analytics and reporting
-  Only pay when you process transactions

#### **For Fans**
-  FREE account forever
-  Browse all events
-  Purchase tickets
-  Buy merchandise
-  Message artists
-  No hidden fees (only standard platform fees on purchases)

### Fee Transparency

**Example 1: Ticket Sales**
- Ticket Price: $50.00
- Platform Fee (12.5%): $6.25
- Artist/Venue Receives: $43.75

**Example 2: Merchandise Sales**
- Merch Price: $25.00
- Platform Fee (10%): $2.50
- Artist Receives: $22.50

**Example 3: Food & Beverage**
- Total: $40.00
- Platform Fee (10%): $4.00
- Venue Receives: $36.00

**Example 4: Credit Purchase**
- Credits Desired: 100 credits ($10.00 value)
- Platform Fee (10%): $1.00
- **Total Fan Pays: $11.00**
- GigMate Revenue: $1.00

**Example 5: Premium Message**
- Single Message: $0.99
- Platform Fee (10%): $0.10
- **Total Fan Pays: $1.09**
- Artist receives credits equivalent to $0.99
- GigMate Revenue: $0.10

### Why This Change?

1. **Lower Barrier to Entry** - Everyone can start immediately without upfront costs
2. **Align with Success** - GigMate only succeeds when our users succeed
3. **Simpler Pricing** - No complex tier structures to understand
4. **Fair Model** - Pay based on actual usage, not potential
5. **Industry Standard** - Similar to other successful marketplace platforms

### Database Changes

- Removed `tier` column from profiles
- Removed `tier_expires_at` column
- Removed `subscription_status` column
- Removed `venue_subscriptions` table
- Removed `subscription_tiers` table
- Updated transaction processing with new fee structure

### Technical Implementation

All transaction processing automatically applies the correct fee:
- System checks transaction category
- Applies 12.5% for ticket_sale transactions
- Applies 10% for all other transaction categories
- Calculates platform_fee automatically
- Net amount credited to merchant account

**Credit Purchase System:**
- Fan purchases credits through Stripe
- 10% platform fee added to total
- Credits added to fan's account
- When spent, credits transfer to artist
- Platform retains original 10% fee

**Premium Messaging System:**
- Messaging costs paid in credits
- Credits purchased with 10% platform fee included
- Artists earn credits when fans message them
- Credits can be converted to cash (minus processing fees)
- GigMate earns 10% on every credit purchase

### Marketing Message

**"GigMate: Always Free. Always Fair."**

Join thousands of musicians, venues, and fans on the only 100% free live music platform. No subscription fees. No hidden costs. Just great music and fair, transparent transaction fees.

### Support

For questions about the new pricing model:
- Email: support@gigmate.us
- Documentation: /docs
- FAQ: /faq

---

**GigMate** - Connecting the live music community, one gig at a time.
