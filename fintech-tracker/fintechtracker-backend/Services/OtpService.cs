using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using fintechtracker_backend.DTOs;
using System;
using System.Threading.Tasks;

namespace fintechtracker_backend.Services
{
    public class OtpService : IOtpService
    {
        private readonly IMemoryCache _cache;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly ILogger<OtpService> _logger;

        public OtpService(
            IMemoryCache cache,
            IEmailService emailService,
            IConfiguration config,
            ILogger<OtpService> logger)
        {
            _cache = cache;
            _emailService = emailService;
            _config = config;
            _logger = logger;
        }

        public async Task<bool> GenerateAndCacheOtpAsync(string email, RegisterDto userData)
        {
            try
            {
                // Check rate limit
                if (await IsRateLimitExceededAsync(email))
                {
                    _logger.LogWarning($"Rate limit exceeded for email: {email}");
                    return false;
                }

                // Generate OTP
                var otpCode = _emailService.GenerateOtpCode();
                var expiryMinutes = _config.GetValue<int>("OtpSettings:ExpiryMinutes", 5);

                // Create verification data
                var verificationData = new OtpVerificationData
                {
                    OtpCode = otpCode,
                    UserData = userData,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
                    AttemptCount = 0
                };

                // Cache the OTP data
                var cacheKey = $"otp_{email}";
                var cacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(expiryMinutes),
                    Priority = CacheItemPriority.High
                };

                _cache.Set(cacheKey, verificationData, cacheOptions);

                // Update rate limit counter
                UpdateRateLimit(email);

                // Send email
                var emailSent = await _emailService.SendOtpEmailAsync(email, otpCode, userData.FirstName);

                if (!emailSent)
                {
                    // Remove from cache if email failed
                    _cache.Remove(cacheKey);
                    return false;
                }

                _logger.LogInformation($"OTP generated and cached for email: {email}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error generating OTP for {email}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> VerifyOtpAsync(string email, string otpCode)
        {
            return await Task.Run(() =>
            {
                try
                {
                    var cacheKey = $"otp_{email}";

                    if (!_cache.TryGetValue(cacheKey, out OtpVerificationData? verificationData) ||
                        verificationData == null)
                    {
                        _logger.LogWarning($"No OTP found for email: {email}");
                        return false;
                    }

                    // Check if expired
                    if (DateTime.UtcNow > verificationData.ExpiresAt)
                    {
                        _cache.Remove(cacheKey);
                        _logger.LogWarning($"OTP expired for email: {email}");
                        return false;
                    }

                    // Check max attempts
                    var maxAttempts = _config.GetValue<int>("OtpSettings:MaxAttempts", 5);
                    if (verificationData.AttemptCount >= maxAttempts)
                    {
                        _cache.Remove(cacheKey);
                        _logger.LogWarning($"Max OTP attempts exceeded for email: {email}");
                        return false;
                    }

                    // Increment attempt count
                    verificationData.AttemptCount++;
                    _cache.Set(cacheKey, verificationData, verificationData.ExpiresAt - DateTime.UtcNow);

                    // Verify OTP
                    if (verificationData.OtpCode != otpCode)
                    {
                        _logger.LogWarning($"Invalid OTP attempt for email: {email}");
                        return false;
                    }

                    _logger.LogInformation($"OTP verified successfully for email: {email}");
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error verifying OTP for {email}: {ex.Message}");
                    return false;
                }
            });
        }

        public async Task<RegisterDto?> GetPendingRegistrationAsync(string email)
        {
            return await Task.Run(() =>
            {
                var cacheKey = $"otp_{email}";

                if (_cache.TryGetValue(cacheKey, out OtpVerificationData? verificationData))
                {
                    return verificationData?.UserData;
                }

                return null;
            });
        }

        public async Task<bool> IsRateLimitExceededAsync(string email)
        {
            return await Task.Run(() =>
            {
                var rateLimitKey = $"rate_limit_{email}";
                var maxRequests = _config.GetValue<int>("OtpSettings:MaxRequestsPerHour", 3);

                if (_cache.TryGetValue(rateLimitKey, out int currentCount))
                {
                    return currentCount >= maxRequests;
                }

                return false;
            });
        }

        private void UpdateRateLimit(string email)
        {
            var rateLimitKey = $"rate_limit_{email}";
            var maxRequests = _config.GetValue<int>("OtpSettings:MaxRequestsPerHour", 3);

            if (_cache.TryGetValue(rateLimitKey, out int currentCount))
            {
                _cache.Set(rateLimitKey, currentCount + 1, TimeSpan.FromHours(1));
            }
            else
            {
                _cache.Set(rateLimitKey, 1, TimeSpan.FromHours(1));
            }
        }
    }
}