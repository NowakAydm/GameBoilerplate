# MongoDB Setup Instructions

## Quick Setup for Testing Admin Dashboard

### Option 1: Install MongoDB locally (Recommended for full functionality)

1. **Download MongoDB Community Server:**
   - Visit: https://www.mongodb.com/try/download/community
   - Download the Windows version
   - Install with default settings

2. **Start MongoDB:**
   ```bash
   # Option A: Start as Windows Service (during installation)
   # MongoDB will start automatically
   
   # Option B: Start manually
   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
   ```

3. **Create data directory (if needed):**
   ```bash
   mkdir C:\data\db
   ```

### Option 2: Use MongoDB Atlas (Cloud Database)

1. **Create free MongoDB Atlas account:**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Create a free cluster

2. **Get connection string:**
   - In Atlas dashboard, click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

3. **Update environment variables:**
   ```bash
   # In packages/server/.env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/gameboilerplate?retryWrites=true&w=majority
   ```

### Option 3: Docker (Alternative)

```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option 4: Quick Test Mode (No Database)

For testing the admin dashboard without setting up MongoDB, we can run in mock mode:

```bash
cd packages/server
npm run dev:mock
```

## After MongoDB is Running

1. **Start the server:**
   ```bash
   cd packages/server
   npm run dev
   ```

2. **Create an admin user:**
   ```bash
   # Use the client to register, then manually set role to 'admin' in MongoDB
   # OR use the registration endpoint and update the user role
   ```

3. **Start the admin dashboard:**
   ```bash
   cd packages/admin  
   npm run dev
   ```

## Troubleshooting

- **Connection refused:** Ensure MongoDB is running on port 27017
- **Permission errors:** Run with administrator privileges
- **Port conflicts:** Check if another service is using port 27017
