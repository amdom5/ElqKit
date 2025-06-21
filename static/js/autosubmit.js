// AutoSubmit Tool JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeAutoSubmit();
});

function initializeAutoSubmit() {
    // Global variables
    let currentResults = null;
    let isProcessing = false;

    // DOM elements
    const form = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const currentRow = document.getElementById('currentRow');
    const resultsSection = document.getElementById('resultsSection');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const csvFileInput = document.getElementById('csv_file');

    // Initialize file upload area
    initializeFileUpload();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize form submission
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
    }
    
    // Initialize action buttons
    initializeActionButtons();

    /**
     * Initialize file upload drag and drop functionality
     */
    function initializeFileUpload() {
        if (!fileUploadArea || !csvFileInput) return;

        // Drag and drop events
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (validateFile(file)) {
                    csvFileInput.files = files;
                    updateFileUploadDisplay(file);
                }
            }
        });

        // File input change event
        csvFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (validateFile(file)) {
                    updateFileUploadDisplay(file);
                } else {
                    e.target.value = '';
                }
            }
        });
    }

    /**
     * Validate uploaded file
     */
    function validateFile(file) {
        // Check file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showToast('Only CSV files are allowed', 'error');
            return false;
        }

        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('File size must be less than 5MB', 'error');
            return false;
        }

        return true;
    }

    /**
     * Update file upload display
     */
    function updateFileUploadDisplay(file) {
        const fileUploadContent = fileUploadArea.querySelector('.file-upload-content');
        if (fileUploadContent) {
            fileUploadContent.innerHTML = `
                <svg class="file-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: var(--success-500);">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
                <p class="file-upload-text" style="color: var(--success-600);">${file.name}</p>
                <p class="file-upload-subtext">Size: ${ElqKit.formatFileSize(file.size)}</p>
            `;
            fileUploadArea.style.borderColor = 'var(--success-500)';
            fileUploadArea.style.backgroundColor = 'var(--success-50)';
        }
    }

    /**
     * Initialize form validation
     */
    function initializeFormValidation() {
        const siteIdInput = document.getElementById('site_id');
        const formNameInput = document.getElementById('elq_form_name');

        // Site ID validation - only numbers
        if (siteIdInput) {
            siteIdInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }

        // Real-time validation
        [siteIdInput, formNameInput, csvFileInput].forEach(input => {
            if (input) {
                input.addEventListener('blur', function() {
                    validateField(this);
                });
            }
        });
    }

    /**
     * Validate individual form field
     */
    function validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        switch (field.id) {
            case 'site_id':
                if (!value) {
                    isValid = false;
                    message = 'Site ID is required';
                } else if (!/^\d+$/.test(value)) {
                    isValid = false;
                    message = 'Site ID must contain only numbers';
                }
                break;
            case 'elq_form_name':
                if (!value) {
                    isValid = false;
                    message = 'elqFormName is required';
                }
                break;
            case 'csv_file':
                if (!field.files || field.files.length === 0) {
                    isValid = false;
                    message = 'Please select a CSV file';
                }
                break;
        }

        // Update field styling
        if (isValid) {
            field.style.borderColor = '';
            field.style.backgroundColor = '';
        } else {
            field.style.borderColor = 'var(--error-500)';
            field.style.backgroundColor = 'var(--error-50)';
        }

        return { isValid, message };
    }

    /**
     * Validate entire form
     */
    function validateForm() {
        const siteId = document.getElementById('site_id');
        const formName = document.getElementById('elq_form_name');
        const file = document.getElementById('csv_file');

        const fields = [siteId, formName, file];
        let isValid = true;
        let errors = [];

        fields.forEach(field => {
            if (field) {
                const validation = validateField(field);
                if (!validation.isValid) {
                    isValid = false;
                    errors.push(validation.message);
                }
            }
        });

        return { isValid, errors };
    }

    /**
     * Handle form submission
     */
    async function handleFormSubmission(e) {
        e.preventDefault();
        
        if (isProcessing) return;
        
        const validation = validateForm();
        if (!validation.isValid) {
            showError(validation.errors.join('. '));
            return;
        }

        isProcessing = true;
        updateSubmitButton(true);
        showProgress();

        try {
            const formData = new FormData(form);
            
            const response = await fetch('/autosubmit/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                updateProgress(data.summary.total_rows, data.summary.total_rows, 'Processing completed!');
                setTimeout(() => showResults(data), 500);
                showToast(`Processing completed: ${data.summary.successful_requests}/${data.summary.total_rows} successful`, 'success');
            } else {
                showError(data.error || 'An error occurred during processing');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Network error occurred. Please check your connection and try again.');
        } finally {
            isProcessing = false;
            updateSubmitButton(false);
        }
    }

    /**
     * Update submit button state
     */
    function updateSubmitButton(processing) {
        if (!submitBtn) return;

        submitBtn.disabled = processing;
        
        if (processing) {
            submitBtn.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 1s linear infinite;">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Processing...
            `;
        } else {
            submitBtn.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Upload and Process
            `;
        }
    }

    /**
     * Show error message
     */
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        hideAllSections();
        if (errorSection) {
            errorSection.classList.remove('hidden');
        }
        showToast(message, 'error');
    }

    /**
     * Hide all sections
     */
    function hideAllSections() {
        [progressSection, resultsSection, errorSection].forEach(section => {
            if (section) {
                section.classList.add('hidden');
            }
        });
    }

    /**
     * Show progress section
     */
    function showProgress() {
        hideAllSections();
        if (progressSection) {
            progressSection.classList.remove('hidden');
        }
        if (progressText) {
            progressText.textContent = 'Uploading file and starting processing...';
        }
        if (currentRow) {
            currentRow.textContent = '';
        }
        if (progressFill) {
            progressFill.style.width = '0%';
        }
    }

    /**
     * Update progress
     */
    function updateProgress(current, total, message = '') {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        if (message && progressText) {
            progressText.textContent = message;
        }
        
        if (current > 0 && total > 0 && currentRow) {
            currentRow.textContent = `Processing row ${current} of ${total}`;
        }
    }

    /**
     * Show results section
     */
    function showResults(data) {
        currentResults = data;
        hideAllSections();
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
        }
        
        populateSummaryStats(data.summary);
        populateDetailedResults(data.results);
    }

    /**
     * Populate summary statistics
     */
    function populateSummaryStats(summary) {
        const summaryStats = document.getElementById('summaryStats');
        if (!summaryStats) return;

        summaryStats.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${summary.total_rows}</div>
                <div class="stat-label">Total Rows</div>
            </div>
            <div class="stat-item success">
                <div class="stat-value">${summary.successful_requests}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-item ${summary.failed_requests > 0 ? 'error' : ''}">
                <div class="stat-value">${summary.failed_requests}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${summary.success_rate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${summary.total_processing_time}s</div>
                <div class="stat-label">Total Time</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${summary.average_processing_time}s</div>
                <div class="stat-label">Avg. Time/Row</div>
            </div>
        `;
    }

    /**
     * Populate detailed results
     */
    function populateDetailedResults(results) {
        const resultsList = document.getElementById('resultsList');
        if (!resultsList) return;

        resultsList.innerHTML = results.map(result => {
            const statusClass = result.success ? 'success' : 'error';
            const statusText = result.success ? 'Success' : 'Failed';
            const statusCode = result.status_code ? ` (${result.status_code})` : '';
            const errorInfo = result.error ? `<div class="error-detail">Error: ${result.error}</div>` : '';
            
            return `
                <div class="result-item ${statusClass}">
                    <div class="result-header">
                        <span class="row-number">Row ${result.row_number}</span>
                        <span class="status">${statusText}${statusCode}</span>
                        <span class="timing">${result.processing_time}s</span>
                    </div>
                    <div class="result-details">
                        <div>Parameters: ${result.parameters_count}</div>
                        ${result.response_size ? `<div>Response: ${result.response_size} bytes</div>` : ''}
                        ${result.url ? `<div style="word-break: break-all;">URL: ${result.url.substring(0, 100)}${result.url.length > 100 ? '...' : ''}</div>` : ''}
                        ${errorInfo}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Initialize action buttons
     */
    function initializeActionButtons() {
        const downloadBtn = document.getElementById('downloadLog');
        const processAnotherBtn = document.getElementById('processAnother');
        const tryAgainBtn = document.getElementById('tryAgain');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadResults);
        }

        if (processAnotherBtn) {
            processAnotherBtn.addEventListener('click', processAnother);
        }

        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', processAnother);
        }
    }

    /**
     * Download results as log file
     */
    function downloadResults() {
        if (!currentResults) return;

        const logContent = [
            `ElqKit AutoSubmit Processing Results`,
            `Generated: ${currentResults.timestamp}`,
            ``,
            `SUMMARY:`,
            `Total Rows: ${currentResults.summary.total_rows}`,
            `Successful: ${currentResults.summary.successful_requests}`,
            `Failed: ${currentResults.summary.failed_requests}`,
            `Success Rate: ${currentResults.summary.success_rate}%`,
            `Total Processing Time: ${currentResults.summary.total_processing_time}s`,
            `Average Processing Time: ${currentResults.summary.average_processing_time}s`,
            ``,
            `DETAILED RESULTS:`,
            ...currentResults.results.map(result => {
                const lines = [
                    `Row ${result.row_number}: ${result.success ? 'SUCCESS' : 'FAILED'}`,
                    `  Processing Time: ${result.processing_time}s`,
                    `  Parameters: ${result.parameters_count}`
                ];
                
                if (result.success) {
                    lines.push(`  Status Code: ${result.status_code}`);
                    if (result.response_size) {
                        lines.push(`  Response Size: ${result.response_size} bytes`);
                    }
                    if (result.url) {
                        lines.push(`  URL: ${result.url}`);
                    }
                } else {
                    lines.push(`  Error: ${result.error}`);
                }
                
                lines.push('');
                return lines.join('\n');
            })
        ].join('\n');

        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elqkit-autosubmit-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Results log downloaded successfully', 'success');
    }

    /**
     * Reset form for processing another file
     */
    function processAnother() {
        hideAllSections();
        form.reset();
        currentResults = null;
        isProcessing = false;
        updateSubmitButton(false);
        
        // Reset file upload display
        const fileUploadContent = fileUploadArea.querySelector('.file-upload-content');
        if (fileUploadContent) {
            fileUploadContent.innerHTML = `
                <svg class="file-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
                <p class="file-upload-text">Click to select CSV file or drag and drop</p>
                <p class="file-upload-subtext">Maximum file size: 5MB</p>
            `;
            fileUploadArea.style.borderColor = '';
            fileUploadArea.style.backgroundColor = '';
        }
        
        // Clear field styling
        document.querySelectorAll('input').forEach(input => {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
        });
        
        showToast('Ready to process another file', 'info');
    }
}