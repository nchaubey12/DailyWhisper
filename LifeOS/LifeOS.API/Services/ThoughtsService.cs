using LifeOS.API.Models;

namespace LifeOS.API.Services;

public class ThoughtsService
{
    private readonly JsonStorageService<Thought> _storage;

    public ThoughtsService(JsonStorageService<Thought> storage)
    {
        _storage = storage;
    }

    public async Task<List<Thought>> GetAllThoughtsAsync(string userId)
    {
        var thoughts = await _storage.GetByUserIdAsync(userId);
        return thoughts.OrderByDescending(t => t.CreatedAt).ToList();
    }

    public async Task<Thought?> GetThoughtByIdAsync(string id, string userId)
    {
        var thought = await _storage.GetByIdAsync(id);
        
        if (thought == null || thought.UserId != userId)
            return null;

        return thought;
    }

    public async Task<Thought> CreateThoughtAsync(Thought thought, string userId)
    {
        thought.Id = Guid.NewGuid().ToString();
        thought.UserId = userId;
        thought.CreatedAt = DateTime.UtcNow;

        return await _storage.AddAsync(thought);
    }

    public async Task<Thought?> UpdateThoughtAsync(string id, Thought updatedThought, string userId)
    {
        var existingThought = await _storage.GetByIdAsync(id);
        
        if (existingThought == null || existingThought.UserId != userId)
            return null;

        updatedThought.Id = id;
        updatedThought.UserId = userId;
        updatedThought.CreatedAt = existingThought.CreatedAt;

        return await _storage.UpdateAsync(id, updatedThought);
    }

    public async Task<bool> DeleteThoughtAsync(string id, string userId)
    {
        var thought = await _storage.GetByIdAsync(id);
        
        if (thought == null || thought.UserId != userId)
            return false;

        return await _storage.DeleteAsync(id);
    }

    public async Task<Dictionary<string, int>> GetMoodSummaryAsync(string userId)
    {
        var thoughts = await _storage.GetByUserIdAsync(userId);
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        
        var recentThoughts = thoughts.Where(t => t.CreatedAt >= thirtyDaysAgo).ToList();

        var moodCounts = new Dictionary<string, int>
        {
            { "Happy", recentThoughts.Count(t => t.Mood == Mood.Happy) },
            { "Neutral", recentThoughts.Count(t => t.Mood == Mood.Neutral) },
            { "Sad", recentThoughts.Count(t => t.Mood == Mood.Sad) },
            { "Anxious", recentThoughts.Count(t => t.Mood == Mood.Anxious) },
            { "Excited", recentThoughts.Count(t => t.Mood == Mood.Excited) }
        };

        return moodCounts;
    }
}
