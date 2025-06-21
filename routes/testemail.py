"""
TestEmail Routes
Placeholder for test email bookmarklet functionality
"""

from flask import Blueprint, render_template

testemail_bp = Blueprint('testemail', __name__, url_prefix='/testemail')


@testemail_bp.route('/')
def index():
    """TestEmail tool page (placeholder)."""
    return render_template('testemail/index.html')