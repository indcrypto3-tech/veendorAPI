# API Testing Guide - Vercel Deployment

**Base URL**: `https://veendor-api.vercel.app`

## Prerequisites

Before testing, make sure you have set these environment variables in Vercel Dashboard:

1. Go to: https://vercel.com/indcrypto3-tech/veendor-api/settings/environment-variables
2. Add the following variables:

```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
OTP_DUMMY_MODE=true
OTP_DUMMY_CODE=123456
CORS_ORIGIN=*
```

---

## Quick Test Commands (PowerShell)

### 1. Health Check
```powershell
curl https://veendor-api.vercel.app/health
```

### 2. Test Complete Authentication Flow

#### Step 1: Send OTP
```powershell
$response = curl -Method POST -Uri "https://veendor-api.vercel.app/api/v1/auth/send-otp" -ContentType "application/json" -Body '{"phone":"+1234567890"}' | ConvertFrom-Json
$response
```

#### Step 2: Verify OTP (Save tokens)
```powershell
$loginResponse = curl -Method POST -Uri "https://veendor-api.vercel.app/api/v1/auth/verify-otp" -ContentType "application/json" -Body '{"phone":"+1234567890","otp":"123456"}' | ConvertFrom-Json
$accessToken = $loginResponse.data.accessToken
$refreshToken = $loginResponse.data.refreshToken
Write-Host "Access Token: $accessToken"
```

#### Step 3: Get User Profile
```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}
curl -Method GET -Uri "https://veendor-api.vercel.app/api/v1/auth/me" -Headers $headers | ConvertFrom-Json
```

#### Step 4: Create Vendor Profile
```powershell
$vendorBody = @{
    businessName = "Test Vendor from API"
    description = "Testing the deployed API"
    phone = "+1234567890"
    email = "test@vendor.com"
    address = @{
        street = "123 Test St"
        city = "New York"
        state = "NY"
        zipCode = "10001"
        country = "USA"
    }
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$vendorResponse = curl -Method POST -Uri "https://veendor-api.vercel.app/api/v1/vendors" -Headers $headers -Body $vendorBody | ConvertFrom-Json
$vendorResponse
```

#### Step 5: Create a Service
```powershell
$serviceBody = @{
    title = "Test Service"
    description = "This is a test service"
    price = 99.99
    currency = "USD"
    durationMinutes = 120
    category = "Testing"
} | ConvertTo-Json

$serviceResponse = curl -Method POST -Uri "https://veendor-api.vercel.app/api/v1/services" -Headers $headers -Body $serviceBody | ConvertFrom-Json
$serviceResponse
$serviceId = $serviceResponse.data.service.id
```

#### Step 6: List All Services
```powershell
curl -Method GET -Uri "https://veendor-api.vercel.app/api/v1/services?page=1&limit=10" | ConvertFrom-Json
```

#### Step 7: Create an Order
```powershell
$orderBody = @{
    serviceId = $serviceId
    scheduledAt = "2025-12-01T10:00:00.000Z"
    notes = "Test order from deployed API"
} | ConvertTo-Json

$orderResponse = curl -Method POST -Uri "https://veendor-api.vercel.app/api/v1/orders" -Headers $headers -Body $orderBody | ConvertFrom-Json
$orderResponse
```

#### Step 8: Refresh Token
```powershell
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

$newTokens = curl -Method POST -Uri "https://veendor-api.vercel.app/api/v1/auth/refresh" -ContentType "application/json" -Body $refreshBody | ConvertFrom-Json
$newAccessToken = $newTokens.data.accessToken
Write-Host "New Access Token: $newAccessToken"
```

---

## Using cURL (Cross-platform)

### 1. Health Check
```bash
curl https://veendor-api.vercel.app/health
```

### 2. Send OTP
```bash
curl -X POST https://veendor-api.vercel.app/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890"}'
```

### 3. Verify OTP
```bash
curl -X POST https://veendor-api.vercel.app/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","otp":"123456"}'
```

Save the `accessToken` from response and use it:

### 4. Get User Profile
```bash
curl -X GET https://veendor-api.vercel.app/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Create Vendor
```bash
curl -X POST https://veendor-api.vercel.app/api/v1/vendors \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Vendor",
    "description": "Testing API",
    "phone": "+1234567890",
    "email": "test@vendor.com",
    "address": {
      "street": "123 Test St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }'
```

### 6. Create Service
```bash
curl -X POST https://veendor-api.vercel.app/api/v1/services \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Service",
    "description": "A test service",
    "price": 99.99,
    "currency": "USD",
    "durationMinutes": 120,
    "category": "Testing"
  }'
```

---

## Using Postman

1. Import the `postman_collection.json` file
2. Set the `base_url` variable to: `https://veendor-api.vercel.app/api/v1`
3. Run the requests in order:
   - Send OTP
   - Verify OTP (tokens are auto-saved)
   - Use other endpoints with auto-injected tokens

---

## Common Issues & Solutions

### Issue: "FUNCTION_INVOCATION_FAILED"
**Solution**: Environment variables are missing in Vercel. Add them in Vercel Dashboard.

### Issue: "Database connection failed"
**Solution**: 
1. Use MongoDB Atlas (not local MongoDB)
2. Whitelist Vercel IPs (or use `0.0.0.0/0` for testing)
3. Check `MONGO_URI` format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

### Issue: "CORS error"
**Solution**: Set `CORS_ORIGIN=*` in Vercel environment variables (for testing)

### Issue: "Token expired"
**Solution**: Access tokens expire in 15 minutes. Use the refresh endpoint or login again.

---

## Check Vercel Logs

If API is not working:
```bash
vercel logs --follow
```

Or check in Vercel Dashboard:
https://vercel.com/indcrypto3-tech/veendor-api/logs

---

## Redeploy After Changes

After updating environment variables or code:

```powershell
# Commit and push changes
git add .
git commit -m "Update Vercel config"
git push

# Vercel auto-deploys on push
# Or manually trigger: vercel --prod
```

---

## API Documentation

Live Swagger docs (if working):
```
https://veendor-api.vercel.app/docs
```

---

## Testing Checklist

- [ ] Health endpoint responds
- [ ] Send OTP works
- [ ] Verify OTP and get tokens
- [ ] Protected endpoints work with token
- [ ] Create vendor profile
- [ ] Create service
- [ ] List services (public endpoint)
- [ ] Create order
- [ ] Refresh token works
- [ ] Logout works

---

**Note**: Make sure MongoDB Atlas connection string is configured in Vercel environment variables!
