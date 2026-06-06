# Admin Password Recovery Feature

## Overview
This document outlines the "Forgot Password Recovery" feature for Admin accounts, implemented to allow PRINCIPAL users to reset ADMIN passwords and force admin password changes on next login.

## Architecture & Implementation

### 1. Database Changes
**No migration required** - Existing `users` table already has:
- `password_hash` (VARCHAR 255) - BCrypt-encoded password
- `must_change_password` (BOOLEAN) - Flag for forced password change

### 2. Backend Implementation

#### 2.1 AuthService Updates (`src/main/java/com/example/demo/service/AuthService.java`)

**New Methods:**
- `resetAdminPassword(Long adminId, String newPassword)`: Called by PRINCIPAL to reset admin password
  - Verifies target user is ADMIN role
  - Encodes password with BCryptPasswordEncoder
  - Sets `mustChangePassword = true`
  - Returns success response

- `changeAdminPassword(String adminUsername, String currentPassword, String newPassword)`: Called by admin to change password
  - Verifies current password matches hash
  - Encodes new password with BCryptPasswordEncoder
  - Sets `mustChangePassword = false`
  - Returns success response

**Updated Login Methods:**
- `adminLogin()`: Now returns `mustChangePassword` flag in LoginResponse
- `unifiedLogin()`: Returns `mustChangePassword` for admin/principal logins

#### 2.2 PrincipalController Updates (`src/main/java/com/example/demo/controller/PrincipalController.java`)

**New Endpoint:**
```
PUT /principal/admins/{adminId}/reset-password
Authorization: Bearer <principal-token>

Request Body:
{
  "newPassword": "Admin@123"
}

Response:
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

**Existing Endpoint Enhanced:**
```
GET /principal/admins
Authorization: Bearer <principal-token>
- Lists all admin accounts (unchanged)
```

#### 2.3 AdminAuthController (`src/main/java/com/example/demo/controller/AdminAuthController.java`)

**New Endpoint:**
```
POST /admin/change-password
Authorization: Bearer <admin-token>

Request Body:
{
  "currentPassword": "temporaryPassword",
  "newPassword": "NewPassword@123"
}

Response:
{
  "message": "Password changed successfully"
}
```

## Complete Flow

### Scenario 1: Principal Resets Admin Password

**Step 1:** Principal logs in
```bash
POST /auth/login
{
  "identifier": "principal",
  "password": "principal123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "role": "PRINCIPAL",
  "username": "principal",
  "mustChangePassword": false
}
```

**Step 2:** Principal resets admin password
```bash
PUT /principal/admins/2/reset-password
Authorization: Bearer <principal-token>
{
  "newPassword": "TempPass@123"
}

Response:
{
  "admin": {
    "id": 2,
    "username": "teacher1",
    "mustChangePassword": true  // ← Force change on login
  },
  "message": "Admin password reset successfully. Admin must change password on next login.",
  "notice": "Admin must change password on next login"
}
```

### Scenario 2: Admin Logs In After Password Reset

**Step 1:** Admin logs in with temporary password
```bash
POST /auth/login
{
  "identifier": "teacher1",
  "password": "TempPass@123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "role": "ADMIN",
  "username": "teacher1",
  "mustChangePassword": true  // ← Frontend detects this!
}
```

**Frontend Behavior:**
- Check `mustChangePassword` flag in login response
- If `true`, redirect to `/admin/change-password` page
- Do NOT proceed to admin dashboard

### Scenario 3: Admin Changes Password

**Step 1:** Admin submits new password
```bash
POST /admin/change-password
Authorization: Bearer <admin-token>
{
  "currentPassword": "TempPass@123",
  "newPassword": "NewPermanentPass@123"
}

Response:
{
  "message": "Password changed successfully"
}
```

**Backend Actions:**
- Verify current password (temporary)
- Encode new password with BCrypt
- Update `password_hash` in database
- Set `mustChangePassword = false`

**Frontend Behavior:**
- Show success message
- Redirect to admin dashboard
- User is now fully logged in

### Scenario 4: Admin Logs In Again With New Password

**Step 1:** Admin logs in with new permanent password
```bash
POST /auth/login
{
  "identifier": "teacher1",
  "password": "NewPermanentPass@123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "role": "ADMIN",
  "username": "teacher1",
  "mustChangePassword": false  // ← Normal login, no forced change
}
```

**Frontend Behavior:**
- `mustChangePassword` is `false`
- Proceed directly to admin dashboard

## Security Measures

1. **Role-Based Access Control:**
   - Only PRINCIPAL users can call reset password endpoint
   - Verified through Spring Security annotations and controller logic

2. **Password Encoding:**
   - All passwords encoded with BCryptPasswordEncoder
   - No plaintext passwords stored or transmitted

3. **Target Validation:**
   - Verify target user is ADMIN role before reset
   - Prevent non-admin password resets

4. **Authentication Required:**
   - All endpoints require valid JWT token
   - Stateless authentication (no sessions)

## Verification Checklist

### 1. Login Tests
- [ ] Principal can login with principal credentials
- [ ] Admin can login with admin credentials
- [ ] Student can login with student credentials
- [ ] Login response includes `mustChangePassword` flag
- [ ] Invalid credentials are rejected

### 2. Password Reset Tests
- [ ] Principal can reset admin password
- [ ] After reset, admin's `mustChangePassword` is `true`
- [ ] Reset endpoint verifies PRINCIPAL role
- [ ] Reset endpoint verifies target is ADMIN role
- [ ] Non-principal users cannot reset passwords

### 3. Password Change Tests
- [ ] Admin can change password with current + new password
- [ ] After change, admin's `mustChangePassword` is `false`
- [ ] Invalid current password is rejected
- [ ] Changed password works for next login
- [ ] Only authenticated admins can call endpoint

### 4. Login Flow Integration Tests
- [ ] After password reset, admin logs in with temporary password
- [ ] Login response has `mustChangePassword: true`
- [ ] Admin can change password successfully
- [ ] After change, admin logs in with new password
- [ ] Login response has `mustChangePassword: false`
- [ ] All subsequent logins work normally

### 5. Existing Functionality Tests
- [ ] Principal login still works
- [ ] Admin login still works
- [ ] Student login still works
- [ ] Student password change still works
- [ ] No existing user passwords are overwritten
- [ ] All existing endpoints continue to work

## Database Considerations

### Schema
No migration required. Existing table has all needed fields:
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- BCrypt hash
  role ENUM('PRINCIPAL','ADMIN','STUDENT') DEFAULT 'ADMIN',
  must_change_password BOOLEAN DEFAULT true,  -- Force change flag
  full_name VARCHAR(255),
  email VARCHAR(255),
  profile_image_url VARCHAR(255)
);
```

### Queries Used
- `UserRepository.findById(adminId)` - Get admin by ID
- `UserRepository.findByUsername(username)` - Get admin by username
- `userRepository.findByRole(Role.ADMIN, pageable)` - List all admins (existing)

## Frontend Implementation Guide

### 1. After Login
```javascript
// Login response
{
  "accessToken": "...",
  "refreshToken": "...",
  "role": "ADMIN",
  "username": "teacher1",
  "mustChangePassword": true  // Check this!
}

// Frontend logic
if (loginResponse.mustChangePassword) {
  // Redirect to forced password change page
  navigate('/admin/change-password');
} else {
  // Redirect to dashboard
  navigate('/admin/dashboard');
}
```

### 2. Change Password Form
```javascript
POST /admin/change-password
Headers: {
  "Authorization": "Bearer " + accessToken
}
Body: {
  "currentPassword": "...",
  "newPassword": "..."
}
```

### 3. Principal Reset Password Interface
```javascript
// Show admin list (existing GET /principal/admins)
// For each admin, show "Reset Password" button

PUT /principal/admins/{adminId}/reset-password
Headers: {
  "Authorization": "Bearer " + principalToken
}
Body: {
  "newPassword": "Admin@123"
}
```

## Error Scenarios & Handling

| Scenario | Endpoint | Status | Response |
|----------|----------|--------|----------|
| Admin not found | `PUT /principal/admins/{id}/reset-password` | 404 | `{"error": "Admin not found"}` |
| Target is not ADMIN | `PUT /principal/admins/{id}/reset-password` | 400 | `{"error": "User is not an admin", "actualRole": "..."}` |
| Empty password | `PUT /principal/admins/{id}/reset-password` | 400 | `{"error": "New password is required"}` |
| Wrong current password | `POST /admin/change-password` | 400 | `{"error": "Current password is incorrect"}` |
| Admin not found | `POST /admin/change-password` | 400 | `{"error": "Admin not found"}` |
| No auth token | Any endpoint | 401 | `401 Unauthorized` |
| Wrong role | Any endpoint | 403 | `403 Forbidden` |

## Testing Commands

### 1. Get Principal Token
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"principal","password":"principal123"}'
```

### 2. Get Admin Token
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"teacher1","password":"teacher123"}'
```

### 3. List Admins
```bash
curl -X GET http://localhost:8080/principal/admins \
  -H "Authorization: Bearer <principal-token>"
```

### 4. Reset Admin Password
```bash
curl -X PUT http://localhost:8080/principal/admins/2/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <principal-token>" \
  -d '{"newPassword":"NewPassword@123"}'
```

### 5. Change Admin Password
```bash
curl -X POST http://localhost:8080/admin/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"currentPassword":"OldPassword","newPassword":"NewPassword@123"}'
```

## Deployment Considerations

1. **No Database Migration Needed:**
   - Table already has `must_change_password` column
   - Existing data is compatible

2. **No Configuration Changes:**
   - Uses existing SecurityConfig
   - Uses existing PasswordEncoder (BCrypt)
   - Uses existing JWT setup

3. **Backward Compatibility:**
   - Existing login flows unchanged
   - Existing endpoints unchanged
   - Existing password fields untouched
   - Only new endpoints added

4. **Zero Downtime:**
   - Can be deployed without restart of dependent services
   - New endpoints are isolated
   - No existing data modifications during deployment

## Summary

The Admin Password Recovery feature is a secure, role-based system that allows:
- PRINCIPAL users to reset ADMIN passwords
- ADMIN users to change passwords after forced change
- Proper authentication and authorization at each step
- Full audit trail through logging
- Backward compatibility with existing system

Implementation uses:
- BCryptPasswordEncoder for password security
- JWT for stateless authentication
- Spring Security for role-based access control
- Database's existing `must_change_password` flag
- Clear separation of concerns (AuthService, Controllers, Repositories)
