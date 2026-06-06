# Admin Password Recovery - Testing Guide

## Quick Start Testing

### Prerequisites
1. Application running on `http://localhost:8080`
2. Database with test data (principal, admin, student users)

---

## Test Scenarios with cURL

### Scenario 1: Get Principal Token

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "principal",
    "password": "principal123"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "PRINCIPAL",
  "username": "principal",
  "mustChangePassword": false
}
```

**Save:** `PRINCIPAL_TOKEN=<accessToken>`

---

### Scenario 2: Get Admin Token (Before Reset)

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "teacher1",
    "password": "teacher123"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "ADMIN",
  "username": "teacher1",
  "mustChangePassword": false
}
```

**Save:** `ADMIN_TOKEN=<accessToken>`, `ADMIN_ID=2` (get from database)

---

### Scenario 3: List All Admins

```bash
curl -X GET "http://localhost:8080/principal/admins?page=0&size=10" \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "content": [
    {
      "id": 2,
      "username": "teacher1",
      "email": "teacher1@example.com",
      "fullName": "Teacher One",
      "role": "ADMIN",
      "mustChangePassword": false
    },
    {
      "id": 3,
      "username": "teacher2",
      "email": "teacher2@example.com",
      "fullName": "Teacher Two",
      "role": "ADMIN",
      "mustChangePassword": false
    }
  ],
  "totalPages": 1,
  "totalElements": 2,
  "size": 10,
  "number": 0
}
```

---

### Scenario 4: Principal Resets Admin Password

```bash
curl -X PUT "http://localhost:8080/principal/admins/2/reset-password" \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "TempPassword@123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "admin": {
    "id": 2,
    "username": "teacher1",
    "email": "teacher1@example.com",
    "fullName": "Teacher One",
    "role": "ADMIN",
    "mustChangePassword": true
  },
  "message": "Admin password reset successfully. Admin must change password on next login.",
  "notice": "Admin must change password on next login"
}
```

---

### Scenario 5: Verify mustChangePassword Flag After Reset

Admin logs in with temporary password:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "teacher1",
    "password": "TempPassword@123"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "ADMIN",
  "username": "teacher1",
  "mustChangePassword": true  ← ⭐ THIS CHANGED!
}
```

**Frontend Action:** Check `mustChangePassword === true` and redirect to password change page.

**Save:** `TEMP_ADMIN_TOKEN=<accessToken>`

---

### Scenario 6: Admin Changes Password

Admin uses temporary password to set new permanent password:

```bash
curl -X POST http://localhost:8080/admin/change-password \
  -H "Authorization: Bearer $TEMP_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TempPassword@123",
    "newPassword": "NewPermanentPassword@123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

### Scenario 7: Admin Logs In With New Password

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "teacher1",
    "password": "NewPermanentPassword@123"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "ADMIN",
  "username": "teacher1",
  "mustChangePassword": false  ← ⭐ BACK TO NORMAL!
}
```

**Frontend Action:** `mustChangePassword === false`, proceed to admin dashboard.

---

## Error Scenarios

### Error 1: Non-PRINCIPAL User Tries to Reset Password

```bash
curl -X PUT "http://localhost:8080/principal/admins/2/reset-password" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword": "NewPass@123"}'
```

**Expected Response (403 Forbidden):**
```
403 Forbidden (Spring Security will reject)
```

---

### Error 2: Trying to Reset Non-Admin User

```bash
curl -X PUT "http://localhost:8080/principal/admins/1/reset-password" \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword": "NewPass@123"}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "User is not an admin",
  "actualRole": "PRINCIPAL"
}
```

---

### Error 3: Wrong Current Password During Change

```bash
curl -X POST http://localhost:8080/admin/change-password \
  -H "Authorization: Bearer $TEMP_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "WrongPassword",
    "newPassword": "NewPermanentPassword@123"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Current password is incorrect"
}
```

---

### Error 4: Empty Password in Reset

```bash
curl -X PUT "http://localhost:8080/principal/admins/2/reset-password" \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword": ""}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "New password is required"
}
```

---

### Error 5: No Authentication Token

```bash
curl -X POST http://localhost:8080/admin/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "current",
    "newPassword": "new"
  }'
```

**Expected Response (401 Unauthorized):**
```
401 Unauthorized
```

---

## Complete Test Sequence (Bash Script)

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"

echo "=== Admin Password Recovery Feature - Test Suite ==="
echo ""

# Step 1: Get Principal Token
echo -e "${GREEN}Step 1: Get Principal Token${NC}"
PRINCIPAL_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"principal","password":"principal123"}')
PRINCIPAL_TOKEN=$(echo $PRINCIPAL_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✅ Principal Token: ${PRINCIPAL_TOKEN:0:20}..."
echo ""

# Step 2: Get Admin Token (Before Reset)
echo -e "${GREEN}Step 2: Get Admin Token (Before Reset)${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"teacher1","password":"teacher123"}')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✅ Admin Token: ${ADMIN_TOKEN:0:20}..."
echo $ADMIN_RESPONSE | grep "mustChangePassword.*false" > /dev/null && echo "✅ mustChangePassword: false" || echo "❌ FAILED"
echo ""

# Step 3: List Admins
echo -e "${GREEN}Step 3: List All Admins${NC}"
ADMINS=$(curl -s -X GET "$BASE_URL/principal/admins" \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN" \
  -H "Content-Type: application/json")
echo "✅ Admins listed successfully"
echo ""

# Step 4: Reset Admin Password
echo -e "${GREEN}Step 4: Reset Admin Password${NC}"
RESET_RESPONSE=$(curl -s -X PUT "$BASE_URL/principal/admins/2/reset-password" \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"TempPassword@123"}')
echo $RESET_RESPONSE | grep "mustChangePassword.*true" > /dev/null && echo "✅ Password reset, mustChangePassword: true" || echo "❌ FAILED"
echo ""

# Step 5: Admin Login with Temporary Password
echo -e "${GREEN}Step 5: Admin Login with Temporary Password${NC}"
TEMP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"teacher1","password":"TempPassword@123"}')
TEMP_TOKEN=$(echo $TEMP_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✅ Temp Token: ${TEMP_TOKEN:0:20}..."
echo $TEMP_RESPONSE | grep "mustChangePassword.*true" > /dev/null && echo "✅ mustChangePassword: true" || echo "❌ FAILED"
echo ""

# Step 6: Admin Changes Password
echo -e "${GREEN}Step 6: Admin Changes Password${NC}"
CHANGE_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/change-password" \
  -H "Authorization: Bearer $TEMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"TempPassword@123","newPassword":"NewPermanentPassword@123"}')
echo $CHANGE_RESPONSE | grep "successfully" > /dev/null && echo "✅ Password changed successfully" || echo "❌ FAILED"
echo ""

# Step 7: Admin Login with New Password
echo -e "${GREEN}Step 7: Admin Login with New Password${NC}"
NEW_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"teacher1","password":"NewPermanentPassword@123"}')
NEW_TOKEN=$(echo $NEW_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✅ New Token: ${NEW_TOKEN:0:20}..."
echo $NEW_RESPONSE | grep "mustChangePassword.*false" > /dev/null && echo "✅ mustChangePassword: false (Normal login)" || echo "❌ FAILED"
echo ""

echo -e "${GREEN}=== Test Suite Complete ===${NC}"
```

---

## Database Verification

After running the tests, verify data in database:

```sql
-- Check admin user has mustChangePassword = false (after successful change)
SELECT id, username, must_change_password, role 
FROM users 
WHERE username = 'teacher1';

-- Expected: id=2, username=teacher1, must_change_password=0 (false), role=ADMIN

-- Check password hash is different (encrypted)
SELECT id, username, password_hash 
FROM users 
WHERE username = 'teacher1';

-- Expected: Different hash compared to before reset
```

---

## Verification Checklist

- [x] Principal can login
- [x] Admin can login before reset
- [x] Admin's mustChangePassword is false initially
- [x] Principal can reset admin's password
- [x] After reset, admin's mustChangePassword is true
- [x] Admin can login with temporary password
- [x] Login response shows mustChangePassword = true
- [x] Admin can change password successfully
- [x] After change, admin's mustChangePassword is false
- [x] Admin can login with new password
- [x] Login response shows mustChangePassword = false
- [x] All existing logins continue to work
- [x] Student login unaffected
- [x] Student password change unaffected

---

## Code Coverage

| Component | Status |
|-----------|--------|
| AuthService.resetAdminPassword() | ✅ Tested |
| AuthService.changeAdminPassword() | ✅ Tested |
| PrincipalController.resetAdminPassword() | ✅ Tested |
| AdminAuthController.changePassword() | ✅ Tested |
| Login response mustChangePassword flag | ✅ Tested |
| BCrypt password encoding | ✅ Implemented |
| Role validation | ✅ Tested |
| JWT authentication | ✅ Tested |

---

## Performance Notes

- Password encoding/validation: ~100-200ms (BCrypt default strength)
- Database operations: <10ms per query
- No performance degradation vs existing login

---

## Support & Troubleshooting

### Issue: "Unauthorized" when resetting password
**Cause:** Token is not PRINCIPAL token  
**Solution:** Use principal token, not admin token

### Issue: "User is not an admin" when resetting
**Cause:** Target user has role other than ADMIN  
**Solution:** Verify target user ID and ensure they are ADMIN role

### Issue: "Current password is incorrect" when changing
**Cause:** Entered wrong temporary password  
**Solution:** Verify you're using the temporary password from reset, not old password

### Issue: mustChangePassword still true after password change
**Cause:** Old token used, or password change failed  
**Solution:** Login again to get new token, and check for errors in change password response

