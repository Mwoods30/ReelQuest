# ReelQuest - Web Fishing Game

A modern web-based fishing game built with React and Vite.

## 🎮 Features

- Interactive fishing experience in your browser
- Modern React-based architecture
- Responsive design for all devices
- Built with Vite for fast development and optimized builds

## 🚀 Deployment

This project is configured for easy deployment to Netlify.

### Option 1: Deploy from Git Repository

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Connect your GitHub repository
5. Netlify will automatically detect the build settings from `netlify.toml`

### Option 2: Manual Deploy

1. Build the project locally:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to Netlify:
   - Go to [Netlify](https://netlify.com)
   - Drag and drop the `dist` folder to the deployment area

### Build Configuration

The project includes:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18
- **SPA Redirects**: Configured for proper routing

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📦 Project Structure

```
src/
  ├── App.jsx          # Main application component
  ├── App.css          # Application styles
  ├── main.jsx         # Application entry point
  └── index.css        # Global styles
public/
  ├── _redirects       # Netlify redirect rules
  └── fishing.png      # Favicon
netlify.toml           # Netlify deployment configuration
```

## 🎯 MVP Features (Release 1)

- [x] Fishing Mechanics: Cast, reel and catch fish
- [x] Multiple Fish Species: 3+ different fish types
- [x] Game Environment: Single fishing environment
- [ ] Collection System: Track caught fish and rarity
- [ ] Progression System: Level-based unlocks
- [ ] Persistence: Save/load between sessions

## 👥 Development Team

- Matthew Woods
- Ryan McKearnin  
- Tyler Klimczak
- Willow Iloka

## 📄 License

This project is private and proprietary.
