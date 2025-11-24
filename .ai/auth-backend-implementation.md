# Authentication Backend Implementation

## Summary

Successfully implemented the complete authentication backend for Definition Quest following the specification in `auth-spec.md`.

## Implemented Components

### 1. Validation Schemas (`src/lib/validation/auth.ts`)

- `LoginSchema` - validates email and password for login
- `SignUpSchema` - validates email, password, and displayName for registration
- `ForgotPasswordSchema` - validates email for password reset request
- `ResetPasswordSchema` - validates new password for password reset

### 2. API Endpoints

#### POST /api/auth/login

- Authenticates user with email and password
- Returns user data and session tokens
- Handles email not confirmed error
- Status codes: 200 (success), 400 (validation), 401 (invalid credentials), 403 (email not confirmed)

#### POST /api/auth/signUp

- Registers new user with email, password, and display name
- Creates auth.users record via Supabase Auth
- Creates user_meta record with display name
- Sends verification email automatically
- Status codes: 201 (created), 400 (validation), 409 (email exists)

#### POST /api/auth/logout

- Signs out current user
- Clears session cookies
- Can be called without authentication
- Status codes: 200 (success), 500 (server error)

#### POST /api/auth/forgot-password

- Sends password reset link to user's email
- Always returns success (security best practice)
- Constructs redirect URL dynamically based on request origin
- Status codes: 200 (success), 400 (validation)

#### POST /api/auth/reset-password

- Resets password using token from email link
- Token is automatically verified by Supabase (in session)
- Requires valid reset token session
- Status codes: 200 (success), 400 (validation), 401 (invalid/expired token)

#### POST /api/auth/refresh-token

- Refreshes access token using refresh token
- Returns new access token and refresh token
- Allows extending user session without re-login
- Status codes: 200 (success), 400 (validation), 401 (invalid/expired token)

### 3. Error Mappings (`src/lib/utils/api-response.ts`)

Added standardized error responses:

- `EMAIL_ALREADY_EXISTS` - 409
- `INVALID_CREDENTIALS` - 401
- `EMAIL_NOT_CONFIRMED` - 403
- `INVALID_RESET_TOKEN` - 401
- `INVALID_REFRESH_TOKEN` - 401
- `USER_CREATION_FAILED` - 500

### 4. Type Definitions (`src/types.ts`)

Added Auth DTOs:

- `LoginRequest`
- `SignUpRequest`
- `ForgotPasswordRequest`
- `ResetPasswordRequest`
- `RefreshTokenRequest`
- `AuthUserDTO`
- `AuthSessionDTO`
- `AuthResponse`

### 5. Middleware Updates (`src/middleware/index.ts`)

Enhanced middleware to:

- Always attempt authentication for API endpoints
- Set `locals.user` if authentication succeeds (even for public endpoints)
- Allow public endpoints to proceed without authentication
- Enforce authentication for protected endpoints
- Support both authenticated and anonymous access patterns

Public endpoints:

- `/api/auth/login`
- `/api/auth/signUp`
- `/api/auth/logout`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/boards` (for public board browsing)

## API Contract Examples

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response 200 OK
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  },
  "message": "Logged in successfully"
}
```

### Sign Up

```bash
POST /api/auth/signUp
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "displayName": "John Doe"
}

# Response 201 Created
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com"
    }
  },
  "message": "Account created successfully. Please check your email for verification."
}
```

### Logout

```bash
POST /api/auth/logout

# Response 200 OK
{
  "message": "Logged out successfully"
}
```

### Forgot Password

```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

# Response 200 OK
{
  "message": "Password reset link sent. Please check your email."
}
```

### Reset Password

```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "newPassword": "newpassword123"
}

# Response 200 OK
{
  "message": "Password updated successfully"
}
```

### Refresh Token

```bash
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}

# Response 200 OK
{
  "data": {
    "session": {
      "accessToken": "new_jwt_token",
      "refreshToken": "new_refresh_token"
    }
  },
  "message": "Token refreshed successfully"
}
```

## Security Features

1. **HTTP-only Cookies**: Session tokens stored securely by Supabase
2. **Zod Validation**: All inputs validated on server-side
3. **Error Handling**: Consistent error responses, no information leakage
4. **Password Requirements**: Minimum 6 characters (enforced by validation)
5. **Email Verification**: Automatic verification email sent on signup
6. **Security Best Practices**:
   - Forgot password always returns success (doesn't reveal if email exists)
   - Generic error messages for invalid credentials

## Testing Recommendations

### Manual Testing with REST Client

1. **Sign Up Flow**

   ```bash
   POST http://localhost:4321/api/auth/signUp
   {
     "email": "test@example.com",
     "password": "test123",
     "displayName": "Test User"
   }
   ```

2. **Login Flow**

   ```bash
   POST http://localhost:4321/api/auth/login
   {
     "email": "test@example.com",
     "password": "test123"
   }
   ```

3. **Password Reset Flow**

   ```bash
   # Request reset
   POST http://localhost:4321/api/auth/forgot-password
   {
     "email": "test@example.com"
   }

   # Check email for reset link
   # Click link (opens /reset-password?token=xxx&type=recovery)

   # Reset password
   POST http://localhost:4321/api/auth/reset-password
   {
     "newPassword": "newpass123"
   }
   ```

4. **Logout Flow**

   ```bash
   POST http://localhost:4321/api/auth/logout
   ```

5. **Refresh Token Flow**

   ```bash
   # First, login to get refresh token
   POST http://localhost:4321/api/auth/login
   {
     "email": "test@example.com",
     "password": "test123"
   }
   # Save the refreshToken from response

   # Use refresh token to get new access token
   POST http://localhost:4321/api/auth/refresh-token
   {
     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

### Edge Cases to Test

- Login with unconfirmed email
- Sign up with existing email
- Invalid email format
- Password too short (< 6 chars)
- Display name too long (> 40 chars)
- Expired reset token
- Reset password without token
- Invalid or expired refresh token
- Refresh token from another user
- Access protected endpoint without auth

## Supabase Configuration Required

Before testing, ensure Supabase is configured:

1. **Email Templates** (in Supabase Dashboard → Authentication → Email Templates)
   - Confirm signup template
   - Reset password template

2. **Redirect URLs** (in Supabase Dashboard → Authentication → URL Configuration)
   - Add development URL: `http://localhost:4321/reset-password`
   - Add production URL: `https://yourdomain.com/reset-password`

3. **Email Confirmation** (in Supabase Dashboard → Authentication → Settings)
   - Enable "Confirm email" if you want to require email verification before login

## Next Steps (Frontend Implementation)

1. Create Astro pages:
   - `src/pages/login.astro`
   - `src/pages/signup.astro`
   - `src/pages/forgot-password.astro`
   - `src/pages/reset-password.astro`

2. Create React components:
   - `src/components/auth/LoginForm.tsx`
   - `src/components/auth/SignUpForm.tsx`
   - `src/components/auth/ForgotPasswordForm.tsx`
   - `src/components/auth/ResetPasswordForm.tsx`
   - `src/components/auth/UserNav.tsx`

3. Create UI components (Shadcn/ui):
   - Input, Label, Alert, DropdownMenu, Avatar

4. Create layouts:
   - `src/layouts/AuthenticatedLayout.astro` (for protected pages)

5. Protect existing pages:
   - Update dashboard/board pages to use AuthenticatedLayout

## Files Created/Modified

### Created Files

- `src/lib/validation/auth.ts` - Validation schemas
- `src/pages/api/auth/login.ts` - Login endpoint
- `src/pages/api/auth/signUp.ts` - Sign up endpoint
- `src/pages/api/auth/logout.ts` - Logout endpoint
- `src/pages/api/auth/forgot-password.ts` - Forgot password endpoint
- `src/pages/api/auth/reset-password.ts` - Reset password endpoint
- `src/pages/api/auth/refresh-token.ts` - Refresh token endpoint

### Modified Files

- `src/lib/utils/api-response.ts` - Added auth error mappings
- `src/types.ts` - Added Auth DTOs
- `src/middleware/index.ts` - Updated to support public auth endpoints and flexible authentication

## Notes

- Legacy endpoints (`login.temporary.ts`, `signIn.temporary.ts`) can be removed once frontend is implemented
- The middleware now supports hybrid authentication: public endpoints can still access `locals.user` if user is authenticated
- Password reset requires user to click email link before calling the API
- Refresh token endpoint allows extending sessions without requiring re-login
- All endpoints follow the existing codebase patterns for consistency
- All error handling uses throw/catch pattern for better code organization
