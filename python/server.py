"""Flask web server thread"""
import os
import json
import sqlite3
import subprocess
import logging

from flask import Flask, jsonify, request, render_template

from queryDatabase import queryAndScore, networkx2struct
# queryAndScore is the entry point for finding and ranking paths
# networkx2struct is a method to translate networkx graphs into somethign for the ui
from neo4jDatabase import Neo4jDatabase
# Needed to read in a large Graph from neoj


app = Flask(__name__, static_folder='../static')
# Set default static folder to point to parent static folder where all
# static assets can be stored and linked

# We will use a local sqlite DB
# We will hold a global reference to the path
global collection_location
collection_location = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','blackboards.db'))

# Our local config is in the main directory
# We will use this host and port if we are running from python and not gunicorn
global local_config
config_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..')
json_file = os.path.join(config_dir,'config.json')
with open(json_file, 'rt') as json_in:
    local_config = json.load(json_in)

# Since we start gunicorn / the server from the root directory and not the python dir
# It's in the directory above this files.

# If we don't have a blackboards.db for somereason.
# Initialize one
if os.path.isfile(collection_location) is False:
    print("Initializing Empty Blackboards DB")
    init_table_name = 'blackboards'
    init_database = sqlite3.connect(collection_location)
    init_cursor = init_database.cursor()
    init_cursor.execute('''CREATE TABLE IF NOT EXISTS {}
            (id text, name text, description text, query_json text, finished text)'''\
            .format(init_table_name))
    init_database.commit()
    init_database.close()

# Flush the building table every time we start the server
# This only removes our knowledge of boards being constructed
# When those boards finish they will still show up on the next page refresh
init_table_name = 'building'
init_database = sqlite3.connect(collection_location)
init_cursor = init_database.cursor()
init_cursor.execute('''DROP TABLE IF EXISTS {};'''.format(init_table_name))
init_cursor.execute('''CREATE TABLE IF NOT EXISTS {}
    (id text, name text, description text, query_json text, finished text)'''\
    .format(init_table_name))
init_database.commit()
init_database.close()

# Flask Server code below
################################################################################

class InvalidUsage(Exception):
    """Error handler class to translate python exceptions to json messages"""
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    """Error handler to translate python exceptions to json messages"""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

@app.route('/')
def initialize():
    """Initial contact. Give the initial page."""
    return render_template('index.html')


def fetch_table_entries(database, table, condition=''):
    """Helper function to grab a SQL Lite table entries"""
    #####################################################################################################
    # Vulnerable to SQL injection. Hard to see why a user would want to do this since everything is open,
    # but by inserting code into the query name, for example, one could gain access to the database.
    #####################################################################################################

    conn = sqlite3.connect(database)
    cursor = conn.cursor()

    condition_string = ' WHERE {}'.format(condition) if condition else ''
    cursor.execute('SELECT * FROM {}'.format(table) + condition_string)

    rows = cursor.fetchall()
    conn.close()
    return rows

@app.route('/collection/load', methods=['POST'])
def collection_load():
    logger = logging.getLogger('application')
    logger.setLevel(level = logging.DEBUG)
    logger.error('Loading collection...')
    
    """Delivers the list of all available boards"""
    try:
        global collection_location # Location of the sqllite db file

        # At this point collections are just specialized directory structures
        conn = sqlite3.connect(collection_location)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM blackboards')
        rows = cursor.fetchall()
        conn.close()

        boards = []
        for row in rows:
            boards.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
            })

        return jsonify({'boards': boards})

    except Exception as ex:
        print(ex)
        raise InvalidUsage("Unspecified exception {0}".format(ex), 410)
    except:
        raise InvalidUsage('Failed to load blackboard collection.', 410)

@app.route('/building/load', methods=['GET'])
def building_load():
    """Delivers a list of the boards currently under construction"""
    try:
        global collection_location # Location of the sqllite db file
        
        conn = sqlite3.connect(collection_location)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM building')
        rows = cursor.fetchall()
        conn.close()
        
        boards = []
        for row in rows:
            if row[4] == "False":
                boards.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                })
        
        return jsonify({'boards': boards})

    except Exception as ex:
        print(ex)
        raise InvalidUsage("Unspecified exception {0}".format(ex), 410)
    except:
        raise InvalidUsage('Failed to fetch blackboards under construction.', 410)

@app.route('/blackboard/build', methods=['POST'])
def blackboard_build():
    """Initiates the builder process from a board_id"""
    try:
        global collection_location

        board_id = request.form.get('id')
        board_name = request.form.get('name')
        board_description = request.form.get('description')
        board_query = request.form.get('query')
        
        ###############
        # Put this new board request into the building table
        ###############
        # open database
        table_name = 'building'
        database = sqlite3.connect(collection_location)
        cursor = database.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS {}
                (id text, name text, description text, query_json text, finished text)'''\
                .format(table_name))
        # insert blackboard information into database
        cursor.execute("INSERT INTO {} VALUES (?,?,?,?,?)".format(table_name),\
            (board_id, board_name, board_description, board_query, "False"))
        database.commit()
        database.close()

        ###############
        # Start subprocess to run builder
        ###############
        os.environ['PYTHONPATH'] = '../robokop-interfaces:../robokop-build/builder'
        proc = subprocess.Popen(["python", 'python/runBuilderQuery.py', collection_location, board_id])

        # Notes:
        # At this point we throw out the proc and loose the ability to control it.
        #   Ultimiately, we should have a process manager
        # We communicate here through the database. This isn't ideal but it's functional at this scale.

        return jsonify({'failure': False})

    except Exception as ex:
        print(ex)
        raise InvalidUsage("Unspecified exception {0}".format(ex), 410)
    except:
        raise InvalidUsage('Failed to initiate builder.', 410)

@app.route('/blackboard/load', methods=['POST'])
def blackboard_load():
    global local_config
    logger = logging.getLogger('application')
    logger.setLevel(level = logging.DEBUG)
    logger.error('Loading blackboard...')

    """Deliver all of the information we have about a blackboard given an id."""
    try:
        board_id = request.form.get('id')
        global collection_location

        condition = "id='{}'".format(board_id)
        rows = fetch_table_entries(collection_location, 'blackboards', condition)

        query = json.loads(rows[0][3])
        construction_graph = json.loads(rows[0][4])

        # Contact Neo4j to get the large graph of this backboard
        database = Neo4jDatabase(local_config['clientHost'])
        query_graph = database.getNodesByLabel(board_id)
        # Sometimes the grpah is too large and we get a summary dict
        # Usually though we get a networkx list
        if isinstance(query_graph, dict):
            graph = query_graph
        else:
            # Turn the networkx list into a struct for jsonifying
            graph = networkx2struct(query_graph)

        return jsonify({'graph': graph,\
            'query': query,\
            'constructionGraph': construction_graph})

    except Exception as ex:
        print(ex)
        raise InvalidUsage("Unspecified exception {0}".format(ex), 410)
    except:
        raise InvalidUsage('Failed to load blackboard.', 410)

@app.route('/blackboard/rank', methods=['POST'])
def blackboard_rank():
    """
    Given a board ID find the paths through the graph that match the query
    Then rank those paths. Return a list of paths with subgraphs and scores
    """
    try:
        board_id = request.form.get('id')
        global collection_location

        condition = "id='{}'".format(board_id)
        rows = fetch_table_entries(collection_location, 'blackboards', condition)

        query = json.loads(rows[0][3])

        # Query and Score will contact Neo4j
        # We just need to specify the query
        ranking_data = queryAndScore({'query':query, 'board_id':board_id})

        return jsonify({'ranking': ranking_data})

    except Exception as ex:
        print(ex)
        raise InvalidUsage("Unspecified exception {0}".format(ex), 410)
    except:
        raise InvalidUsage('Failed to set run query.', 410)

if __name__ == '__main__':
    app.run(host=local_config['serverHost'],\
        port=local_config['port'],\
        debug=False,\
        use_reloader=False)
