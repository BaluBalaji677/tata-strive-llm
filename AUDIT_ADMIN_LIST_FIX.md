# Admin List Issue - Audit & Fix Report
**Date:** June 3, 2026  
**Issue:** Manage Admins page shows "No admins found" even though admin accounts exist

---

## 1. DATABASE VERIFICATION

### SQL Query Result
```sql
SELECT id, username, role FROM lms_bd.users LIMIT 20;
```

**Output:**
```
+----+------------------------------------+-----------+
| id | username                           | role      |
+----+------------------------------------+-----------+
|  1 | admin1                             | ADMIN     |
|  2 | john.student                       | STUDENT   |
|  3 | rn015165455102@student.local       | STUDENT   |
...
| 14 | principal                          | PRINCIPAL |
| 15 | balu                               | ADMIN     |
| 16 | swathi                             | ADMIN     |
...
+----+------------------------------------+-----------+
```

**Findings:**
- ✅ **3 ADMIN accounts exist in database:**
  - ID 1: `admin1` (ADMIN)
  - ID 15: `balu` (ADMIN)  
  - ID 16: `swathi` (ADMIN)
- ✅ All admin roles are stored as "ADMIN" (not "TEACHER")
- ✅ Role values are correctly stored (PRINCIPAL, ADMIN, STUDENT)

---

## 2. BACKEND API VERIFICATION

### Endpoint: GET /principal/admins

**Test Command:**
```bash
curl -X GET "http://localhost:8080/api/principal/admins?page=0&size=10" \
  -H "Authorization: Bearer <token>"
```

**Backend Response (API Status: ✅ SUCCESS):**
```json
{
  "content": [
    {
      "id": 1,
      "username": "admin1",
      "email": null,
      "fullName": null,
      "role": "ADMIN",
      "mustChangePassword": false
    },
    {
      "id": 15,
      "username": "balu",
      "email": "balu50764@gmail.com",
      "fullName": "",
      "role": "ADMIN",
      "mustChangePassword": false
    },
    {
      "id": 16,
      "username": "swathi",
      "email": "balu507644@gmail.com",
      "fullName": "swathi",
      "role": "ADMIN",
      "mustChangePassword": false
    }
  ],
  "totalPages": 1,
  "totalElements": 3,
  "size": 10,
  "number": 0
}
```

**Verification:**
- ✅ Backend endpoint `/api/principal/admins` returns **3 admins correctly**
- ✅ Backend also supports `/principal/admins` (without /api prefix)
- ✅ Response format matches PrincipalPageResponseDTO structure
- ✅ All required fields present: id, username, email, fullName, role, mustChangePassword

**Controller Code:**
```java
// File: PrincipalController.java
@GetMapping("/admins")
public ResponseEntity<?> getAdmins(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    log.info("[PRINCIPAL] Fetching all admins");
    
    try {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> admins = userRepository.findByRole(Role.ADMIN, pageable);  // ✅ CORRECT
        List<PrincipalTeacherDTO> teacherDtos = admins.getContent().stream()
                .map(this::toTeacherDto)
                .toList();
        
        return ResponseEntity.ok(new PrincipalPageResponseDTO<>(
                teacherDtos,
                admins.getTotalPages(),
                admins.getTotalElements(),
                admins.getSize(),
                admins.getNumber()
        ));
    } catch (Exception e) {
        log.error("Principal endpoint failed: getAdmins", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch admins", "message", e.getMessage()));
    }
}
```

---

## 3. FRONTEND VERIFICATION

### Frontend API Call Path
**File:** `src/pages/principal/PrincipalAdminsPage.jsx`
```javascript
const data = await fetchAdmins(0, 100);
```

**Backend API Path Used:** `/principal/admins` (from `src/api/authApi.js`)
```javascript
export const fetchAdmins = async (page = 0, size = 10) => {
  const { data } = await api.get(`/principal/admins?page=${page}&size=${size}`);
  return data;
};
```

### Vite Dev Server Configuration - BEFORE (❌ BROKEN)
**File:** `vite.config.js`
```javascript
server: {
  proxy: {
    "/api": { target },
    "/auth": { target },
    "/admin/attendance": { target, bypass },
    "/admin/tasks": { target, bypass },
    "/admin/quizzes": { target, bypass },
    "/admin/student-progress": { target, bypass },
    "^/admin/course(?:/.*)?$": { target, bypass },
    "^/admin/module(?:/.*)?$": { target, bypass },
    "^/admin/lesson(?:/.*)?$": { target, bypass },
    "/admin/submissions": { target, bypass },
    "/student/attendance": { target, bypass },
    "/student/tasks": { target, bypass },
    "/student/quizzes": { target, bypass },
    "/student/submissions": { target, bypass },
    "/student/change-password": { target, bypass },
    "/students": { target, bypass },
    "/courses": { target, bypass },
    // ... missing /principal!
  }
}
```

**Problem:**
- ❌ `/principal` path is NOT proxied to backend
- ❌ When frontend calls `/principal/admins`, Vite dev server **doesn't know where to forward it**
- ❌ Request fails silently with no clear error message
- ✅ Other similar paths like `/admin/...`, `/student/...` ARE proxied

---

## 4. ROOT CAUSE IDENTIFIED

**Root Cause:** Missing Vite dev server proxy configuration for `/principal` path

**Impact:** 
- Frontend cannot access any `/principal/*` endpoints during development
- GET /principal/admins → ❌ Fails
- PUT /principal/admins/{id}/reset-password → ❌ Fails
- Any future principal endpoints → ❌ Fails

**Why it wasn't caught earlier:**
- Backend API works correctly (tested with curl)
- Frontend component code is correct
- No error was thrown - just empty response

---

## 5. FIX APPLIED

### Changes Made
**File:** `vite.config.js`

**Added line 18:**
```javascript
"/principal": { target, bypass },
```

**Updated configuration:**
```javascript
server: {
  proxy: {
    "/api": { target },
    "/auth": { target },
    "/admin/attendance": { target, bypass },
    "/admin/tasks": { target, bypass },
    "/admin/quizzes": { target, bypass },
    "/admin/student-progress": { target, bypass },
    "^/admin/course(?:/.*)?$": { target, bypass },
    "^/admin/module(?:/.*)?$": { target, bypass },
    "^/admin/lesson(?:/.*)?$": { target, bypass },
    "/admin/submissions": { target, bypass },
    "/student/attendance": { target, bypass },
    "/student/tasks": { target, bypass },
    "/student/quizzes": { target, bypass },
    "/student/submissions": { target, bypass },
    "/student/change-password": { target, bypass },
    "/principal": { target, bypass },  // ✅ ADDED
    "/students": { target, bypass },
    "/courses": { target, bypass },
    "/course": { target, bypass },
    "/lesson": { target, bypass },
    "/face": { target, bypass },
    "/uploads": { target },
  },
}
```

---

## 6. TESTING & VALIDATION

### Before Fix
```
Frontend: Manage Admins page shows "No admins found"
Backend:  GET /principal/admins returns 3 admins ✅
Database: Contains 3 ADMIN accounts ✅
Vite:     No proxy for /principal ❌
```

### After Fix
**To verify fix works:**

1. **Restart Vite dev server**
   ```bash
   cd d:\tata strive\lms-frontend
   npm run dev
   ```

2. **Login as Principal**
   - Username: `principal`
   - Password: `principal123`

3. **Navigate to Manage Admins**
   - Sidebar → Manage Admins → `/principal/admins`
   - Should display 3 admins: admin1, balu, swathi

4. **Test Reset Password**
   - Click "Reset Password" on any admin
   - Should open modal successfully
   - Should display success toast after confirm

---

## 7. SUMMARY

| Component | Status | Details |
|-----------|--------|---------|
| **Database** | ✅ OK | 3 admin accounts exist with role=ADMIN |
| **Backend Query** | ✅ OK | `findByRole(Role.ADMIN)` returns correct results |
| **Backend API** | ✅ OK | GET /principal/admins returns proper response |
| **Frontend Component** | ✅ OK | PrincipalAdminsPage correctly calls fetchAdmins() |
| **Frontend API Function** | ✅ OK | authApi.js correctly posts to /principal/admins |
| **Vite Proxy** | ❌ BROKEN | `/principal` route missing from proxy config |

**Root Cause:** Vite dev server proxy missing `/principal` configuration  
**Fix Applied:** Added `/principal: { target, bypass }` to vite.config.js  
**Severity:** HIGH (Blocks all principal-only features)  
**Fix Complexity:** TRIVIAL (1-line addition to config)

---

## 8. ADDITIONAL NOTES

- No changes needed to backend code
- No changes needed to frontend component code
- No database migrations required
- Fix only affects Vite dev server proxy
- Production builds (Docker/build) will need similar proxy configuration in their web server

