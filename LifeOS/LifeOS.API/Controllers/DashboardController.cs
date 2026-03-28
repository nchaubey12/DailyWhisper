using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeOS.API.Services;
using LifeOS.API.Models;
using System.Security.Claims;

namespace LifeOS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly NotesService _notesService;
    private readonly GoalsService _goalsService;
    private readonly DeadlinesService _deadlinesService;
    private readonly RoutinesService _routinesService;
    private readonly ThoughtsService _thoughtsService;

    public DashboardController(
        NotesService notesService,
        GoalsService goalsService,
        DeadlinesService deadlinesService,
        RoutinesService routinesService,
        ThoughtsService thoughtsService)
    {
        _notesService = notesService;
        _goalsService = goalsService;
        _deadlinesService = deadlinesService;
        _routinesService = routinesService;
        _thoughtsService = thoughtsService;
    }

    private string GetUserId()
    {
        return User.FindFirst("userId")?.Value 
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? string.Empty;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummary>> GetSummary()
    {
        var userId = GetUserId();

        var notes = await _notesService.GetAllNotesAsync(userId);
        var goals = await _goalsService.GetAllGoalsAsync(userId);
        var deadlines = await _deadlinesService.GetAllDeadlinesAsync(userId);
        var routines = await _routinesService.GetAllRoutinesAsync(userId);
        var thoughts = await _thoughtsService.GetAllThoughtsAsync(userId);

        var today = DateTime.UtcNow.Date;
        var nextWeek = today.AddDays(7);

        var summary = new DashboardSummary
        {
            TotalNotes = notes.Count,
            PinnedNotes = notes.Count(n => n.IsPinned),
            GoalsByStatus = new Dictionary<string, int>
            {
                { "NotStarted", goals.Count(g => g.Status == GoalStatus.NotStarted) },
                { "InProgress", goals.Count(g => g.Status == GoalStatus.InProgress) },
                { "Completed", goals.Count(g => g.Status == GoalStatus.Completed) }
            },
            UpcomingDeadlines = deadlines
                .Where(d => !d.IsCompleted && d.DueDate >= today && d.DueDate <= nextWeek)
                .Take(5)
                .ToList(),
            TodaysRoutines = routines
                .Where(r => r.IsActive && ShouldRunToday(r))
                .Select(r => new RoutineSummary
                {
                    Id = r.Id,
                    Title = r.Title,
                    IsCompletedToday = r.CompletionLog.Any(d => d.Date == today),
                    Streak = r.Streak
                })
                .ToList(),
            LatestThoughts = thoughts.Take(3).ToList(),
            CurrentStreaks = routines
                .Where(r => r.Streak > 0)
                .OrderByDescending(r => r.Streak)
                .Take(3)
                .Select(r => new StreakInfo
                {
                    RoutineTitle = r.Title,
                    Streak = r.Streak
                })
                .ToList()
        };

        return Ok(summary);
    }

    private bool ShouldRunToday(Routine routine)
    {
        if (routine.Frequency == Frequency.Daily)
            return true;

        if (routine.Frequency == Frequency.Weekly && routine.DaysOfWeek.Contains(DateTime.UtcNow.DayOfWeek))
            return true;

        return false;
    }
}

public class DashboardSummary
{
    public int TotalNotes { get; set; }
    public int PinnedNotes { get; set; }
    public Dictionary<string, int> GoalsByStatus { get; set; } = new();
    public List<Deadline> UpcomingDeadlines { get; set; } = new();
    public List<RoutineSummary> TodaysRoutines { get; set; } = new();
    public List<Thought> LatestThoughts { get; set; } = new();
    public List<StreakInfo> CurrentStreaks { get; set; } = new();
}

public class RoutineSummary
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool IsCompletedToday { get; set; }
    public int Streak { get; set; }
}

public class StreakInfo
{
    public string RoutineTitle { get; set; } = string.Empty;
    public int Streak { get; set; }
}
