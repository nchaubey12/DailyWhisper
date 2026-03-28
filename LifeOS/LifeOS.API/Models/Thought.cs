namespace LifeOS.API.Models;

public class Thought
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Mood Mood { get; set; } = Mood.Neutral;
    public bool IsPrivate { get; set; } = true;
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum Mood
{
    Happy,
    Neutral,
    Sad,
    Anxious,
    Excited
}
