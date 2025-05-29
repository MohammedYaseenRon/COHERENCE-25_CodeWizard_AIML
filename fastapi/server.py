from fastapi import FastAPI
from routes import analytics, bias, chat, email, file, interview, personnel, project, resume
from middleware.cors import setup_cors

app = FastAPI()

setup_cors(app)

app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(bias.router, prefix="/api/v1/bias", tags=["Bias"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(email.router, prefix="/api/v1/email", tags=["Email"])
app.include_router(file.router, prefix="/api/v1/file", tags=["File"])
app.include_router(interview.router, prefix="/api/v1/interview", tags=["Interview"])
app.include_router(personnel.router, prefix="/api/v1/personnel", tags=["Personnel"])
app.include_router(project.router, prefix="/api/v1/project", tags=["Project"])
app.include_router(resume.router, prefix="/api/v1/resume", tags=["Resume"])