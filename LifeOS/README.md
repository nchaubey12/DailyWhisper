# LifeOS - Personal Productivity Web Application

A full-stack personal productivity system built with ASP.NET Core and Vanilla JavaScript.

## 🏗️ Architecture

**Backend**: ASP.NET Core 8.0 MVC Web API
- JWT Bearer Authentication
- JSON file-based storage (Phase 1)
- Swagger/OpenAPI documentation
- RESTful API design

**Frontend**: Pure HTML5, CSS3, Vanilla JavaScript
- Responsive design (CSS Grid + Flexbox)
- Dark/light theme toggle
- No frameworks or libraries
- Modern ES6+ modules

## 📋 Features

- **Authentication**: JWT-based secure login and registration
- **Notes**: Create, edit, delete notes with colors, tags, and pinning
- **Goals**: Track goals with progress, milestones, and priorities
- **Deadlines**: Manage deadlines with due dates and completion tracking
- **Routines**: Build habits with streak tracking and daily check-ins
- **Thoughts**: Private journal entries with mood tracking
- **Dashboard**: Aggregated summary view of all modules

## 🚀 Getting Started

### Prerequisites

- .NET 8.0 SDK or later
- A code editor (Visual Studio, VS Code, or Rider)
- A web browser
- Optional: HTTP server for frontend (e.g., Live Server, Python's http.server)

### Backend Setup

1. **Navigate to the API project**:
   ```bash
   cd LifeOS/LifeOS.API
   ```

2. **Restore NuGet packages**:
   ```bash
   dotnet restore
   ```

3. **Run the application**:
   ```bash
   dotnet run
   ```

   The API will start at `https://localhost:7001` (or `http://localhost:5000`)

4. **Access Swagger UI**:
   Open your browser to `https://localhost:7001` to view the API documentation

### Frontend Setup

1. **Update API URL**:
   Open `LifeOS.Web/js/api.js` and update the `API_BASE_URL` constant to match your backend URL:
   ```javascript
   const API_BASE_URL = 'https://localhost:7001/api';
   ```

2. **Serve the frontend**:

   **Option A: Using VS Code Live Server**
   - Install the "Live Server" extension
   - Right-click on `LifeOS.Web/pages/login.html`
   - Select "Open with Live Server"

   **Option B: Using Python**
   ```bash
   cd LifeOS/LifeOS.Web
   python -m http.server 8080
   ```
   Then navigate to `http://localhost:8080/pages/login.html`

   **Option C: Using Node.js http-server**
   ```bash
   npx http-server LifeOS/LifeOS.Web -p 8080
   ```
   Then navigate to `http://localhost:8080/pages/login.html`

3. **Create an account**:
   - Navigate to the register page
   - Create your account
   - Login and start using LifeOS!

## 📁 Project Structure

```
LifeOS/
├── LifeOS.API/                 # Backend API
│   ├── Controllers/            # API Controllers
│   │   ├── AuthController.cs
│   │   ├── NotesController.cs
│   │   ├── GoalsController.cs
│   │   ├── DeadlinesController.cs
│   │   ├── RoutinesController.cs
│   │   ├── ThoughtsController.cs
│   │   └── DashboardController.cs
│   ├── Models/                 # Data models
│   ├── Services/               # Business logic
│   │   ├── JsonStorageService.cs
│   │   ├── AuthService.cs
│   │   └── [Module]Service.cs
│   ├── Data/                   # JSON storage files
│   └── Program.cs              # App configuration
│
└── LifeOS.Web/                 # Frontend
    ├── pages/                  # HTML pages
    │   ├── login.html
    │   ├── register.html
    │   ├── dashboard.html
    │   ├── notes.html
    │   └── [other pages].html
    ├── css/                    # Stylesheets
    │   ├── base.css
    │   ├── themes.css
    │   ├── layout.css
    │   └── components.css
    └── js/                     # JavaScript modules
        ├── api.js              # API client
        ├── auth.js             # Authentication
        ├── ui.js               # UI helpers
        └── [module].js         # Module scripts
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login

### Notes
- `GET /api/notes` - Get all notes
- `GET /api/notes/{id}` - Get single note
- `POST /api/notes` - Create note
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Delete note
- `PATCH /api/notes/{id}/pin` - Toggle pin

### Goals
- Full CRUD + `PATCH /api/goals/{id}/progress` - Update progress

### Deadlines
- Full CRUD + `PATCH /api/deadlines/{id}/complete` - Toggle complete

### Routines
- Full CRUD + `POST /api/routines/{id}/checkin` - Check in

### Thoughts
- Full CRUD + `GET /api/thoughts/mood-summary` - Get mood stats

### Dashboard
- `GET /api/dashboard/summary` - Get aggregated dashboard data

## 🎨 Customization

### Themes
The application supports light and dark themes. Edit `LifeOS.Web/css/themes.css` to customize colors.

### API URL
Change the backend URL in `LifeOS.Web/js/api.js`:
```javascript
const API_BASE_URL = 'your-api-url';
```

### JWT Secret
In production, set a secure JWT secret in `appsettings.json` or environment variables:
```json
{
  "Jwt": {
    "Key": "your-very-secure-secret-key-here",
    "Issuer": "LifeOS.API",
    "Audience": "LifeOS.Web"
  }
}
```

## 🔄 Future Enhancements (Phase 2)

- [ ] Migrate from JSON storage to SQL Server with Entity Framework Core
- [ ] Add search and filtering across all modules
- [ ] File attachments for notes
- [ ] Calendar view for deadlines
- [ ] Data export/import
- [ ] Email notifications for deadlines
- [ ] Mobile app (React Native or .NET MAUI)
- [ ] Collaboration features

## 📦 NuGet Packages Used

- `Swashbuckle.AspNetCore` - Swagger/OpenAPI
- `Microsoft.AspNetCore.Authentication.JwtBearer` - JWT authentication
- `BCrypt.Net-Next` - Password hashing
- `System.IdentityModel.Tokens.Jwt` - JWT token generation

## 🛠️ Development

### Adding a New Module

1. Create the model in `Models/`
2. Create the service in `Services/`
3. Create the controller in `Controllers/`
4. Register the service in `Program.cs`
5. Create the frontend page in `pages/`
6. Create the JavaScript module in `js/`

### Testing the API

Use the Swagger UI at `https://localhost:7001` or tools like Postman/Insomnia.

## 📝 License

This is a personal project scaffold. Feel free to use and modify as needed.

## 🤝 Contributing

This is a starting scaffold. To extend:
1. Follow the existing patterns
2. Maintain the separation of concerns
3. Keep the code clean and documented
4. Test your changes

## 📞 Support

For issues or questions:
- Check the Swagger documentation
- Review the browser console for frontend errors
- Check the terminal for backend errors
- Ensure CORS is configured correctly for your frontend URL

## ✅ Testing Checklist

- [ ] Backend runs without errors
- [ ] Swagger UI loads successfully
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Dashboard loads with summary data
- [ ] Can create, edit, and delete notes
- [ ] Theme toggle works
- [ ] Mobile responsive design works
- [ ] All API endpoints return expected data

---

**Built with ❤️ for productivity enthusiasts**
