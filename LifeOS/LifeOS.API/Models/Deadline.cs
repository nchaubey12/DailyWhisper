namespace LifeOS.API.Models;

public class Deadline
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string? DueTime { get; set; } // Optional time in "HH:mm" format
    public string Category { get; set; } = "General";
    public Priority Priority { get; set; } = Priority.Medium;
    public bool IsCompleted { get; set; } = false;
    public bool ReminderSet { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
