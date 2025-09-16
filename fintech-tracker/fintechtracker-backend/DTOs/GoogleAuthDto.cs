namespace fintechtracker_backend.DTOs
{
    public class GoogleAuthDto
    {
        public string IdToken { get; set; } = null!;
    }

    public class GoogleUserInfo
    {
        public string Email { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string GivenName { get; set; } = null!;
        public string FamilyName { get; set; } = null!;
        public string Picture { get; set; } = null!;
        public string Sub { get; set; } = null!; // Google UserID
    }
}