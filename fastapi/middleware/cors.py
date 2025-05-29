from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app):
    """
    Configures and applies CORS middleware to the FastAPI application.
    """
    origins = [
        "http://localhost",
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:3000",
        # "*" # Be cautious with this in production; it allows all origins.
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

