# ShareCrop - Smart Agriculture Platform
A modern React-based web application for connecting farmers and buyers in a digital marketplace for agricultural products and field rentals.

## 🌾 Features

- **Interactive Farm Map**: Explore farms and fields on an interactive Mapbox-powered map
- **Dual User Roles**: 
  - **Farmers**: Create and manage fields, list products, handle orders
  - **Buyers**: Browse and purchase agricultural products, rent fields

**FARMERS HAVE THE HAVE PRIVILEGES AS BUYERS TOO**
- **Real-time Search**: Search for farms, products, and locations with live results
- **Field Management**: Create, edit, and manage agricultural fields with precise location data
- **Order System**: Complete order management with notifications and tracking
- **Responsive Design**: Modern Material-UI components with mobile-friendly design
- **Persistent Storage**: Local storage for data persistence across sessions

## 🚀 Quick Start

### Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (version 16.0 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/hadiaramzan2199/Share-Crop-MERN-App.git
   cd Share-Crop-MERN-App
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory and add your Mapbox access token:
   ```env
   REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   ```
   
   **To get a Mapbox token:**
   - Visit [Mapbox](https://www.mapbox.com/)
   - Create a free account
   - Go to your account dashboard
   - Create a new access token
   - Copy and paste it in the `.env` file

4. **Start the Development Server**
   ```bash
   npm start
   ```

5. **Open Your Browser**
   
   The application will automatically open at `http://localhost:3000`

## 🔧 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (⚠️ irreversible)

## 👥 User Accounts

The application comes with pre-configured test accounts:

### Farmer Account

### Buyer Account

## 🗺️ Using the Application

### For Farmers:
1. **Create Fields**: Click "Add New Field" on the map to create agricultural fields
2. **Set Location**: Use the location picker to set precise coordinates
3. **Add Products**: Fill in product details, pricing, and harvest information
4. **Manage Orders**: View and process incoming orders from buyers

### For Buyers:
1. **Browse Map**: Explore available fields and products on the interactive map
2. **Search**: Use the search bar to find specific products or locations
3. **Purchase**: Click on products to view details and make purchases
4. **Track Orders**: Monitor your order history and status

## 🛠️ Technology Stack

- **Frontend Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **Mapping**: Mapbox GL JS with react-map-gl
- **Routing**: React Router DOM
- **State Management**: React Hooks (useState, useEffect)
- **Storage**: localStorage for data persistence
- **Styling**: CSS-in-JS with Material-UI styling system
- **Icons**: Material-UI Icons
- **Build Tool**: Create React App
```

## 🔧 Configuration

### Mapbox Setup
1. Sign up at [Mapbox](https://www.mapbox.com/)
2. Create an access token
3. Add it to your `.env` file as `REACT_APP_MAPBOX_ACCESS_TOKEN`

### Storage Configuration
The app uses localStorage for data persistence. Data includes:
- User authentication
- Created fields and farms
- Orders and transactions
- User preferences

## 🐛 Troubleshooting

### Common Issues:

1. **Map not loading**
   - Check if your Mapbox token is correctly set in `.env`
   - Ensure the token has the necessary permissions

2. **Application won't start**
   - Run `npm install` to ensure all dependencies are installed
   - Check Node.js version (should be 16+)

3. **Search not working**
   - Clear browser localStorage and refresh
   - Check browser console for any JavaScript errors

4. **Fields not appearing**
   - Make sure you're logged in as the correct user type
   - Check if the field was created successfully in localStorage

### Clearing Data
To reset the application data:
```javascript
// Open browser console and run:
localStorage.clear();
// Then refresh the page
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Contact the development team

## 🚀 Deployment

### Automatic Deployment (Recommended)

This project uses **GitHub Actions** for automatic deployment to Netlify.

🔥 **Every push to `main` automatically deploys to production!**

#### Setup Instructions

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions.

**Quick Setup:**
1. Create a Netlify account and site
2. Get your Netlify auth token and site ID
3. Add them as GitHub secrets (`NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`)
4. Push to `main` - deployment happens automatically!

#### Features
- ✅ **Automatic deployments** on push to main
- ✅ **Preview deployments** for pull requests
- ✅ **Build status** indicators in GitHub
- ✅ **Fast deployment** (1-2 minutes)
- ✅ Free hosting with Netlify

### Manual Deployment

#### Building for Production
```bash
npm run build
```

This creates a `build` folder with optimized production files.

#### Manual Netlify Deployment
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=build
```

### 🔧 Deployment Configuration
The project includes:
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `_redirects` - SPA routing support for Netlify

For troubleshooting and advanced configuration, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

**Happy Farming! 🌱**
