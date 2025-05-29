from fastapi import APIRouter
from fastapi.responses import JSONResponse
from services.resume_service import ResumeService
import json

router = APIRouter()
service = ResumeService()

@router.get("/generate-chart-data")
async def generate_chart_data():
    """
    Generate aggregated chart data from all resumes and save to chart.json
    """
    try:
        service.load_results()
        
        if not service.analysis_results:
            return JSONResponse(
                status_code=404,
                content={"message": "No resume data available for analysis"}
            )
        
        chart_data = {
            "total_resumes": len(service.analysis_results),
            "total_skills": set(),
            "total_projects": 0,
            "skill_frequency": {},
            "education_levels": {},
            "experience_levels": {
                "Entry": 0,
                "Junior": 0,
                "Mid-level": 0,
                "Senior": 0,
                "Expert": 0
            },
            "common_technologies": {},
            "degree_types": {},
            "resumes": []
        }
        
        for filename, resume in service.analysis_results.items():
            try:
                if resume is None:
                    print(f"Warning: Skipping resume '{filename}' because its data is None.")
                    continue

                contact_info = resume.get("contact_info", {})
                skills_data = resume.get("skills", {})
                technical_skills = skills_data.get("technical_skills", [])
                projects_list = resume.get("projects", [])
                work_experience_list = resume.get("work_experience", [])
                education_list = resume.get("education", [])

                resume_info = {
                    "name": contact_info.get("full_name", "N/A"),
                    "skills_count": len(technical_skills),
                    "projects_count": len(projects_list),
                    "experience_count": len(work_experience_list),
                    "education": [],
                    "experience_level": None
                }

                project_count = len(projects_list)
                skill_count = len(technical_skills)
                work_exp_count = len(work_experience_list)
                experience_score = (project_count * 2) + (skill_count * 0.5) + (work_exp_count * 5)

                if experience_score >= 40:
                    experience_level = "Expert"
                elif experience_score >= 30:
                    experience_level = "Senior"
                elif experience_score >= 20:
                    experience_level = "Mid-level"
                elif experience_score >= 10:
                    experience_level = "Junior"
                else:
                    experience_level = "Entry"

                resume_info["experience_level"] = experience_level
                chart_data["experience_levels"][experience_level] += 1

                for edu in education_list:
                    degree = edu.get("degree")
                    if degree:
                        degree_type = degree.split(" in ")[0]
                        chart_data["degree_types"][degree_type] = chart_data["degree_types"].get(degree_type, 0) + 1
                    resume_info["education"].append({
                        "degree": edu.get("degree", "N/A"),
                        "institution": edu.get("institution", "N/A"),
                        "year": edu.get("graduation_year", "N/A")
                    })

                for skill in technical_skills:
                    chart_data["total_skills"].add(skill)
                    chart_data["skill_frequency"][skill] = chart_data["skill_frequency"].get(skill, 0) + 1

                chart_data["total_projects"] += len(projects_list)
                if projects_list:
                    for project in projects_list:
                        for tech in project.get("technologies", []): # Safely handle missing technologies
                            chart_data["common_technologies"][tech] = chart_data["common_technologies"].get(tech, 0) + 1

                chart_data["resumes"].append(resume_info)

            except Exception as e:
                print(f"Error processing resume '{filename}': {e}")

        chart_data["total_skills"] = len(chart_data["total_skills"])
        
        top_skills = sorted(
            chart_data["skill_frequency"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        top_tech = sorted(
            chart_data["common_technologies"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:8]
        
        final_chart_data = {
            "summary_stats": {
                "total_resumes": chart_data["total_resumes"],
                "total_skills": chart_data["total_skills"],
                "total_projects": chart_data["total_projects"]
            },
            "skills_data": {
                "top_skills": [{"name": skill, "count": count} for skill, count in top_skills],
                "skill_distribution": [
                    {
                        "name": "Frontend",
                        "value": sum(1 for skill in chart_data["skill_frequency"] 
                                     if any(tech in skill.lower() for tech in ["html", "css", "javascript", "react"]))
                    },
                    {
                        "name": "Backend",
                        "value": sum(1 for skill in chart_data["skill_frequency"] 
                                     if any(tech in skill.lower() for tech in ["node", "express", "python", "java", "spring"]))
                    },
                    {
                        "name": "DevOps",
                        "value": sum(1 for skill in chart_data["skill_frequency"] 
                                     if any(tech in skill.lower() for tech in ["docker", "kubernetes", "aws", "azure", "ci/cd"]))
                    },
                    {
                        "name": "Database",
                        "value": sum(1 for skill in chart_data["skill_frequency"] 
                                     if any(tech in skill.lower() for tech in ["sql", "mysql", "postgres", "mongodb", "redis"]))
                    }
                ]
            },
            "experience_data": [
                {"name": level, "value": count} 
                for level, count in chart_data["experience_levels"].items()
            ],
            "education_data": [
                {"name": degree, "count": count} 
                for degree, count in chart_data["degree_types"].items()
            ],
            "technology_data": {
                "top_technologies": [{"name": tech, "count": count} for tech, count in top_tech],
                "technology_distribution": [
                    {
                        "name": "Frontend",
                        "value": sum(1 for tech in chart_data["common_technologies"] 
                                     if any(t in tech.lower() for t in ["html", "css", "javascript", "react"]))
                    },
                    {
                        "name": "Backend",
                        "value": sum(1 for tech in chart_data["common_technologies"] 
                                     if any(t in tech.lower() for t in ["node", "express", "python", "java"]))
                    },
                    {
                        "name": "DevOps",
                        "value": sum(1 for tech in chart_data["common_technologies"] 
                                     if any(t in tech.lower() for t in ["docker", "kubernetes", "aws"]))
                    },
                    {
                        "name": "Database",
                        "value": sum(1 for tech in chart_data["common_technologies"] 
                                     if any(t in tech.lower() for t in ["sql", "mysql", "mongodb"]))
                    }
                ]
            },
            "resume_comparison": chart_data["resumes"]
        }

        with open("chart.json", "w") as f:
            json.dump(final_chart_data, f, indent=2)

        return JSONResponse(
        status_code=200,
        content={
            "message": "Chart data generated successfully",
            "chart_data": final_chart_data
        }
    )

    except Exception as e:
        return JSONResponse(
        status_code=500,
        content={"message": f"Error generating chart data: {str(e)}"}
    )