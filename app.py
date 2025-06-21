#!/usr/bin/env python3
"""
ElqKit - Multi-Tool Suite for Eloqua
A Flask web application with multiple tools for Eloqua management and automation.
"""

import logging
import os
import secrets
from flask import Flask

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB file size limit
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_urlsafe(32))

# Import and register blueprints
from routes.main import main_bp
from routes.autosubmit import autosubmit_bp
from routes.bulkdelete import bulkdelete_bp
from routes.testemail import testemail_bp

app.register_blueprint(main_bp)
app.register_blueprint(autosubmit_bp)
app.register_blueprint(bulkdelete_bp)
app.register_blueprint(testemail_bp)


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    from flask import jsonify
    return jsonify({
        'success': False,
        'error': 'File too large. Maximum size is 5MB.'
    }), 413


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    from flask import jsonify, request
    if request.path.startswith('/api/') or request.headers.get('Content-Type') == 'application/json':
        return jsonify({
            'success': False,
            'error': 'Endpoint not found'
        }), 404
    else:
        return main_bp.index()  # Redirect to landing page for non-API requests


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors."""
    from flask import jsonify
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    # Configure for production
    port = int(os.environ.get('PORT', 8847))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting ElqKit on port {port}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )