using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeOS.API.Models;
using LifeOS.API.Services;
using System.Security.Claims;

namespace LifeOS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GoalsController : ControllerBase
{
    private readonly GoalsService _goalsService;

    public GoalsController(GoalsService goalsService)
    {
        _goalsService = goalsService;
    }

    private string GetUserId()
    {
        return User.FindFirst("userId")?.Value 
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? string.Empty;
    }

    [HttpGet]
    public async Task<ActionResult<List<Goal>>> GetAll()
    {
        var userId = GetUserId();
        var goals = await _goalsService.GetAllGoalsAsync(userId);
        return Ok(goals);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Goal>> GetById(string id)
    {
        var userId = GetUserId();
        var goal = await _goalsService.GetGoalByIdAsync(id, userId);
        
        if (goal == null)
            return NotFound(new { message = "Goal not found" });

        return Ok(goal);
    }

    [HttpPost]
    public async Task<ActionResult<Goal>> Create([FromBody] Goal goal)
    {
        var userId = GetUserId();
        var createdGoal = await _goalsService.CreateGoalAsync(goal, userId);
        return CreatedAtAction(nameof(GetById), new { id = createdGoal.Id }, createdGoal);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Goal>> Update(string id, [FromBody] Goal goal)
    {
        var userId = GetUserId();
        var updatedGoal = await _goalsService.UpdateGoalAsync(id, goal, userId);
        
        if (updatedGoal == null)
            return NotFound(new { message = "Goal not found" });

        return Ok(updatedGoal);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var userId = GetUserId();
        var success = await _goalsService.DeleteGoalAsync(id, userId);
        
        if (!success)
            return NotFound(new { message = "Goal not found" });

        return NoContent();
    }

    [HttpPatch("{id}/progress")]
    public async Task<ActionResult<Goal>> UpdateProgress(string id, [FromBody] ProgressUpdate update)
    {
        var userId = GetUserId();
        var goal = await _goalsService.UpdateProgressAsync(id, update.Progress, userId);
        
        if (goal == null)
            return NotFound(new { message = "Goal not found" });

        return Ok(goal);
    }
}

public class ProgressUpdate
{
    public int Progress { get; set; }
}
