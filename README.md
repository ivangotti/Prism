Okta Customer Identity Solution external user portal

A modern, professional user portal built with Node.js and Express that provides secure authentication using Okta's OIDC redirect flow. Users can view their applications, edit their profile, and manage their authenticators through a clean, responsive interface.

## Features

- **Secure Authentication**: Okta OIDC with JWT tokens and secure session management
- **Applications Dashboard**: View all assigned Okta applications
- **Profile Management**: Edit user profile information
- **Authenticator Settings**: Manage multi-factor authentication methods
- **Modern UI**: Professional design with Tailwind CSS
- **Responsive Design**: Mobile-friendly interface
- **Session Management**: Secure HTTP-only cookies with configurable expiration

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS templates, Tailwind CSS
- **Authentication**: Okta OIDC Middleware
- **API Client**: Axios, Okta SDK
- **Session**: express-session

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Okta developer account
- Okta application configured for OIDC

## Okta Configuration

### 1. Create an Okta Account
Sign up for a free Okta developer account at [https://developer.okta.com](https://developer.okta.com)

### 2. Create a Web Application
1. Log into your Okta dashboard
2. Navigate to **Applications** > **Applications**
3. Click **Create App Integration**
4. Select **OIDC - OpenID Connect**
5. Select **Web Application**
6. Configure the application:
   - **App integration name**: Prism (or your preferred name)
   - **Grant type**: Authorization Code
   - **Sign-in redirect URIs**: `http://localhost:3000/authorization-code/callback`
   - **Sign-out redirect URIs**: `http://localhost:3000`
   - **Assignments**: Select users or groups who can access the application

7. Save and note down:
   - **Client ID**
   - **Client Secret**
   - **Okta Domain** (e.g., dev-xxxxx.okta.com)

### 3. Configure API Scopes
1. Navigate to **Security** > **API**
2. Select your **default** authorization server
3. Go to **Scopes** tab
4. Ensure the following scopes are enabled:
   - `openid`
   - `profile`
   - `email`

### 4. (Optional) Create API Token
For advanced features like factor management, create an API token:
1. Navigate to **Security** > **API** > **Tokens**
2. Click **Create Token**
3. Name it "Prism API"
4. Save the token securely

## Installation

1. **Clone or download the repository**
   ```bash
   cd /path/to/Prism
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your Okta credentials**
   ```env
   OKTA_DOMAIN=dev-xxxxx.okta.com
   OKTA_CLIENT_ID=your_client_id_here
   OKTA_CLIENT_SECRET=your_client_secret_here
   OKTA_REDIRECT_URI=http://localhost:3000/authorization-code/callback
   SESSION_SECRET=your_random_secret_string_here
   PORT=3000
   NODE_ENV=development
   OKTA_API_TOKEN=your_okta_api_token_here
   ```

   **Important**:
   - Replace `dev-xxxxx.okta.com` with your actual Okta domain
   - Replace `your_client_id_here` with your Client ID from Okta
   - Replace `your_client_secret_here` with your Client Secret from Okta
   - Replace `your_okta_api_token_here` with your Okta API Token (from step 4 in Okta Configuration)
   - Generate a strong random string for `SESSION_SECRET` (e.g., use `openssl rand -base64 32`)

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Usage

1. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

2. **Login**
   - Click the login button
   - You'll be redirected to Okta's hosted login page
   - Enter your Okta credentials
   - After successful authentication, you'll be redirected back to the home page

3. **Navigate the portal**
   - **Applications**: View all your assigned Okta applications
   - **Profile**: View and edit your profile information
   - **Settings**: Manage your multi-factor authentication methods

4. **Logout**
   Click the logout button in the top navigation bar

## Project Structure

```
/
├── app.js                      # Main application entry point
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables (create from .env.example)
├── .env.example                # Environment variables template
├── middleware/
│   └── auth.js                 # Authentication middleware
├── routes/
│   ├── auth.js                 # Login, logout, callback routes
│   ├── index.js                # Home page (applications)
│   ├── profile.js              # Profile management
│   └── settings.js             # Authenticator settings
├── views/
│   ├── layouts/
│   │   └── main.ejs            # Main layout template
│   ├── home.ejs                # Applications listing
│   ├── profile.ejs             # Profile editing
│   ├── settings.ejs            # Authenticator management
│   └── error.ejs               # Error page
├── public/
│   ├── css/
│   │   └── styles.css          # Custom CSS
│   └── js/
│       └── main.js             # Client-side JavaScript
└── utils/
    └── okta.js                 # Okta API helper functions
```

## Security Considerations

- **Session Security**: Sessions use HTTP-only cookies and are configured for secure transmission in production
- **CSRF Protection**: Built-in session middleware provides CSRF protection
- **Token Storage**: JWT tokens are stored securely in server-side sessions, never exposed to client
- **Environment Variables**: Sensitive credentials stored in `.env` file (never commit to version control)
- **HTTPS**: Always use HTTPS in production environments
- **Session Expiration**: Sessions expire after 24 hours of inactivity

## Troubleshooting

### "OIDC Error" on startup
- Verify your Okta credentials in `.env` are correct
- Ensure your Okta domain includes `.okta.com` but not `https://`
- Check that your redirect URI matches exactly in both `.env` and Okta console

### Cannot fetch applications/profile
- Verify you're using the correct access token
- Check that your Okta application has the necessary API scopes
- Consider creating an API token for management operations

### Redirect URI mismatch
- Ensure the redirect URI in `.env` matches the one configured in Okta
- The format should be: `http://localhost:3000/authorization-code/callback`

### Session not persisting
- Verify `SESSION_SECRET` is set in `.env`
- Check that cookies are enabled in your browser
- In production, ensure `secure: true` is set for session cookies

## Production Deployment

Before deploying to production:

1. **Update environment variables**
   - Set `NODE_ENV=production`
   - Use production Okta domain and credentials
   - Update redirect URIs to production URLs
   - Generate a strong, unique `SESSION_SECRET`

2. **Configure Okta for production**
   - Add production redirect URIs to your Okta application
   - Update trusted origins in Okta dashboard

3. **Enable HTTPS**
   - Session cookies require HTTPS in production
   - Configure SSL/TLS certificates

4. **Security headers**
   - Consider adding helmet.js for security headers
   - Enable CORS policies as needed

## License

ISC

## Support

For issues related to:
- **Okta**: Visit [Okta Developer Forums](https://devforum.okta.com/)
- **This application**: Create an issue in the repository

## Contributing

Contributions are welcome! Please follow standard Git workflow:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
