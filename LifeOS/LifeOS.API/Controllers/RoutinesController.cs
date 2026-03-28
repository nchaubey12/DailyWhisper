using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeOS.API.Models;
using LifeOS.API.Services;
using System.Security.Claims;

namespace LifeOS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RoutinesController : ControllerBase
{
    private readonly RoutinesService _routinesService;

    public RoutinesController(RoutinesService routinesService)
    {
        _routinesService = routinesService;
    }

    private string GetUserId()
    {
        return User.FindFirst("userId")?.Value 
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? string.Empty;
    }

    [HttpGet]
    public async Task<ActionResult<List<Routine>>> GetAll()
    {
        var userId = GetUserId();
        var routines = await _routinesService.GetAllRoutinesAsync(userId);
        return Ok(routines);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Routine>> GetById(string id)
    {
        var userId = GetUserId();
        var routine = await _routinesService.GetRoutineByIdAsync(id, userId);
        
        if (routine == null)
            return NotFound(new { message = "Routine not found" });

        return Ok(routine);
    }

    [HttpPost]
    public async Task<ActionResult<Routine>> Create([FromBody] Routine routine)
    {
        var userId = GetUserId();
        var createdRoutine = await _routinesService.CreateRoutineAsync(routine, userId);
        return CreatedAtAction(nameof(GetById), new { id = createdRoutine.Id }, createdRoutine);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Routine>> Update(string id, [FromBody] Routine routine)
    {
        var userId = GetUserId();
        var updatedRoutine = await _routinesService.UpdateRoutineAsync(id, routine, userId);
        
        if (updatedRoutine == null)
            return NotFound(new { message = "Routine not found" });

        return Ok(updatedRoutine);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var userId = GetUserId();
        var success = await _routinesService.DeleteRoutineAsync(id, userId);
        
        if (!success)
            return NotFound(new { message = "Routine not found" });

        return NoContent();
    }

    [HttpPost("{id}/checkin")]
    public async Task<ActionResult<Routine>> CheckIn(string id)
    {
        var userId = GetUserId();
        var routine = await _routinesService.CheckInAsync(id, userId);
        
        if (routine == null)
            return NotFound(new { message = "Routine not found" });

        return Ok(routine);
    }
}
