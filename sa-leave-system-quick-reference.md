# Quick Reference: SA Leave Management System
## Implementation Checklist

---

## 📋 Core SA Leave Types (BCEA-Compliant)

| Leave Type | Days | Cycle | Accrues? | Paid Out? | Key Rules |
|-----------|------|-------|----------|-----------|-----------|
| **Annual** | 21 consecutive (15 working) | 12 months | ✅ Monthly | ✅ Yes | Can carry over, NOT during notice |
| **Sick** | 30 working | 36 months | ❌ No | ❌ No | Medical cert 2+ days, resets after cycle |
| **Shared Parental** | 130 (4 mo + 10 days) | Per event | ❌ No | ❌ No | Split between parents, UIF claimable |
| **Family Responsibility** | 3 | 12 months | ❌ No | ❌ No | Strict reasons, 4+ months service required |

---

## 🇿🇦 2025 Public Holidays

✅ **12 Official Days:**
1. Jan 1 - New Year's Day
2. Mar 21 - Human Rights Day
3. Apr 18 - Good Friday
4. Apr 21 - Family Day
5. **Apr 27 - Freedom Day** (⚠️ Falls on Sunday, observed Monday Apr 28)
6. May 1 - Workers' Day
7. Jun 16 - Youth Day
8. Aug 9 - National Women's Day
9. Sep 24 - Heritage Day
10. Dec 16 - Day of Reconciliation
11. Dec 25 - Christmas Day
12. Dec 26 - Day of Goodwill

**Rule**: Sunday → Monday rollover

---

## ⚙️ Critical Implementation Requirements

### 1. Working Days Calculator
```typescript
// MUST exclude:
- Saturdays
- Sundays
- Public holidays (from DB)
- Company shutdown days

// Example: June 15-20, 2025
// Total: 6 days
// Less: 1 weekend = 4 days
// Less: 1 public holiday = 3 working days ✅
```

### 2. Annual Leave Accrual
```typescript
// Monthly accrual
Rate: 21 days ÷ 12 months = 1.75 days/month

// Example timeline:
Jan 15: Employment starts → 0 days
Feb 15: 1 month → 1.75 days accrued
Mar 15: 2 months → 3.5 days accrued
...
Jan 15 (next year): 12 months → 21 days accrued
```

### 3. Sick Leave Cycle (36 months)
```typescript
// Example:
Start: Jan 15, 2025
End: Jan 14, 2028 (36 months later)

Total: 30 days (for 5-day week)
Used: 6 days
Remaining: 24 days

// On Jan 15, 2028:
Reset to full 30 days (previous balance lost)
New cycle: Jan 15, 2028 - Jan 14, 2031
```

### 4. Family Responsibility Leave Eligibility
```typescript
// BOTH conditions required:
1. Employed for 4+ months ✅
2. Work 4+ days per week ✅

// Valid reasons ONLY:
- Child birth
- Child illness (not routine checkups!)
- Death of: spouse, life partner, parent, 
  grandparent, child, grandchild, sibling

// NOT valid:
- Death of in-laws, aunts, uncles, cousins
- Illness of spouse/partner
- School events
- Religious observances
```

---

## 🗄️ Database Essentials

### Key Tables
1. **profiles** - Employee info + work_days_per_week + employment_start_date
2. **leave_types** - Statutory + custom types with BCEA fields
3. **leaves** - Requests with SA-specific fields
4. **leave_balances** - Tracks cycles (12-month and 36-month)
5. **public_holidays** - All SA holidays with Sunday rollover

### Critical Fields
```sql
-- profiles
work_days_per_week INTEGER  -- for calculations
employment_start_date DATE   -- for cycles and eligibility

-- leave_types
is_statutory BOOLEAN
cycle_length_months INTEGER  -- 12 or 36
accrual_method TEXT         -- MONTHLY or ALLOCATED_AT_START
requires_service_months INT -- for FRL (4)
can_carry_over BOOLEAN
must_be_paid_out_on_termination BOOLEAN

-- leaves
working_days INTEGER        -- excludes weekends/holidays
is_partial_day BOOLEAN      -- for FRL half-days
family_responsibility_reason TEXT
requires_medical_cert BOOLEAN

-- leave_balances
cycle_start_date DATE
cycle_end_date DATE
accrued_days DECIMAL        -- for monthly accrual
carried_over_days DECIMAL   -- for annual leave
```

---

## 🎯 Validation Rules Checklist

### Annual Leave Request
- [ ] Check accrued balance (1.75 x months worked)
- [ ] Calculate working days (exclude weekends + holidays)
- [ ] Verify NOT during notice period
- [ ] Allow if balance sufficient
- [ ] Update balance on approval

### Sick Leave Request
- [ ] Check 36-month cycle balance (not calendar year!)
- [ ] Flag if 2+ consecutive days (medical cert required)
- [ ] For first 6 months: max 1 day per 26 worked
- [ ] Cannot carry over or pay out

### Family Responsibility Leave
- [ ] Verify 4+ months service
- [ ] Verify 4+ days/week employment
- [ ] Validate reason against approved list
- [ ] Allow partial days
- [ ] Max 3 days per year
- [ ] Request proof document

### Shared Parental Leave
- [ ] Max 130 days per event
- [ ] Can split between parents
- [ ] Track total allocation
- [ ] Show UIF eligibility info
- [ ] 1 month advance notice (if possible)

---

## 🔄 Automated Jobs Required

### Monthly Accrual Job (Run 1st of month)
```typescript
// For each employee:
1. Calculate months since employment start
2. Accrue 1.75 annual leave days
3. Update leave_balances
4. Log in accrual_history
5. Check for cycle end → rollover
```

### Sick Leave Cycle Reset (Run daily)
```typescript
// Check all employees:
1. If cycle_end_date === today
2. Reset sick leave to 30 days
3. Update cycle dates (new 36-month period)
4. Log reset in history
```

### Annual Leave Reminder (Run weekly)
```typescript
// Find employees where:
1. Cycle ended 6+ months ago
2. Annual leave not fully taken
3. Send reminder to take leave
4. Alert HR/manager
```

---

## 📊 Reports Required

### For Employees
- Current leave balances (all types)
- Accrual rate and next accrual date
- Cycle dates and remaining time
- Leave history
- Upcoming public holidays

### For Managers
- Team leave calendar
- Pending approvals
- Team availability forecast
- Overlapping leave warnings

### For HR/Admin
- Compliance dashboard:
  - Medical certs missing
  - Leave not taken (6+ months)
  - Sick leave cycles ending soon
  - Negative balances (advanced leave)
- Annual audit reports:
  - Leave taken vs accrued per employee
  - Leave payout calculations
  - Statutory compliance status

---

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T:
1. Calculate sick leave by calendar year (use 36-month cycles!)
2. Allow FRL for non-qualifying reasons (strict list only)
3. Count public holidays toward annual leave
4. Let employees take annual leave during notice period
5. Use total days instead of working days
6. Forget Sunday → Monday public holiday rollover
7. Allow sick leave without medical cert (2+ days)
8. Pay out sick leave on termination
9. Let sick leave accumulate beyond 36 months
10. Ignore 4-month/4-day eligibility for FRL

### ✅ DO:
1. Track separate 36-month cycles for sick leave
2. Calculate working days (exclude weekends + holidays)
3. Accrue annual leave monthly (1.75 days)
4. Enforce eligibility checks
5. Require medical certificates
6. Pay out annual leave on termination
7. Allow annual leave carry-over
8. Reset sick leave after 36 months
9. Validate FRL reasons strictly
10. Track all cycles separately per employee

---

## 🎨 UI/UX Best Practices

### Leave Balance Display
```
┌─────────────────────────────────┐
│ 📅 Annual Leave                 │
│ Cycle: 15 Jan 2025 - 14 Jan 2026│
├─────────────────────────────────┤
│ ████████░░░░░░░░░ 8.75 / 21    │
│                                 │
│ Accrued:     8.75 days         │
│ Used:        3.00 days         │
│ Pending:     0.00 days         │
│ ───────────────────────────────  │
│ Available:   5.75 days         │
│                                 │
│ Next accrual: 1 Dec (1.75 days)│
└─────────────────────────────────┘
```

### Helpful Messages
- ✅ "You have accrued 8.75 of 21 days this cycle"
- ✅ "Medical certificate required for 2+ consecutive sick days"
- ✅ "Freedom Day falls on Sunday, Monday 28th is a public holiday"
- ✅ "Your sick leave resets on 15 January 2028"
- ✅ "This request uses 4 working days (excludes 1 weekend, 1 holiday)"
- ⚠️ "You're not eligible for FRL (need 4+ months service)"
- ⚠️ "Annual leave cannot be taken during notice period"
- ❌ "Insufficient balance: You have 5 days, requesting 7 days"

---

## 🔐 Security & Permissions

### Role-Based Access
```typescript
// Employee
- View own leave balances
- Request leave
- View own history
- View team calendar (read-only)

// Manager
- All employee permissions +
- Approve/reject team leave
- View team reports
- Override conflicts

// HR/Admin
- All manager permissions +
- View all employee balances
- Manual adjustments
- Configure leave types
- Manage public holidays
- Generate compliance reports
- Access audit trails
```

---

## 📚 Key Resources

### Legal References
- Basic Conditions of Employment Act 75 of 1997
- Public Holidays Act 36 of 1994
- Constitutional Court Ruling (Oct 3, 2025) - Shared Parental Leave
- Department of Employment and Labour: www.labour.gov.za

### Support Documents
1. `cursor-system-prompt-sa-compliant.md` - Full system prompt
2. `sa-labour-law-requirements.md` - Detailed legal requirements
3. Database migration SQL files
4. Type definitions (bcea.types.ts)

---

## ✅ Pre-Launch Checklist

### Database
- [ ] All tables created with correct schema
- [ ] RLS policies enabled and tested
- [ ] Leave types seeded (4 statutory + optional)
- [ ] 2025 public holidays seeded
- [ ] Indexes created for performance

### Core Features
- [ ] User registration with employment details
- [ ] Leave request form (all 4 types)
- [ ] Working days calculator tested
- [ ] Leave balance calculations accurate
- [ ] Approval workflow functional
- [ ] Team calendar displays correctly

### Compliance
- [ ] Annual leave accrues monthly (1.75/month)
- [ ] Sick leave uses 36-month cycles
- [ ] FRL eligibility enforced
- [ ] Public holiday rollover logic working
- [ ] Medical certificate tracking
- [ ] Leave payout calculation correct

### Automation
- [ ] Monthly accrual job configured
- [ ] Sick leave reset job configured
- [ ] Email notifications (optional)
- [ ] Cron jobs scheduled in Vercel

### Testing
- [ ] Unit tests for calculations
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths
- [ ] Load testing for performance
- [ ] Security audit completed

### Documentation
- [ ] User guide created
- [ ] Admin manual written
- [ ] API documentation
- [ ] Troubleshooting guide
- [ ] Legal disclaimer included

### Deployment
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL enabled
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Error tracking (Sentry)

---

## 🚀 Go-Live Steps

1. **Final Testing**: Run full test suite in staging
2. **Data Migration**: Import existing employees and balances
3. **User Training**: Train HR and managers
4. **Soft Launch**: Deploy to subset of users
5. **Monitor**: Watch for issues first week
6. **Full Launch**: Enable for all users
7. **Support**: Provide help desk for questions

---

## 📞 Getting Help

If you encounter issues:

1. Check logs in Vercel dashboard
2. Review Supabase database logs
3. Verify RLS policies
4. Test calculations manually
5. Consult Labour Guide SA: labourguide.co.za
6. Contact labour law practitioner for legal questions

---

**Remember**: This system handles critical employee data and legal compliance. Always test thoroughly and consult with legal professionals when in doubt.

**Last Updated**: November 2025
**Review Annually**: To catch legislative changes
