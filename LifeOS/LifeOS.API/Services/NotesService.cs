using LifeOS.API.Models;

namespace LifeOS.API.Services;

public class NotesService
{
    private readonly JsonStorageService<Note> _storage;

    public NotesService(JsonStorageService<Note> storage)
    {
        _storage = storage;
    }

    public async Task<List<Note>> GetAllNotesAsync(string userId)
    {
        var notes = await _storage.GetByUserIdAsync(userId);
        return notes.OrderByDescending(n => n.IsPinned)
                   .ThenByDescending(n => n.UpdatedAt)
                   .ToList();
    }

    public async Task<Note?> GetNoteByIdAsync(string id, string userId)
    {
        var note = await _storage.GetByIdAsync(id);
        
        if (note == null || note.UserId != userId)
            return null;

        return note;
    }

    public async Task<Note> CreateNoteAsync(Note note, string userId)
    {
        note.Id = Guid.NewGuid().ToString();
        note.UserId = userId;
        note.CreatedAt = DateTime.UtcNow;
        note.UpdatedAt = DateTime.UtcNow;

        return await _storage.AddAsync(note);
    }

    public async Task<Note?> UpdateNoteAsync(string id, Note updatedNote, string userId)
    {
        var existingNote = await _storage.GetByIdAsync(id);
        
        if (existingNote == null || existingNote.UserId != userId)
            return null;

        updatedNote.Id = id;
        updatedNote.UserId = userId;
        updatedNote.CreatedAt = existingNote.CreatedAt;
        updatedNote.UpdatedAt = DateTime.UtcNow;

        return await _storage.UpdateAsync(id, updatedNote);
    }

    public async Task<bool> DeleteNoteAsync(string id, string userId)
    {
        var note = await _storage.GetByIdAsync(id);
        
        if (note == null || note.UserId != userId)
            return false;

        return await _storage.DeleteAsync(id);
    }

    public async Task<Note?> TogglePinAsync(string id, string userId)
    {
        var note = await _storage.GetByIdAsync(id);
        
        if (note == null || note.UserId != userId)
            return null;

        note.IsPinned = !note.IsPinned;
        note.UpdatedAt = DateTime.UtcNow;

        return await _storage.UpdateAsync(id, note);
    }
}
