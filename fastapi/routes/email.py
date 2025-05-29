from fastapi.routing import APIRouter
from fastapi import HTTPException, Body, Request
from services.email_service import EmailGenerator
from models.email import SendIndividualEmailRequest, SendBulkEmailRequest
import os

router = APIRouter()

@router.post("/send-email/individual")
async def send_individual_email(payload: SendIndividualEmailRequest):
    try:
        if not payload.ranked_resumes:
            raise HTTPException(status_code=400, detail="No ranked resumes provided")

        if not (0 <= payload.candidate_index < len(payload.ranked_resumes)):
            raise HTTPException(status_code=400, detail="Invalid candidate index")

        candidate_data = payload.ranked_resumes[payload.candidate_index]
        candidate_profile = candidate_data.get("full_resume")

        sender_email = payload.sender_email or os.getenv("SENDER_EMAIL")
        password = payload.password or os.getenv("SENDER_PASSWORD")

        if not sender_email or not password:
            raise HTTPException(status_code=400, detail="Sender email and password must be provided")

        if not candidate_profile or "email" not in candidate_profile.get("contact_info", {}):
            raise HTTPException(status_code=400, detail="Candidate profile or email not available")

        # Initialize email generator
        email_gen = EmailGenerator()

        success = email_gen.send_assignment_email(
            sender_email=sender_email,
            receiver_email=candidate_profile["contact_info"]["email"],
            password=password,
            candidate_profile=candidate_profile,
            job_description=payload.job_description,
            project_options=payload.project_options,
            company_info=payload.company_info
        )

        if success:
            return {
                "status": "success",
                "message": f"Email sent successfully to {candidate_profile['contact_info']['full_name']}"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending individual email: {str(e)}")


@router.post("/send-email/bulk")
async def send_bulk_emails(payload: SendBulkEmailRequest):
    try:
        if not payload.ranked_resumes:
            raise HTTPException(status_code=400, detail="No ranked resumes provided")

        sender_email = payload.sender_email or os.getenv("SENDER_EMAIL")
        password = payload.password or os.getenv("SENDER_PASSWORD")

        if not sender_email or not password:
            raise HTTPException(status_code=400, detail="Sender email and password must be provided")

        email_gen = EmailGenerator()

        results = {}
        for idx, candidate_data in enumerate(payload.ranked_resumes):
            candidate_profile = candidate_data.get("full_resume")
            if not candidate_profile or "email" not in candidate_profile.get("contact_info", {}):
                results[f"candidate_{idx}"] = {
                    "status": "failed",
                    "message": "Missing profile or email"
                }
                continue

            success = email_gen.send_assignment_email(
                sender_email=sender_email,
                receiver_email=candidate_profile["contact_info"]["email"],
                password=password,
                candidate_profile=candidate_profile,
                job_description=payload.job_description,
                project_options=payload.project_options,
                company_info=payload.company_info
            )

            results[f"candidate_{idx}"] = {
                "status": "success" if success else "failed",
                "message": f"Email {'sent successfully' if success else 'failed to send'} to {candidate_profile['contact_info']['full_name']}"
            }

        successful_sends = sum(1 for r in results.values() if r["status"] == "success")
        total_candidates = len(payload.ranked_resumes)

        return {
            "status": "completed",
            "summary": f"Sent emails to {successful_sends} out of {total_candidates} candidates",
            "detailed_results": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending bulk emails: {str(e)}")