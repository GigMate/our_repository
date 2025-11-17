# GigMate Day 2 Testing Checklist

## Quick Reference: What to Test Today

---

##  CRITICAL TESTS (Must Complete Today)

### 1. Authentication Flows
- [ ] **Musician signup** - with genres
- [ ] **Venue signup** - with genres  
- [ ] **Fan signup** - optional genres
- [ ] **Login** - all user types
- [ ] **Logout** - clean session clear
- [ ] **Password reset** - email flow

### 2. NDA/Legal Consent System
- [ ] New user sees NDA screen
- [ ] Cannot proceed without accepting
- [ ] Signature required and captured
- [ ] Consent recorded in database
- [ ] Does not appear again after acceptance
- [ ] Multiple documents work sequentially
- [ ] Admin can view consents

### 3. Dashboard Loading
- [ ] Musician dashboard loads with data
- [ ] Venue dashboard loads with data
- [ ] Fan dashboard loads with data
- [ ] No console errors
- [ ] Error boundary catches crashes

### 4. Search & Filtering
- [ ] Musicians can search venues
- [ ] Venues can search musicians
- [ ] Fans can browse all
- [ ] Genre filtering works
- [ ] Location filtering works
- [ ] Search by name works

### 5. Profile Management
- [ ] Can edit profile info
- [ ] Can upload profile picture
- [ ] Changes save correctly
- [ ] Changes persist after refresh

---

## ? DETAILED TEST SCENARIOS

### Musician Signup Test
```
1. Go to signup page
2. Select "Musician"
3. Enter: name, email, password
4. Select 2-3 genres
5. Submit
? Profile created
? Musician record created with genres
? Dashboard loads
? Can see venue listings
```

### Venue Signup Test
```
1. Go to signup page
2. Select "Venue"
3. Enter: name, email, password
4. Select 2-3 preferred genres
5. Submit
? Profile created
? Venue record created with genres
? Dashboard loads
? Can see musician listings
```

### Fan Signup Test
```
1. Go to signup page
2. Select "Fan"
3. Enter: name, email, password
4. Optionally select genres
5. Submit
? Profile created (no separate fan table)
? Dashboard loads
? Can browse musicians, venues, events
```

---

## ? KNOWN BUGS FIXED TODAY

1.  **Fan signup bug** - Was trying to insert into non-existent `fans` table
2.  **Musician ID lookup bug** - Was using wrong column name (`user_id` vs `id`)
3.  **TypeScript errors** - All 18 errors resolved

---

## ? BUG REPORTING

If you find a bug:

**Critical (Blocks usage):**
- Cannot signup/login
- Dashboard crashes
- Data loss
- Security issue

**High (Major feature broken):**
- Search doesn't work
- Profile can't be edited
- Images won't upload

**Medium (Annoying but workaround exists):**
- Slow performance
- UI glitch
- Minor display issue

**Low (Polish):**
- Typo
- Alignment off
- Nice-to-have feature

---

##  SUCCESS CRITERIA

**Day 2 is complete when:**
- [ ] Can signup as all 3 user types
- [ ] Can login and logout
- [ ] NDA system works end-to-end
- [ ] All dashboards load without errors
- [ ] Search/filter works
- [ ] Profile editing works
- [ ] No critical or high bugs found

---

##  TEST ACCOUNTS

Create these for testing:

**Musician:**
- `musician-test@gigmate.com` / `test1234`

**Venue:**
- `venue-test@gigmate.com` / `test1234`

**Fan:**
- `fan-test@gigmate.com` / `test1234`

---

##  NEXT STEPS (Day 3)

After Day 2 testing passes:
- Test subscription upgrades
- Test payment processing
- Test Stripe webhooks
- Deploy to production
- Run smoke tests on live site

---

## ? Estimated Testing Time

- Authentication: 30 min
- NDA System: 20 min
- Dashboards: 30 min
- Search/Filter: 20 min
- Profile Management: 20 min
- Bug fixes (if any): 1-2 hours

**Total: 2-3 hours**

---

## ? Getting Help

**If stuck:**
1. Check browser console for errors
2. Check Supabase logs
3. Review this checklist
4. Check deployment guide
5. Review NDA setup guide
