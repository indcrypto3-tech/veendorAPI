# Automated API Test Script for Vercel Deployment
# Run this script to test all main endpoints

$baseUrl = "https://veendor-api.vercel.app"
$apiUrl = "$baseUrl/api/v1"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Vendor API Testing - Vercel Deploy" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1/10] Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✓ Health Check: PASSED" -ForegroundColor Green
    Write-Host "  Response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health Check: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "CRITICAL: API is not responding. Check Vercel deployment and environment variables." -ForegroundColor Red
    Write-Host "Visit: https://vercel.com/indcrypto3-tech/veendor-api" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Send OTP
Write-Host "[2/10] Testing Send OTP..." -ForegroundColor Yellow
try {
    $otpBody = @{
        phone = "+1234567890"
    } | ConvertTo-Json

    $otpResponse = Invoke-RestMethod -Uri "$apiUrl/auth/send-otp" -Method POST -ContentType "application/json" -Body $otpBody
    Write-Host "✓ Send OTP: PASSED" -ForegroundColor Green
    
    if ($otpResponse.data.debugOtp) {
        Write-Host "  Debug OTP: $($otpResponse.data.debugOtp)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Send OTP: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Verify OTP & Login
Write-Host "[3/10] Testing Verify OTP & Login..." -ForegroundColor Yellow
try {
    $verifyBody = @{
        phone = "+1234567890"
        otp = "123456"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/verify-otp" -Method POST -ContentType "application/json" -Body $verifyBody
    $accessToken = $loginResponse.data.accessToken
    $refreshToken = $loginResponse.data.refreshToken
    
    Write-Host "✓ Verify OTP: PASSED" -ForegroundColor Green
    Write-Host "  User ID: $($loginResponse.data.user.id)" -ForegroundColor Gray
    Write-Host "  Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Verify OTP: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Get Current User
Write-Host "[4/10] Testing Get Current User..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }

    $userResponse = Invoke-RestMethod -Uri "$apiUrl/auth/me" -Method GET -Headers $headers
    Write-Host "✓ Get User: PASSED" -ForegroundColor Green
    Write-Host "  Phone: $($userResponse.data.user.phone)" -ForegroundColor Gray
    Write-Host "  Role: $($userResponse.data.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Get User: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Create Vendor Profile
Write-Host "[5/10] Testing Create Vendor Profile..." -ForegroundColor Yellow
try {
    $vendorBody = @{
        businessName = "Automated Test Vendor $(Get-Date -Format 'HHmmss')"
        description = "Created by automated test script"
        phone = "+1234567890"
        email = "test@autovendor.com"
        address = @{
            street = "123 Automation Lane"
            city = "Test City"
            state = "TC"
            zipCode = "12345"
            country = "USA"
            coordinates = @{
                latitude = 40.7128
                longitude = -74.0060
            }
        }
    } | ConvertTo-Json -Depth 5

    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }

    $vendorResponse = Invoke-RestMethod -Uri "$apiUrl/vendors" -Method POST -Headers $headers -Body $vendorBody
    $vendorId = $vendorResponse.data.vendor.id
    
    Write-Host "✓ Create Vendor: PASSED" -ForegroundColor Green
    Write-Host "  Vendor ID: $vendorId" -ForegroundColor Gray
    Write-Host "  Business Name: $($vendorResponse.data.vendor.businessName)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Create Vendor: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Vendor might already exist, try to get it
    try {
        $myVendor = Invoke-RestMethod -Uri "$apiUrl/vendors/me" -Method GET -Headers $headers
        $vendorId = $myVendor.data.vendor.id
        Write-Host "  → Using existing vendor: $vendorId" -ForegroundColor Yellow
    } catch {
        Write-Host "  → Could not retrieve vendor" -ForegroundColor Red
    }
}
Write-Host ""

# Test 6: Create Service
Write-Host "[6/10] Testing Create Service..." -ForegroundColor Yellow
try {
    $serviceBody = @{
        title = "Test Service $(Get-Date -Format 'HHmmss')"
        description = "Automated test service - deep cleaning"
        price = 149.99
        currency = "USD"
        durationMinutes = 90
        category = "Cleaning"
    } | ConvertTo-Json

    $serviceResponse = Invoke-RestMethod -Uri "$apiUrl/services" -Method POST -Headers $headers -Body $serviceBody
    $serviceId = $serviceResponse.data.service.id
    
    Write-Host "✓ Create Service: PASSED" -ForegroundColor Green
    Write-Host "  Service ID: $serviceId" -ForegroundColor Gray
    Write-Host "  Title: $($serviceResponse.data.service.title)" -ForegroundColor Gray
    Write-Host "  Slug: $($serviceResponse.data.service.slug)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Create Service: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    $serviceId = $null
}
Write-Host ""

# Test 7: List Services
Write-Host "[7/10] Testing List Services..." -ForegroundColor Yellow
try {
    $servicesResponse = Invoke-RestMethod -Uri "$apiUrl/services?page=1&limit=5&status=active" -Method GET
    
    Write-Host "✓ List Services: PASSED" -ForegroundColor Green
    Write-Host "  Total Services: $($servicesResponse.meta.total)" -ForegroundColor Gray
    Write-Host "  Page: $($servicesResponse.meta.page)/$($servicesResponse.meta.totalPages)" -ForegroundColor Gray
} catch {
    Write-Host "✗ List Services: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Create Order
Write-Host "[8/10] Testing Create Order..." -ForegroundColor Yellow
if ($serviceId) {
    try {
        $futureDate = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        
        $orderBody = @{
            serviceId = $serviceId
            scheduledAt = $futureDate
            notes = "Automated test order - please handle with care"
        } | ConvertTo-Json

        $orderResponse = Invoke-RestMethod -Uri "$apiUrl/orders" -Method POST -Headers $headers -Body $orderBody
        $orderId = $orderResponse.data.order.id
        
        Write-Host "✓ Create Order: PASSED" -ForegroundColor Green
        Write-Host "  Order ID: $orderId" -ForegroundColor Gray
        Write-Host "  Status: $($orderResponse.data.order.status)" -ForegroundColor Gray
        Write-Host "  Price: $($orderResponse.data.order.currency) $($orderResponse.data.order.price)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Create Order: FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $orderId = $null
    }
} else {
    Write-Host "⊘ Create Order: SKIPPED (no service created)" -ForegroundColor Yellow
    $orderId = $null
}
Write-Host ""

# Test 9: Refresh Token
Write-Host "[9/10] Testing Refresh Token..." -ForegroundColor Yellow
try {
    $refreshBody = @{
        refreshToken = $refreshToken
    } | ConvertTo-Json

    $newTokenResponse = Invoke-RestMethod -Uri "$apiUrl/auth/refresh" -Method POST -ContentType "application/json" -Body $refreshBody
    $newAccessToken = $newTokenResponse.data.accessToken
    
    Write-Host "✓ Refresh Token: PASSED" -ForegroundColor Green
    Write-Host "  New Access Token: $($newAccessToken.Substring(0, 20))..." -ForegroundColor Gray
    
    # Update token for logout
    $refreshToken = $newTokenResponse.data.refreshToken
} catch {
    Write-Host "✗ Refresh Token: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 10: Logout
Write-Host "[10/10] Testing Logout..." -ForegroundColor Yellow
try {
    $logoutBody = @{
        refreshToken = $refreshToken
    } | ConvertTo-Json

    $logoutResponse = Invoke-RestMethod -Uri "$apiUrl/auth/logout" -Method POST -ContentType "application/json" -Body $logoutBody
    
    Write-Host "✓ Logout: PASSED" -ForegroundColor Green
    Write-Host "  Message: $($logoutResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Logout: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "         Testing Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API Base URL: $apiUrl" -ForegroundColor White
Write-Host "Swagger Docs: $baseUrl/docs" -ForegroundColor White
Write-Host "Health Check: $baseUrl/health" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Vercel logs for any errors" -ForegroundColor White
Write-Host "2. Test with Postman using postman_collection.json" -ForegroundColor White
Write-Host "3. Integrate with Flutter app" -ForegroundColor White
Write-Host ""
