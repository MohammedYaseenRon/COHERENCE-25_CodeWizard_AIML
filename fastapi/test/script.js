document.addEventListener('DOMContentLoaded', () => {
    const jobDescriptionTextarea = document.getElementById('job-description');
    const additionalNotesTextarea = document.getElementById('additional-notes');
    const resumeUpload = document.getElementById('resume-upload');
    const analyzeBtn = document.getElementById('analyze-btn');
    const fileList = document.getElementById('file-list');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const resultsBody = document.getElementById('results-body');

    let selectedFiles = [];
    let websocket = null;

    // File upload handling
    resumeUpload.addEventListener('change', (e) => {
        const newFiles = Array.from(e.target.files);
        
        newFiles.forEach(file => {
            // Prevent duplicate files
            if (!selectedFiles.some(f => f.name === file.name)) {
                selectedFiles.push(file);
                
                const fileTag = document.createElement('div');
                fileTag.classList.add('file-tag');
                fileTag.innerHTML = `
                    ${file.name}
                    <span class="remove-file">✖</span>
                `;
                
                fileTag.querySelector('.remove-file').addEventListener('click', () => {
                    selectedFiles = selectedFiles.filter(f => f.name !== file.name);
                    fileTag.remove();
                    checkFormValidity();
                });
                
                fileList.appendChild(fileTag);
            }
        });

        checkFormValidity();
    });

    function checkFormValidity() {
        const isJobDescriptionValid = jobDescriptionTextarea.value.trim() !== '';
        const hasResumes = selectedFiles.length > 0;
        
        analyzeBtn.disabled = !(isJobDescriptionValid && hasResumes);
    }

    jobDescriptionTextarea.addEventListener('input', checkFormValidity);

    // WebSocket Connection
    function connectWebSocket() {
        websocket = new WebSocket('ws://localhost:8000/ws/analyze-resumes');

        websocket.onopen = () => {
            console.log('WebSocket connection established');
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch(data.status) {
                case 'ready':
                    // Send job description and files
                    websocket.send(JSON.stringify({
                        job_description: jobDescriptionTextarea.value.trim(),
                        additional_notes: additionalNotesTextarea.value.trim()
                    }));

                    // Send files
                    selectedFiles.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            websocket.send(e.target.result);
                        };
                        reader.readAsArrayBuffer(file);
                    });

                    // Signal end of file transmission
                    websocket.send(JSON.stringify({type: 'file_upload_complete'}));
                    break;

                case 'processing':
                    progressBar.style.width = `${data.progress}%`;
                    progressText.textContent = data.message;
                    break;

                case 'complete':
                    displayResults(data.results);
                    break;

                case 'error':
                    alert(data.message);
                    break;
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            alert('WebSocket connection error');
        };

        websocket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }

    function displayResults(results) {
        resultsBody.innerHTML = '';
        progressText.textContent = 'Analysis Complete';

        results.forEach((result, index) => {
            const row = document.createElement('tr');
            row.classList.add(`rank-${result.rank}`);
            row.innerHTML = `
                <td>${result.rank}</td>
                <td>${result.resume_name}</td>
                <td>${result.jd_match.toFixed(2)}%</td>
                <td>${result.contextual_comments}</td>
            `;
            resultsBody.appendChild(row);
        });
    }

    // Analyze Button Event
    analyzeBtn.addEventListener('click', () => {
        // Reset previous results
        resultsBody.innerHTML = '';
        progressBar.style.width = '0%';
        progressText.textContent = '';

        connectWebSocket();
    });
});