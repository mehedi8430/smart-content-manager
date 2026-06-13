# Authentication Flow

This document describes the authentication system implementation for frontend integration.

## Overview

The authentication system uses JWT (JSON Web Tokens) with access and refresh token strategy. Tokens are stored in HTTP-only cookies for security.

## API Endpoints

Base URL: `http://localhost:8000/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register a new user | No |
| POST | `/login` | Login with email/password | No |
| POST | `/logout` | Logout current user | Yes |
| POST | `/refresh-token` | Refresh access token | No (uses refresh token cookie) |

## Registration Flow

### Request

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Validation Rules

- `email`: Valid email format (required)
- `password`: Minimum 6 characters (required)

### Success Response (201)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Error Responses

- **400**: User already exists with this email
- **400**: Validation error (invalid email or password too short)

### Frontend Implementation

```typescript
const register = async (email: string, password: string) => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};
```

## Login Flow

### Request

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Validation Rules

- `email`: Valid email format (required)
- `password`: Non-empty string (required)

### Success Response (200)

```json
{
  "success": true,
  "message": "User loggedin successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com"
    },
    "accesToken": "jwt-access-token-here",
    "refreshToken": "jwt-refresh-token-here"
  }
}
```

**Important**: Tokens are also set as HTTP-only cookies:
- `accessToken`: Expires in 1 day
- `refreshToken`: Expires in 7 days

### Error Responses

- **400**: Invalid email or password
- **400**: Validation error

### Frontend Implementation

```typescript
const login = async (email: string, password: string) => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Store user data in state/context (tokens are in cookies)
    // Redirect to dashboard
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

## JWT Strategy

### Token Configuration

| Token Type | Secret Env Variable | Default Expiration | Cookie Duration |
|------------|---------------------|-------------------|-----------------|
| Access Token | `ACCESS_TOKEN_SECRET` | 1 day | 1 day |
| Refresh Token | `REFRESH_TOKEN_SECRET` | 7 days | 7 days |

### Token Storage

Tokens are stored in HTTP-only cookies with the following options:

```typescript
{
  httpOnly: true,              // Not accessible via JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',          // CSRF protection
  maxAge: 1000 * 60 * 60 * 24 * 1  // 1 day for access, 7 days for refresh
}
```

### Token Usage

Access tokens can be sent in two ways:

1. **Authorization Header** (preferred for API calls):
   ```
   Authorization: Bearer <access_token>
   ```

2. **Cookie** (automatic):
   - The backend automatically checks for `accessToken` cookie if header is not present

### Frontend Auth Context Example

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setUser(data.data.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await fetch('http://localhost:8000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## Refresh Token Flow

### When to Refresh

- When an API call returns **401** with message "Token expired. Please refresh your token."
- Implement automatic token refresh in your API interceptor

### Request

```http
POST /api/auth/refresh-token
```

**Note**: No request body needed. The refresh token is read from the `refreshToken` cookie.

### Success Response (200)

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

**Important**: A new `accessToken` cookie is set automatically.

### Error Responses

- **401**: No refresh token provided
- **401**: Invalid refresh token

### Frontend Implementation with Auto-Refresh

```typescript
// utils/api.ts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const apiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (response.status === 401) {
    const errorData = await response.json();
    
    if (errorData.message === 'Token expired. Please refresh your token.') {
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const refreshResponse = await fetch('http://localhost:8000/api/auth/refresh-token', {
            method: 'POST',
            credentials: 'include'
          });
          
          if (refreshResponse.ok) {
            isRefreshing = false;
            onTokenRefreshed('new-token');
            // Retry original request
            return apiCall(url, options);
          }
        } catch (error) {
          isRefreshing = false;
          // Redirect to login
          window.location.href = '/login';
          throw error;
        }
      } else {
        // Wait for refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(apiCall(url, options));
          });
        });
      }
    }
  }

  return response;
};
```

## Logout Flow

### Request

```http
POST /api/auth/logout
```

**Note**: Requires authentication (access token in cookie or header)

### Success Response (200)

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Backend actions**:
- Clears `refreshToken` from database
- Clears `accessToken` and `refreshToken` cookies

### Frontend Implementation

```typescript
const logout = async () => {
  try {
    await fetch('http://localhost:8000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    // Clear user state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
    // Even if API fails, clear local state
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  }
};
```

## Authorization Middleware

### Protected Routes

The backend uses the `protect` middleware to secure routes. This middleware:

1. Checks for access token in `Authorization` header or `accessToken` cookie
2. Verifies the JWT signature
3. Attaches user ID to `req.user`
4. Returns 401 if token is missing, invalid, or expired

### Frontend Implementation for Protected Routes

```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // or loading spinner
  }

  return <>{children}</>;
};

// Usage
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Making Authenticated API Calls

```typescript
const fetchProtectedData = async () => {
  const response = await fetch('http://localhost:8000/api/campaigns', {
    credentials: 'include', // Sends cookies automatically
    // OR explicitly send token in header
    // headers: {
    //   'Authorization': `Bearer ${token}`
    // }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  
  return response.json();
};
```

## Security Best Practices

1. **Always use `credentials: 'include'`** in fetch requests to send/receive cookies
2. **Never store tokens in localStorage** - use the HTTP-only cookies provided by the backend
3. **Implement automatic token refresh** to handle expired access tokens gracefully
4. **Clear local state on logout** even if the API call fails
5. **Use HTTPS in production** to ensure cookies are sent securely
6. **Validate user input** on the frontend before sending to backend (but always validate on backend too)

## Error Handling

Common error codes and their meanings:

| Status Code | Message | Action |
|-------------|---------|--------|
| 400 | User already exists with this email | Show error, prompt to login instead |
| 400 | Invalid email or password | Show error, check credentials |
| 400 | Validation error | Show specific validation message |
| 401 | Access denied. No token provided | Redirect to login |
| 401 | Token expired. Please refresh your token | Trigger token refresh |
| 401 | Token is not valid | Redirect to login |
| 403 | Access denied. Insufficient permissions | Show permission error |

## Testing

### Test Registration

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v
```

### Test Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v -c cookies.txt
```

### Test Protected Route

```bash
curl http://localhost:8000/api/campaigns \
  -b cookies.txt \
  -v
```

### Test Refresh Token

```bash
curl -X POST http://localhost:8000/api/auth/refresh-token \
  -b cookies.txt \
  -v
```

### Test Logout

```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -b cookies.txt \
  -v
```
