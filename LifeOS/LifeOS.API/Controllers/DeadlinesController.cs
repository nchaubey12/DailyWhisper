using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeOS.API.Models;
using LifeOS.API.Services;
using System.Security.Claims;

namespace LifeOS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DeadlinesController : ControllerBase
{
    private readonly DeadlinesService _deadlinesService;

    public DeadlinesController(DeadlinesService deadlinesService)
    {
        _deadlinesService = deadlinesService;
    }

    private string GetUserId()
    {
        return User.FindFirst("userId")?.Value 
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? string.Empty;
    }

    [HttpGet]
    public async Task<ActionResult<List<Deadline>>> GetAll()
    {
        var userId = GetUserId();
        var deadlines = await _deadlinesService.GetAllDeadlinesAsync(userId);
        return Ok(deadlines);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Deadline>> GetById(string id)
    {
        var userId = GetUserId();
        var deadline = await _deadlinesService.GetDeadlineByIdAsync(id, userId);
        
        if (deadline == null)
            return NotFound(new { message = "Deadline not found" });

        return Ok(deadline);
    }

    [HttpPost]
    public async Task<ActionResult<Deadline>> Create([FromBody] Deadline deadline)
    {
        var userId = GetUserId();
        var createdDeadline = await _deadlinesService.CreateDeadlineAsync(deadline, userId);
        return CreatedAtAction(nameof(GetById), new { id = createdDeadline.Id }, createdDeadline);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Deadline>> Update(string id, [FromBody] Deadline deadline)
    {
        var userId = GetUserId();
        var updatedDeadline = await _deadlinesService.UpdateDeadlineAsync(id, deadline, userId);
        
        if (updatedDeadline == null)
            return NotFound(new { message = "Deadline not found" });

        return Ok(updatedDeadline);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var userId = GetUserId();
        var success = await _deadlinesService.DeleteDeadlineAsync(id, userId);
        
        if (!success)
            return NotFound(new { message = "Deadline not found" });

        return NoContent();
    }

    [HttpPatch("{id}/complete")]
    public async Task<ActionResult<Deadline>> ToggleComplete(string id)
    {
        var userId = GetUserId();
        var deadline = await _deadlinesService.ToggleCompleteAsync(id, userId);
        
        if (deadline == null)
            return NotFound(new { message = "Deadline not found" });

        return Ok(deadline);
    }
}
