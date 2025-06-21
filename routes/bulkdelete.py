"""
BulkDelete Routes
Placeholder for bulk API sync deletion functionality
"""

from flask import Blueprint, render_template

bulkdelete_bp = Blueprint('bulkdelete', __name__, url_prefix='/bulkdelete')


@bulkdelete_bp.route('/')
def index():
    """BulkDelete tool page (placeholder)."""
    return render_template('bulkdelete/index.html')