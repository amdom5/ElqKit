"""
ElqKit Main Routes
Handles the landing page and main navigation
"""

from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """ElqKit landing page with tool cards."""
    tools = [
        {
            'name': 'AutoSubmit',
            'description': 'Convert CSV files to HTTP POST requests for Eloqua forms',
            'icon': 'autosubmit-icon.svg',
            'route': 'autosubmit.index',
            'status': 'active',
            'category': 'Data Processing'
        },
        {
            'name': 'BulkDelete',
            'description': 'Delete multiple API syncs in Eloqua efficiently',
            'icon': 'bulkdelete-icon.svg',
            'route': 'bulkdelete.index',
            'status': 'coming_soon',
            'category': 'Data Management'
        },
        {
            'name': 'TestEmail',
            'description': 'Send multiple test emails with bookmarklet tool',
            'icon': 'testemail-icon.svg',
            'route': 'testemail.index',
            'status': 'coming_soon',
            'category': 'Testing'
        }
    ]
    
    return render_template('index.html', tools=tools)


@main_bp.route('/about')
def about():
    """About ElqKit page."""
    return render_template('about.html')