using System.Text.Json;

namespace LifeOS.API.Services;

public class JsonStorageService<T> where T : class
{
    private readonly string _filePath;
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    private readonly JsonSerializerOptions _jsonOptions;

    public JsonStorageService()
    {
        var dataDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Data");
        var fileName = $"{typeof(T).Name.ToLower()}s.json";
        _filePath = Path.Combine(dataDirectory, fileName);

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
            Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
        };

        // Ensure file exists
        if (!File.Exists(_filePath))
        {
            File.WriteAllText(_filePath, "[]");
        }
    }

    public async Task<List<T>> GetAllAsync()
    {
        await _semaphore.WaitAsync();
        try
        {
            var json = await File.ReadAllTextAsync(_filePath);
            return JsonSerializer.Deserialize<List<T>>(json, _jsonOptions) ?? new List<T>();
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<T?> GetByIdAsync(string id)
    {
        var items = await GetAllAsync();
        var idProperty = typeof(T).GetProperty("Id");
        
        if (idProperty == null)
            return null;

        return items.FirstOrDefault(item =>
        {
            var itemId = idProperty.GetValue(item)?.ToString();
            return itemId == id;
        });
    }

    public async Task<T> AddAsync(T item)
    {
        await _semaphore.WaitAsync();
        try
        {
            // Read directly instead of calling GetAllAsync to avoid deadlock
            var json = await File.ReadAllTextAsync(_filePath);
            var items = JsonSerializer.Deserialize<List<T>>(json, _jsonOptions) ?? new List<T>();
            
            // Set Id if not already set
            var idProperty = typeof(T).GetProperty("Id");
            if (idProperty != null)
            {
                var currentId = idProperty.GetValue(item)?.ToString();
                if (string.IsNullOrEmpty(currentId))
                {
                    idProperty.SetValue(item, Guid.NewGuid().ToString());
                }
            }

            items.Add(item);
            await SaveAllAsync(items);
            return item;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<T?> UpdateAsync(string id, T updatedItem)
    {
        await _semaphore.WaitAsync();
        try
        {
            // Read directly to avoid deadlock
            var json = await File.ReadAllTextAsync(_filePath);
            var items = JsonSerializer.Deserialize<List<T>>(json, _jsonOptions) ?? new List<T>();
            var idProperty = typeof(T).GetProperty("Id");
            
            if (idProperty == null)
                return null;

            var index = items.FindIndex(item =>
            {
                var itemId = idProperty.GetValue(item)?.ToString();
                return itemId == id;
            });

            if (index == -1)
                return null;

            // Ensure the updated item retains the same ID
            idProperty.SetValue(updatedItem, id);
            items[index] = updatedItem;
            await SaveAllAsync(items);
            return updatedItem;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await _semaphore.WaitAsync();
        try
        {
            // Read directly to avoid deadlock
            var json = await File.ReadAllTextAsync(_filePath);
            var items = JsonSerializer.Deserialize<List<T>>(json, _jsonOptions) ?? new List<T>();
            var idProperty = typeof(T).GetProperty("Id");
            
            if (idProperty == null)
                return false;

            var itemToRemove = items.FirstOrDefault(item =>
            {
                var itemId = idProperty.GetValue(item)?.ToString();
                return itemId == id;
            });

            if (itemToRemove == null)
                return false;

            items.Remove(itemToRemove);
            await SaveAllAsync(items);
            return true;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    private async Task SaveAllAsync(List<T> items)
    {
        var json = JsonSerializer.Serialize(items, _jsonOptions);
        await File.WriteAllTextAsync(_filePath, json);
    }

    public async Task<List<T>> GetByUserIdAsync(string userId)
    {
        var items = await GetAllAsync();
        var userIdProperty = typeof(T).GetProperty("UserId");
        
        if (userIdProperty == null)
            return items;

        return items.Where(item =>
        {
            var itemUserId = userIdProperty.GetValue(item)?.ToString();
            return itemUserId == userId;
        }).ToList();
    }
}