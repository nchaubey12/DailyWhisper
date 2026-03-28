namespace LifeOS.API.Models;

public class Goal
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public GoalStatus Status { get; set; } = GoalStatus.NotStarted;
    public Priority Priority { get; set; } = Priority.Medium;
    public DateTime? TargetDate { get; set; }
    public List<string> Milestones { get; set; } = new();
    public int Progress { get; set; } = 0; // 0-100
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum GoalStatus
{
    NotStarted,
    InProgress,
    Completed
}

public enum Priority
{
    Low,
    Medium,
    High
}
