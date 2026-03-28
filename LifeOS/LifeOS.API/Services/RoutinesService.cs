using LifeOS.API.Models;

namespace LifeOS.API.Services;

public class RoutinesService
{
    private readonly JsonStorageService<Routine> _storage;

    public RoutinesService(JsonStorageService<Routine> storage)
    {
        _storage = storage;
    }

    public async Task<List<Routine>> GetAllRoutinesAsync(string userId)
    {
        var routines = await _storage.GetByUserIdAsync(userId);
        return routines.OrderByDescending(r => r.IsActive)
                      .ThenByDescending(r => r.Streak)
                      .ToList();
    }

    public async Task<Routine?> GetRoutineByIdAsync(string id, string userId)
    {
        var routine = await _storage.GetByIdAsync(id);
        
        if (routine == null || routine.UserId != userId)
            return null;

        return routine;
    }

    public async Task<Routine> CreateRoutineAsync(Routine routine, string userId)
    {
        routine.Id = Guid.NewGuid().ToString();
        routine.UserId = userId;
        routine.CreatedAt = DateTime.UtcNow;
        routine.CompletionLog = new List<DateTime>();

        return await _storage.AddAsync(routine);
    }

    public async Task<Routine?> UpdateRoutineAsync(string id, Routine updatedRoutine, string userId)
    {
        var existingRoutine = await _storage.GetByIdAsync(id);
        
        if (existingRoutine == null || existingRoutine.UserId != userId)
            return null;

        updatedRoutine.Id = id;
        updatedRoutine.UserId = userId;
        updatedRoutine.CreatedAt = existingRoutine.CreatedAt;
        updatedRoutine.CompletionLog = existingRoutine.CompletionLog;
        updatedRoutine.Streak = existingRoutine.Streak;
        updatedRoutine.LastCompletedDate = existingRoutine.LastCompletedDate;

        return await _storage.UpdateAsync(id, updatedRoutine);
    }

    public async Task<bool> DeleteRoutineAsync(string id, string userId)
    {
        var routine = await _storage.GetByIdAsync(id);
        
        if (routine == null || routine.UserId != userId)
            return false;

        return await _storage.DeleteAsync(id);
    }

    public async Task<Routine?> CheckInAsync(string id, string userId)
    {
        var routine = await _storage.GetByIdAsync(id);
        
        if (routine == null || routine.UserId != userId)
            return null;

        var today = DateTime.UtcNow.Date;

        // Check if already checked in today
        if (routine.CompletionLog.Any(d => d.Date == today))
        {
            return routine; // Already checked in
        }

        // Add today to completion log
        routine.CompletionLog.Add(today);

        // Update streak
        if (routine.LastCompletedDate == null)
        {
            routine.Streak = 1;
        }
        else
        {
            var daysSinceLastCompletion = (today - routine.LastCompletedDate.Value.Date).Days;
            
            if (daysSinceLastCompletion == 1)
            {
                routine.Streak++;
            }
            else if (daysSinceLastCompletion > 1)
            {
                routine.Streak = 1; // Reset streak
            }
        }

        routine.LastCompletedDate = today;

        return await _storage.UpdateAsync(id, routine);
    }
}
