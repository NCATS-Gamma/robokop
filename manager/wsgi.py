"""
Simple gunicorn launcher for server.py
"""

from manager.server import app

if __name__ == "__main__":
    app.run()
