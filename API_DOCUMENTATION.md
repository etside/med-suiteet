# Medsuite-eT v3.0 API Documentation

## Base URL
```
Production: https://api.medsuite.app
Development: http://localhost:8090
```

## Authentication

### Standard JWT Authentication
```
Authorization: Bearer {token}
```

### PIN Authentication
```
POST /api/auth/pin
Content-Type: application/json

{
  "email": "user@example.com",
  "pin": "1234",
  "device_fingerprint": "..."
}

Response:
{
  "token": "jwt_token",
  "user": { ... },
  "expires_in": 86400
}
```

### Biometric Authentication
```
POST /api/auth/biometric
Content-Type: application/json

{
  "credential": {
    "id": "...",
    "rawId": "...",
    "response": { ... },
    "type": "public-key"
  },
  "device_fingerprint": "..."
}

Response:
{
  "token": "jwt_token",
  "user": { ... },
  "expires_in": 86400
}
```

## Content Management System (CMS)

### Get All Content
```
GET /api/cms/content?category=blog&status=published&page=1&limit=10

Response:
{
  "data": [
    {
      "id": 1,
      "title": "Welcome to Medsuite",
      "slug": "welcome",
      "category": "blog",
      "status": "published",
      "excerpt": "...",
      "view_count": 1234,
      "created_at": "2024-06-04T10:00:00Z",
      "author": { "id": 1, "name": "Admin" }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### Get Single Content
```
GET /api/cms/content/welcome

Response:
{
  "id": 1,
  "title": "Welcome to Medsuite",
  "content": "...",
  "slug": "welcome",
  "category": "blog",
  "status": "published",
  "view_count": 1234,
  "comments": [ ... ]
}
```

### Create Content (Admin Only)
```
POST /api/cms/content
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "New Blog Post",
  "slug": "new-post",
  "content": "...",
  "category": "blog",
  "status": "draft",
  "excerpt": "...",
  "featured": false
}

Response: 201 Created
{
  "id": 123,
  "title": "New Blog Post",
  ...
}
```

### Update Content
```
PUT /api/cms/content/123
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "published"
}

Response: 200 OK
{ ... }
```

### Delete Content
```
DELETE /api/cms/content/123
Authorization: Bearer {admin_token}

Response: 204 No Content
```

## Authentication Management

### Enroll Biometric
```
POST /api/auth/biometric/enroll
Authorization: Bearer {token}
Content-Type: application/json

{
  "credential": { ... }
}

Response:
{
  "success": true,
  "message": "Biometric enrolled successfully"
}
```

### Set PIN
```
POST /api/auth/pin/set
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "password123",
  "new_pin": "1234"
}

Response:
{
  "success": true,
  "message": "PIN set successfully"
}
```

### Get Auth Logs
```
GET /api/auth/logs?limit=50

Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": 1,
      "auth_method": "password",
      "ip_address": "192.168.1.1",
      "success": true,
      "created_at": "2024-06-04T10:00:00Z"
    }
  ]
}
```

## User Onboarding

### Get Onboarding Status
```
GET /api/onboarding/status
Authorization: Bearer {token}

Response:
{
  "user_id": 1,
  "current_step": 3,
  "completed": false,
  "completed_steps": [0, 1, 2],
  "progress": 37.5
}
```

### Update Onboarding Progress
```
POST /api/onboarding/progress
Authorization: Bearer {token}
Content-Type: application/json

{
  "completed_step": 3
}

Response:
{
  "current_step": 4,
  "progress": 50
}
```

### Complete Onboarding
```
POST /api/onboarding/complete
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Onboarding completed"
}
```

## Feature Usage Analytics

### Track Feature Usage
```
POST /api/analytics/feature-usage
Authorization: Bearer {token}
Content-Type: application/json

{
  "feature_name": "qr_scanner"
}

Response:
{
  "success": true
}
```

### Get Feature Statistics
```
GET /api/analytics/features
Authorization: Bearer {token}

Response:
{
  "data": {
    "dashboard": { "usage_count": 1543, "last_used": "2024-06-04T10:00:00Z" },
    "pos": { "usage_count": 8234, "last_used": "2024-06-04T09:45:00Z" },
    "inventory": { "usage_count": 456, "last_used": "2024-06-04T08:30:00Z" }
  }
}
```

## Analytics & Reporting

### Get Dashboard Metrics
```
GET /api/analytics/dashboard?date_from=2024-01-01&date_to=2024-06-04

Authorization: Bearer {token}

Response:
{
  "today": {
    "sales": 15234,
    "transactions": 45,
    "revenue": 156234.50
  },
  "this_month": {
    "sales": 345234,
    "transactions": 1234,
    "revenue": 3456789.00
  },
  "trends": {
    "daily_avg": 11508.25,
    "weekly_avg": 49288.43,
    "growth_rate": 12.5
  }
}
```

### Get Product Analytics
```
GET /api/analytics/products?product_id=1&date_from=2024-01-01

Authorization: Bearer {token}

Response:
{
  "product": { "id": 1, "name": "Aspirin 500mg" },
  "analytics": [
    {
      "date": "2024-06-04",
      "views": 234,
      "purchases": 45,
      "revenue": 4500.00
    }
  ]
}
```

## System Configuration

### Get System Settings
```
GET /api/system/config
Authorization: Bearer {admin_token}

Response:
{
  "app_name": "Medsuite-eT",
  "app_version": "3.0.0",
  "biometric_enabled": true,
  "pin_enabled": true,
  "two_factor_enabled": false,
  "shop_enabled": true
}
```

### Update System Settings
```
PUT /api/system/config
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "two_factor_enabled": true,
  "pin_max_attempts": 5
}

Response:
{
  "success": true,
  "config": { ... }
}
```

## Error Responses

### Rate Limit Exceeded
```
HTTP 429 Too Many Requests

{
  "error": "rate_limit_exceeded",
  "retry_after": 60
}
```

### Authentication Failed
```
HTTP 401 Unauthorized

{
  "error": "invalid_credentials",
  "message": "Invalid email or password"
}
```

### PIN Locked
```
HTTP 403 Forbidden

{
  "error": "pin_locked",
  "locked_until": "2024-06-04T10:05:00Z",
  "message": "PIN locked after 3 failed attempts"
}
```

### Validation Error
```
HTTP 400 Bad Request

{
  "error": "validation_error",
  "fields": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

### Server Error
```
HTTP 500 Internal Server Error

{
  "error": "internal_server_error",
  "message": "An unexpected error occurred",
  "request_id": "uuid-here"
}
```

## Webhooks

### CMS Content Published
```
POST {webhook_url}

{
  "event": "cms.content.published",
  "data": {
    "id": 1,
    "title": "New Blog Post",
    "category": "blog",
    "published_at": "2024-06-04T10:00:00Z"
  }
}
```

### User Onboarding Completed
```
POST {webhook_url}

{
  "event": "user.onboarding.completed",
  "data": {
    "user_id": 1,
    "completed_at": "2024-06-04T10:00:00Z",
    "time_to_complete_minutes": 15
  }
}
```

## Rate Limits

- **Unauthenticated**: 30 requests per minute
- **Authenticated**: 300 requests per minute
- **Admin**: 1000 requests per minute
- **Login Attempts**: 5 per minute
- **PIN Attempts**: 3 per 5 minutes

## SDKs & Libraries

### JavaScript/TypeScript
```
npm install @medsuite/sdk
```

```typescript
import { MedsuiteClient } from '@medsuite/sdk';

const client = new MedsuiteClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.medsuite.app'
});

// Usage
const cms = await client.cms.getContent('blog');
const user = await client.auth.getCurrentUser();
```

### PHP
```
composer require medsuite/sdk
```

```php
use Medsuite\Client;

$client = new Client([
    'api_key' => 'your-api-key',
    'base_url' => 'https://api.medsuite.app'
]);
```

---

**API Version**: 3.0.0  
**Last Updated**: June 2024  
**Documentation**: https://docs.medsuite.app/api
