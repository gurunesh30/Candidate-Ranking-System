import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load variables from the .env file into os.environ
load_dotenv()

# Fetch the connection string securely with a local safe fallback
MONGO_DETAILS = os.getenv("MONGO_URL", "mongodb://localhost:27017")

# Spin up the asynchronous client engine
client = AsyncIOMotorClient(MONGO_DETAILS)

# Define or automatically initialize your target application database
database = client.talent_context_db

# Yield the target collection wrapper directly
def get_leaderboard_collection():
    return database.get_collection("leaderboards")