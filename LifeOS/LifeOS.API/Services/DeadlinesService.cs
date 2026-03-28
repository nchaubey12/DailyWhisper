using LifeOS.API.Models;

namespace LifeOS.API.Services;

public class DeadlinesService
{
    private readonly JsonStorageService<Deadline> _storage;

    public DeadlinesService(JsonStorageService<Deadline> storage)
    {
        _storage = storage;
    }

    public async Task<List<Deadline>> GetAllDeadlinesAsync(string userId)
    {
        var deadlines = await _storage.GetByUserIdAsync(userId);
        return deadlines.OrderBy(d => d.IsCompleted)
                       .ThenBy(d => d.DueDate)
                       .ThenByDescending(d => d.Priority)
                       .ToList();
    }

    public async Task<Deadline?> GetDeadlineByIdAsync(string id, string userId)
    {
        var deadline = await _storage.GetByIdAsync(id);
        
        if (deadline == null || deadline.UserId != userId)
            return null;

        return deadline;
    }

    public async Task<Deadline> CreateDeadlineAsync(Deadline deadline, string userId)
    {
        deadline.Id = Guid.NewGuid().ToString();
        deadline.UserId = userId;
        deadline.CreatedAt = DateTime.UtcNow;

        return await _storage.AddAsync(deadline);
    }

    public async Task<Deadline?> UpdateDeadlineAsync(string id, Deadline updatedDeadline, string userId)
    {
        var existingDeadline = await _storage.GetByIdAsync(id);
        
        if (existingDeadline == null || existingDeadline.UserId != userId)
            return null;

        updatedDeadline.Id = id;
        updatedDeadline.UserId = userId;
        updatedDeadline.CreatedAt = existingDeadline.CreatedAt;

        return await _storage.UpdateAsync(id, updatedDeadline);
    }

    public async Task<bool> DeleteDeadlineAsync(string id, string userId)
    {
        var deadline = await _storage.GetByIdAsync(id);
        
        if (deadline == null || deadline.UserId != userId)
            return false;

        return await _storage.DeleteAsync(id);
    }

    public async Task<Deadline?> ToggleCompleteAsync(string id, string userId)
    {
        var deadline = await _storage.GetByIdAsync(id);
        
        if (deadline == null || deadline.UserId != userId)
            return null;

        deadline.IsCompleted = !deadline.IsCompleted;

        return await _storage.UpdateAsync(id, deadline);
    }
}
