#!/usr/bin/env python

"""Start Flask web server."""

import os

from flask import render_template

from manager.setup import app
# import initialize_manager
import manager.logging_config
from manager.questions_blueprint import questions
from manager.q_blueprint import q
from manager.a_blueprint import a

# set up all apis
import manager.api.messages_api
import manager.api.q_api
import manager.api.misc_api
import manager.api.simple_api


# Initialization
@app.before_first_request
def init():
    """Initialize Flask app."""
    import initialize_manager
    pass

app.register_blueprint(questions, url_prefix='/questions')
app.register_blueprint(q, url_prefix='/q')
app.register_blueprint(a, url_prefix='/a')

# Flask Server code below
################################################################################


@app.route('/')
def landing():
    """Give the initial page."""
    return render_template('landing.html')


@app.route('/help/')
def help():
    """Get help page."""
    return render_template('help.html')


@app.route('/guide/')
def guide():
    """Get starting guide."""
    return render_template('guide.html')


@app.route('/apps/')
def apps():
    """Get apps page."""
    return render_template('apps.html')

@app.route('/termsofservice/')
def termsofservice():
    """Get terms of service."""
    return render_template('termsofService.html')

@app.route('/activity/')
def activity():
    """List of tasks."""
    return render_template('activity.html')

@app.route('/search/')
def search():
    """Search for biomedical concept identifiers."""
    return render_template('search.html')


@app.route('/simple/question/')
def simpleQuestion():
    """Ask simple question without storing answer."""
    return render_template('simpleQuestion.html')


@app.route('/simple/view/')
def viewer_blank():
    """Answerset Browser with upload capablitiy."""
    return render_template('simpleView.html', upload_id='')

@app.route('/simple/view/<upload_id>/')
def viewer_file(upload_id):
    """Answerset Browser from uploaded file."""
    return render_template('simpleView.html', upload_id=upload_id)

@app.route('/simple/enriched/')
def enriched():
    """Get enriched answers."""
    return render_template('simpleEnriched.html')

@app.route('/simple/similarity/')
def similarity():
    """Get similarity answers."""
    return render_template('simpleSimilarity.html')

@app.route('/simple/expand/')
def expand():
    """Get expanded answers."""
    return render_template('simpleExpand.html')

@app.route('/simple/synonymize/')
def synonymize():
    """Get synonymous curie identifiers."""
    return render_template('synonymize.html')

@app.route('/simple/publications/')
def publications():
    """Get relevant publications."""
    return render_template('simplePublications.html')

@app.route('/compare/')
def compare():
    """Search for biomedical concept identifiers."""
    return render_template('compare.html')


# Run Webserver
if __name__ == '__main__':

    # Get host and port from environmental variables
    server_host = '0.0.0.0'
    server_port = int(os.environ['MANAGER_PORT'])

    app.run(
        host=server_host,
        port=server_port,
        debug=False,
        use_reloader=True
    )
