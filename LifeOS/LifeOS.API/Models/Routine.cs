namespace LifeOS.API.Models;

public class Routine
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Frequency Frequency { get; set; } = Frequency.Daily;
    public List<DayOfWeek> DaysOfWeek { get; set; } = new();
    public string? TimeOfDay { get; set; } // "HH:mm" format
    public bool IsActive { get; set; } = true;
    public int Streak { get; set; } = 0;
    public DateTime? LastCompletedDate { get; set; }
    public List<DateTime> CompletionLog { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum Frequency
{
    Daily,
    Weekly,
    Custom
}
