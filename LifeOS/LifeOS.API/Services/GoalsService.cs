using LifeOS.API.Models;

namespace LifeOS.API.Services;

public class GoalsService
{
    private readonly JsonStorageService<Goal> _storage;

    public GoalsService(JsonStorageService<Goal> storage)
    {
        _storage = storage;
    }

    public async Task<List<Goal>> GetAllGoalsAsync(string userId)
    {
        var goals = await _storage.GetByUserIdAsync(userId);
        return goals.OrderByDescending(g => g.Priority)
                   .ThenBy(g => g.TargetDate)
                   .ToList();
    }

    public async Task<Goal?> GetGoalByIdAsync(string id, string userId)
    {
        var goal = await _storage.GetByIdAsync(id);
        
        if (goal == null || goal.UserId != userId)
            return null;

        return goal;
    }

    public async Task<Goal> CreateGoalAsync(Goal goal, string userId)
    {
        goal.Id = Guid.NewGuid().ToString();
        goal.UserId = userId;
        goal.CreatedAt = DateTime.UtcNow;

        return await _storage.AddAsync(goal);
    }

    public async Task<Goal?> UpdateGoalAsync(string id, Goal updatedGoal, string userId)
    {
        var existingGoal = await _storage.GetByIdAsync(id);
        
        if (existingGoal == null || existingGoal.UserId != userId)
            return null;

        updatedGoal.Id = id;
        updatedGoal.UserId = userId;
        updatedGoal.CreatedAt = existingGoal.CreatedAt;

        return await _storage.UpdateAsync(id, updatedGoal);
    }

    public async Task<bool> DeleteGoalAsync(string id, string userId)
    {
        var goal = await _storage.GetByIdAsync(id);
        
        if (goal == null || goal.UserId != userId)
            return false;

        return await _storage.DeleteAsync(id);
    }

    public async Task<Goal?> UpdateProgressAsync(string id, int progress, string userId)
    {
        var goal = await _storage.GetByIdAsync(id);
        
        if (goal == null || goal.UserId != userId)
            return null;

        goal.Progress = Math.Clamp(progress, 0, 100);
        
        if (goal.Progress == 100 && goal.Status != GoalStatus.Completed)
        {
            goal.Status = GoalStatus.Completed;
        }
        else if (goal.Progress > 0 && goal.Status == GoalStatus.NotStarted)
        {
            goal.Status = GoalStatus.InProgress;
        }

        return await _storage.UpdateAsync(id, goal);
    }
}
