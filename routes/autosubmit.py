"""
AutoSubmit Routes
CSV to API converter functionality
"""

import csv
import io
import json
import logging
import time
import urllib.parse
from datetime import datetime
from typing import Dict, List, Tuple, Any

import requests
from flask import Blueprint, render_template, request, jsonify

# Configure logging
logger = logging.getLogger(__name__)

autosubmit_bp = Blueprint('autosubmit', __name__, url_prefix='/autosubmit')

# Constants
REQUEST_TIMEOUT = 10  # seconds
ALLOWED_EXTENSIONS = {'csv'}
ELOQUA_BASE_URL = "https://s{site_id}.t.eloqua.com/e/f2"


def allowed_file(filename: str) -> bool:
    """Check if uploaded file has allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_site_id(site_id: str) -> bool:
    """Validate that site_id contains only numeric characters."""
    return site_id.isdigit()


def build_eloqua_url(site_id: str, elq_form_name: str, csv_data: Dict[str, str]) -> str:
    """
    Build the complete Eloqua URL with parameters.
    
    Args:
        site_id: Numeric site identifier
        elq_form_name: Form name parameter
        csv_data: Dictionary of CSV row data (key-value pairs)
    
    Returns:
        Complete URL with encoded parameters
    """
    base_url = ELOQUA_BASE_URL.format(site_id=site_id)
    
    # Start with required parameters
    params = {
        'elqFormName': elq_form_name,
        'elqSiteID': site_id
    }
    
    # Add CSV data
    params.update(csv_data)
    
    # Build query string with proper encoding
    query_params = []
    for key, value in params.items():
        encoded_key = urllib.parse.quote_plus(str(key))
        encoded_value = urllib.parse.quote_plus(str(value))
        query_params.append(f"{encoded_key}={encoded_value}")
    
    return f"{base_url}?{'&'.join(query_params)}"


def process_csv_row(row_data: Dict[str, str], site_id: str, elq_form_name: str, 
                   row_number: int) -> Dict[str, Any]:
    """
    Process a single CSV row by sending HTTP POST request.
    
    Args:
        row_data: Dictionary of CSV row data
        site_id: Site identifier
        elq_form_name: Form name
        row_number: Current row number for logging
    
    Returns:
        Dictionary containing request results
    """
    start_time = time.time()
    
    try:
        # Build the target URL
        target_url = build_eloqua_url(site_id, elq_form_name, row_data)
        
        # Log the request (without sensitive data in production)
        logger.info(f"Processing row {row_number}: {len(row_data)} parameters")
        
        # Make HTTP POST request
        response = requests.post(
            target_url,
            data=row_data,  # Send as form data in POST body
            timeout=REQUEST_TIMEOUT,
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ElqKit-AutoSubmit/1.0'
            }
        )
        
        processing_time = time.time() - start_time
        
        return {
            'row_number': row_number,
            'success': True,
            'status_code': response.status_code,
            'processing_time': round(processing_time, 3),
            'url': target_url,
            'parameters_count': len(row_data),
            'response_size': len(response.content) if response.content else 0
        }
        
    except requests.exceptions.Timeout:
        processing_time = time.time() - start_time
        return {
            'row_number': row_number,
            'success': False,
            'error': 'Request timeout',
            'processing_time': round(processing_time, 3),
            'parameters_count': len(row_data)
        }
        
    except requests.exceptions.RequestException as e:
        processing_time = time.time() - start_time
        return {
            'row_number': row_number,
            'success': False,
            'error': f'Network error: {str(e)}',
            'processing_time': round(processing_time, 3),
            'parameters_count': len(row_data)
        }
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Unexpected error processing row {row_number}: {str(e)}")
        return {
            'row_number': row_number,
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'processing_time': round(processing_time, 3),
            'parameters_count': len(row_data)
        }


@autosubmit_bp.route('/')
def index():
    """AutoSubmit tool page."""
    return render_template('autosubmit/index.html')


@autosubmit_bp.route('/upload', methods=['POST'])
def upload_file():
    """
    Handle CSV file upload and process each row.
    
    Returns:
        JSON response with processing results
    """
    start_time = time.time()
    
    try:
        # Validate form data
        if 'site_id' not in request.form or 'elq_form_name' not in request.form:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: site_id and elq_form_name'
            }), 400
        
        site_id = request.form['site_id'].strip()
        elq_form_name = request.form['elq_form_name'].strip()
        
        # Validate site_id is numeric
        if not validate_site_id(site_id):
            return jsonify({
                'success': False,
                'error': 'Site ID must contain only numeric characters'
            }), 400
        
        # Validate form name
        if not elq_form_name:
            return jsonify({
                'success': False,
                'error': 'elqFormName cannot be empty'
            }), 400
        
        # Check if file was uploaded
        if 'csv_file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file uploaded'
            }), 400
        
        file = request.files['csv_file']
        
        # Check if file was selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Only CSV files are allowed'
            }), 400
        
        # Read and process CSV file
        try:
            # Read file content as string
            file_content = file.read().decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(file_content))
            
            # Validate CSV has headers
            if not csv_reader.fieldnames:
                return jsonify({
                    'success': False,
                    'error': 'CSV file must have column headers'
                }), 400
            
            results = []
            row_count = 0
            
            # Process each row
            for row_number, row in enumerate(csv_reader, start=1):
                # Skip empty rows
                if not any(value.strip() for value in row.values() if value):
                    continue
                
                # Remove empty values and strip whitespace
                cleaned_row = {k: v.strip() for k, v in row.items() 
                             if v is not None and v.strip()}
                
                if cleaned_row:  # Only process rows with data
                    result = process_csv_row(cleaned_row, site_id, elq_form_name, row_number)
                    results.append(result)
                    row_count += 1
            
            # Validate we processed at least one row
            if row_count == 0:
                return jsonify({
                    'success': False,
                    'error': 'No valid data rows found in CSV file'
                }), 400
            
            # Calculate summary statistics
            successful_requests = sum(1 for r in results if r['success'])
            failed_requests = len(results) - successful_requests
            total_processing_time = time.time() - start_time
            avg_processing_time = sum(r['processing_time'] for r in results) / len(results)
            
            # Prepare response
            response_data = {
                'success': True,
                'summary': {
                    'total_rows': row_count,
                    'successful_requests': successful_requests,
                    'failed_requests': failed_requests,
                    'success_rate': round((successful_requests / row_count) * 100, 1),
                    'total_processing_time': round(total_processing_time, 3),
                    'average_processing_time': round(avg_processing_time, 3)
                },
                'results': results,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"Processing completed: {successful_requests}/{row_count} successful")
            return jsonify(response_data)
            
        except UnicodeDecodeError:
            return jsonify({
                'success': False,
                'error': 'File encoding error. Please ensure CSV file is UTF-8 encoded.'
            }), 400
            
        except csv.Error as e:
            return jsonify({
                'success': False,
                'error': f'CSV parsing error: {str(e)}'
            }), 400
    
    except Exception as e:
        logger.error(f"Unexpected error in upload_file: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error occurred'
        }), 500