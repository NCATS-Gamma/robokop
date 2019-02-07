"""Blueprint for /a/* pages."""

from flask import Blueprint, render_template


a = Blueprint('answer', __name__,
              template_folder='templates')


# Answer Set
@a.route('/<answerset_id>/')
def answerset(answerset_id):
    """Deliver answerset page for a given id."""
    return render_template('answerset.html', answerset_id=answerset_id, answer_id=[])


# Answer
@a.route('/<answerset_id>/<answer_id>/')
def answer(answerset_id, answer_id):
    """Deliver answerset page for a given id, set to particular answer."""
    return render_template('answerset.html', answerset_id=answerset_id, answer_id=answer_id)
