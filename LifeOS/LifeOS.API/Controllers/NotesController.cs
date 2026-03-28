using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeOS.API.Models;
using LifeOS.API.Services;
using System.Security.Claims;

namespace LifeOS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private readonly NotesService _notesService;

    public NotesController(NotesService notesService)
    {
        _notesService = notesService;
    }

    private string GetUserId()
    {
        return User.FindFirst("userId")?.Value 
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? string.Empty;
    }

    /// <summary>
    /// Get all notes for the logged-in user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<Note>>> GetAll()
    {
        var userId = GetUserId();
        var notes = await _notesService.GetAllNotesAsync(userId);
        return Ok(notes);
    }

    /// <summary>
    /// Get a specific note by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Note>> GetById(string id)
    {
        var userId = GetUserId();
        var note = await _notesService.GetNoteByIdAsync(id, userId);
        
        if (note == null)
            return NotFound(new { message = "Note not found" });

        return Ok(note);
    }

    /// <summary>
    /// Create a new note
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Note>> Create([FromBody] Note note)
    {
        var userId = GetUserId();
        var createdNote = await _notesService.CreateNoteAsync(note, userId);
        return CreatedAtAction(nameof(GetById), new { id = createdNote.Id }, createdNote);
    }

    /// <summary>
    /// Update an existing note
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<Note>> Update(string id, [FromBody] Note note)
    {
        var userId = GetUserId();
        var updatedNote = await _notesService.UpdateNoteAsync(id, note, userId);
        
        if (updatedNote == null)
            return NotFound(new { message = "Note not found" });

        return Ok(updatedNote);
    }

    /// <summary>
    /// Delete a note
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var userId = GetUserId();
        var success = await _notesService.DeleteNoteAsync(id, userId);
        
        if (!success)
            return NotFound(new { message = "Note not found" });

        return NoContent();
    }

    /// <summary>
    /// Toggle pin status of a note
    /// </summary>
    [HttpPatch("{id}/pin")]
    public async Task<ActionResult<Note>> TogglePin(string id)
    {
        var userId = GetUserId();
        var note = await _notesService.TogglePinAsync(id, userId);
        
        if (note == null)
            return NotFound(new { message = "Note not found" });

        return Ok(note);
    }
}
