using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeOS.API.Models;
using LifeOS.API.Services;
using System.Security.Claims;

namespace LifeOS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ThoughtsController : ControllerBase
{
    private readonly ThoughtsService _thoughtsService;

    public ThoughtsController(ThoughtsService thoughtsService)
    {
        _thoughtsService = thoughtsService;
    }

    private string GetUserId()
    {
        return User.FindFirst("userId")?.Value 
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? string.Empty;
    }

    [HttpGet]
    public async Task<ActionResult<List<Thought>>> GetAll()
    {
        var userId = GetUserId();
        var thoughts = await _thoughtsService.GetAllThoughtsAsync(userId);
        return Ok(thoughts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Thought>> GetById(string id)
    {
        var userId = GetUserId();
        var thought = await _thoughtsService.GetThoughtByIdAsync(id, userId);
        
        if (thought == null)
            return NotFound(new { message = "Thought not found" });

        return Ok(thought);
    }

    [HttpPost]
    public async Task<ActionResult<Thought>> Create([FromBody] Thought thought)
    {
        var userId = GetUserId();
        var createdThought = await _thoughtsService.CreateThoughtAsync(thought, userId);
        return CreatedAtAction(nameof(GetById), new { id = createdThought.Id }, createdThought);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Thought>> Update(string id, [FromBody] Thought thought)
    {
        var userId = GetUserId();
        var updatedThought = await _thoughtsService.UpdateThoughtAsync(id, thought, userId);
        
        if (updatedThought == null)
            return NotFound(new { message = "Thought not found" });

        return Ok(updatedThought);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var userId = GetUserId();
        var success = await _thoughtsService.DeleteThoughtAsync(id, userId);
        
        if (!success)
            return NotFound(new { message = "Thought not found" });

        return NoContent();
    }

    [HttpGet("mood-summary")]
    public async Task<ActionResult<Dictionary<string, int>>> GetMoodSummary()
    {
        var userId = GetUserId();
        var summary = await _thoughtsService.GetMoodSummaryAsync(userId);
        return Ok(summary);
    }
}
