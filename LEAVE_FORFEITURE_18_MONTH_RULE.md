

# 18-Month Leave Forfeiture Rule - Implementation

## Legal Basis

**Source**: Basic Conditions of Employment Act (BCEA) + Ludick v Rural Maintenance case law

**Rule**: Unused annual leave must be used within **18 months** or it will be **forfeited**.

### Timeline Breakdown:
- **12 months**: Annual leave cycle (Jan 1 - Dec 31)
- **+ 6 months**: Carry-over period (Jan 1 - Jun 30 of following year)
- **= 18 months total**: Maximum time to use leave before forfeiture

### Example:
```
2023 Leave Cycle:
├─ Jan 1, 2023: Cycle starts
├─ Dec 31, 2023: Cycle ends (12 months)
├─ Jun 30, 2024: Forfeiture deadline (+ 6 months)
└─ Jul 1, 2024: Unused leave is FORFEITED
```

## Current Status (November 2025)

### Elma van Aswegen - Leave Subject to Forfeiture

| Year | Remaining Days | Forfeiture Due Date | Status | Days to Forfeit |
|------|----------------|---------------------|--------|-----------------|
| 2017 | 11 | June 30, 2018 | **OVERDUE** | 11 days |
| 2018 | 17 | June 30, 2019 | **OVERDUE** | 17 days |
| 2019 | 8 | June 30, 2020 | **OVERDUE** | 8 days |
| 2020 | 12 | June 30, 2021 | **OVERDUE** | 12 days |
| 2021 | 13 | June 30, 2022 | **OVERDUE** | 13 days |
| 2022 | 15 | June 30, 2023 | **OVERDUE** | 15 days |
| 2023 | 15 | June 30, 2024 | **OVERDUE** | 15 days |
| 2024 | 2 | June 30, 2025 | **OVERDUE** | 2 days |
| **Total** | **93** | - | - | **93 days** |

**2025**: 5 days (Safe until June 30, 2026)  
**2026**: 20 days (Safe until June 30, 2027)

### Test User - Leave Subject to Forfeiture

| Year | Remaining Days | Forfeiture Due Date | Status | Days to Forfeit |
|------|----------------|---------------------|--------|-----------------|
| 2024 | 21 | June 30, 2025 | **OVERDUE** | 21 days |

## How the System Works

### 1. Automatic Calculation

**Function**: `calculate_leave_subject_to_forfeiture(user_id)`

Returns:
- Which years have leave subject to forfeiture
- How many days per year
- Forfeiture due date
- Reason for forfeiture

```sql
-- Example usage
SELECT * FROM calculate_leave_subject_to_forfeiture(
  (SELECT id FROM profiles WHERE email = 'user@example.com')
);
```

### 2. Preview Forfeiture

**Function**: `process_leave_forfeiture(user_id, false)`

When called with `false`, it:
- Shows what WOULD be forfeited
- Does NOT actually forfeit
- Marks user as requiring acknowledgment
- Sets `forfeiture_acknowledgment_required = true`

```sql
-- Preview what would be forfeited
SELECT * FROM process_leave_forfeiture(
  (SELECT id FROM profiles WHERE email = 'elma@adminfocus.co.za'),
  false  -- Preview mode
);
```

**Result**:
```
| year | days_forfeited | reason                                     | requires_acknowledgment |
|------|----------------|--------------------------------------------|-------------------------|
| 2017 | 11             | Leave from 2017 cycle exceeded 18-month... | true                    |
| 2018 | 17             | Leave from 2018 cycle exceeded 18-month... | true                    |
| ...  | ...            | ...                                        | true                    |
```

### 3. Process Forfeiture (With Acknowledgment)

**Function**: `process_leave_forfeiture(user_id, true)`

When called with `true`, it:
- **ACTUALLY forfeits** the leave
- Updates `remaining_days` (reduces balance)
- Tracks `forfeited_days` (audit trail)
- Records `last_forfeiture_acknowledgment_date`
- Sets `forfeiture_acknowledgment_required = false`

```sql
-- Actually process forfeiture (user has acknowledged)
SELECT * FROM process_leave_forfeiture(
  (SELECT id FROM profiles WHERE email = 'elma@adminfocus.co.za'),
  true  -- CONFIRMED: Process forfeiture
);
```

## UI Implementation Requirements

### User Profile Page

**Add Section**: "Leave Forfeiture Acknowledgment"

```typescript
// Component structure
<Card>
  <CardHeader>
    <CardTitle>⚠️ Leave Forfeiture Required</CardTitle>
    <CardDescription>
      You have {totalDaysToForfeit} days of annual leave that has exceeded 
      the 18-month legal limit and must be forfeited.
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>
          <TableHead>Days to Forfeit</TableHead>
          <TableHead>Forfeiture Due Date</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {forfeiturePreview.map((item) => (
          <TableRow key={item.year}>
            <TableCell>{item.year}</TableCell>
            <TableCell className="font-bold text-red-600">
              {item.days_forfeited} days
            </TableCell>
            <TableCell>{item.forfeiture_due_date}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {item.reason}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Legal Requirement</AlertTitle>
      <AlertDescription>
        Under the Basic Conditions of Employment Act (BCEA) and case law 
        (Ludick v Rural Maintenance), unused annual leave older than 18 months 
        is automatically forfeited. This is required by South African labour law.
      </AlertDescription>
    </Alert>
    
    <div className="mt-6 space-y-4">
      <Checkbox 
        id="acknowledge-forfeiture"
        checked={acknowledgedForfeiture}
        onCheckedChange={setAcknowledgedForfeiture}
      />
      <Label htmlFor="acknowledge-forfeiture" className="ml-2">
        I understand and acknowledge that {totalDaysToForfeit} days of my 
        annual leave will be forfeited as per SA labour law requirements.
      </Label>
      
      <Button 
        variant="destructive"
        disabled={!acknowledgedForfeiture}
        onClick={processForfeiture}
      >
        Process Forfeiture
      </Button>
    </div>
  </CardContent>
</Card>
```

### Service Function

```typescript
// lib/services/leaveService.ts

export const leaveService = {
  /**
   * Get leave forfeiture preview for user
   */
  async getForfeiturePreview(userId: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('process_leave_forfeiture', {
      p_user_id: userId,
      p_acknowledgment_confirmed: false  // Preview mode
    });
    
    if (error) throw new Error(error.message);
    return data;
  },
  
  /**
   * Process forfeiture after user acknowledgment
   */
  async processForfeiture(userId: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('process_leave_forfeiture', {
      p_user_id: userId,
      p_acknowledgment_confirmed: true  // CONFIRMED: Process
    });
    
    if (error) throw new Error(error.message);
    return data;
  },
  
  /**
   * Check if user has pending forfeiture
   */
  async checkPendingForfeiture(userId: string) {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('profiles')
      .select('forfeiture_acknowledgment_required')
      .eq('id', userId)
      .single();
    
    return data?.forfeiture_acknowledgment_required || false;
  }
};
```

### Dashboard Warning Banner

```typescript
// Show banner if forfeiture required
{profile.forfeiture_acknowledgment_required && (
  <Alert variant="warning" className="mb-6">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Action Required: Leave Forfeiture</AlertTitle>
    <AlertDescription>
      You have unused annual leave that must be forfeited under SA law.
      <Link href="/my-profile#forfeiture" className="ml-2 underline">
        Review and acknowledge
      </Link>
    </AlertDescription>
  </Alert>
)}
```

## Admin Dashboard

### View All Employees with Pending Forfeiture

```sql
-- Check all employees with forfeiture
SELECT * FROM employees_with_pending_forfeiture;
```

**Admin UI Table**:
```typescript
<Table>
  <TableCaption>Employees with Leave Subject to Forfeiture</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Employee</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Years Affected</TableHead>
      <TableHead>Total Days</TableHead>
      <TableHead>Acknowledgment Required</TableHead>
      <TableHead>Last Processed</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {employeesWithForfeiture.map((emp) => (
      <TableRow key={emp.user_id}>
        <TableCell>{emp.full_name}</TableCell>
        <TableCell>{emp.email}</TableCell>
        <TableCell>{emp.years_count}</TableCell>
        <TableCell className="font-bold text-red-600">
          {emp.total_days_to_forfeit}
        </TableCell>
        <TableCell>
          {emp.forfeiture_acknowledgment_required ? (
            <Badge variant="destructive">Required</Badge>
          ) : (
            <Badge variant="outline">N/A</Badge>
          )}
        </TableCell>
        <TableCell>
          {emp.last_leave_forfeiture_date || 'Never'}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Testing

### 1. Preview Forfeiture (Safe - No Changes)

```sql
-- Check what would be forfeited for Elma
SELECT * FROM process_leave_forfeiture(
  (SELECT id FROM profiles WHERE email = 'elma@adminfocus.co.za'),
  false
);
```

**Expected**: Returns 8 rows showing 93 total days to forfeit

### 2. Process Forfeiture (LIVE - Makes Changes)

```sql
-- CAUTION: This will actually forfeit leave!
SELECT * FROM process_leave_forfeiture(
  (SELECT id FROM profiles WHERE email = 'elma@adminfocus.co.za'),
  true
);
```

**Expected**: 
- Forfeits 93 days
- Updates remaining_days in leave_balances
- Records forfeited_days for audit
- Sets last_forfeiture_date in profile

### 3. Verify After Forfeiture

```sql
-- Check Elma's balances after forfeiture
SELECT 
  year,
  total_days,
  used_days,
  remaining_days,
  forfeited_days,
  last_forfeiture_acknowledgment_date
FROM leave_balances lb
JOIN profiles p ON lb.user_id = p.id
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE p.email = 'elma@adminfocus.co.za'
  AND lt.name = 'Annual Leave'
ORDER BY year;
```

## Database Schema

### leave_balances (New Columns)

```sql
- carried_over_from_previous_year NUMERIC DEFAULT 0
- forfeiture_due_date DATE (calculated as cycle_end_date + 6 months)
- last_forfeiture_acknowledgment_date TIMESTAMPTZ
- forfeited_days NUMERIC DEFAULT 0 (audit trail)
```

### profiles (New Columns)

```sql
- last_leave_forfeiture_date TIMESTAMPTZ
- forfeiture_acknowledgment_required BOOLEAN DEFAULT false
```

## Compliance Checklist

- ✅ **18-Month Rule**: Enforced (12-month cycle + 6-month carry-over)
- ✅ **Automatic Calculation**: Identifies leave older than 18 months
- ✅ **User Acknowledgment**: Required before forfeiture
- ✅ **Audit Trail**: Tracks forfeited amounts and dates
- ✅ **Legal Basis**: Based on BCEA + Ludick v Rural Maintenance
- ✅ **Payout on Termination**: Separate feature (forfeited leave not paid out)

## Next Steps

1. ✅ Database migration applied
2. ✅ Functions tested and working
3. ⏰ Create UI component for user acknowledgment
4. ⏰ Add forfeiture banner to dashboard
5. ⏰ Create admin report for pending forfeitures
6. ⏰ Add automated email notifications (7 days before forfeiture)
7. ⏰ Document in user manual

---

**Status**: ✅ Database Ready - UI Pending  
**Legal Compliance**: ✅ BCEA + Case Law  
**Last Updated**: November 11, 2025

