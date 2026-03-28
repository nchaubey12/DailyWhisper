# LifeOS Quick Start Guide

## ⚡ Get Running in 5 Minutes

### Step 1: Start the Backend API

```bash
cd LifeOS/LifeOS.API
dotnet run
```

The API will start at `https://localhost:7001`

✅ You should see: `Now listening on: https://localhost:7001`

### Step 2: Update Frontend API URL

Open `LifeOS/LifeOS.Web/js/api.js` and ensure the URL matches your backend:

```javascript
const API_BASE_URL = 'https://localhost:7001/api';
```

### Step 3: Serve the Frontend

**Option A: Using Python (Easiest)**
```bash
cd LifeOS/LifeOS.Web
python -m http.server 8080
```
Then open: http://localhost:8080/pages/login.html

**Option B: Using VS Code Live Server**
- Install "Live Server" extension in VS Code
- Right-click `LifeOS.Web/pages/login.html`
- Select "Open with Live Server"

**Option C: Using Node.js**
```bash
npx http-server LifeOS/LifeOS.Web -p 8080
```
Then open: http://localhost:8080/pages/login.html

### Step 4: Create Your Account

1. Click "Sign up" on the login page
2. Enter a username, email, and password (min 6 characters)
3. Click "Create Account"
4. You'll be automatically logged in!

### Step 5: Explore!

- 📊 **Dashboard** - See your productivity overview
- 📝 **Notes** - Create color-coded notes with tags
- 🎯 **Goals** - Track progress toward your objectives
- ⏰ **Deadlines** - Never miss an important date
- 🔁 **Routines** - Build habits with streak tracking
- 💭 **Thoughts** - Journal with mood tracking

## 🎨 Bonus: Try Dark Mode

Click the 🌙 icon in the top-right corner!

## 🐛 Troubleshooting

### Backend won't start?
- Make sure you have .NET 8.0 SDK installed: `dotnet --version`
- Run `dotnet restore` in the LifeOS.API folder

### Frontend can't connect to API?
- Check the browser console (F12) for errors
- Verify the API URL in `LifeOS.Web/js/api.js` matches your backend
- Make sure the backend is running

### CORS errors?
- The backend allows `localhost:3000`, `localhost:5000`, and `localhost:8080`
- If using a different port, add it to `Program.cs` CORS policy

### Can't login after registering?
- Check the browser console for errors
- Open `https://localhost:7001` to verify API is running
- Check `LifeOS.API/Data/users.json` to see if user was created

## 📚 Next Steps

1. Read the full README.md for detailed documentation
2. Explore the Swagger UI at `https://localhost:7001`
3. Customize the theme colors in `LifeOS.Web/css/themes.css`
4. Add your own features!

## 💡 Tips

- All data is stored in `LifeOS.API/Data/*.json` files
- You can delete these files to reset all data
- Press F12 in the browser to see network requests and debug
- The JWT token is stored in localStorage

---

**Need help?** Check the full README.md or inspect the browser console for errors.
