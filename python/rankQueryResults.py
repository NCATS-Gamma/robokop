import argparse
import json
import sqlite3
from queryDatabase import queryAndScore

def loadQuery(database_file, board_id):
    conn = sqlite3.connect(database_file)
    cursor = conn.cursor()
    args = (board_id,)
    cursor.execute('SELECT * FROM blackboards WHERE id=?', args)
    rows = cursor.fetchall()
    conn.close()
    return json.loads(rows[0][3])

def loadAndRank(database_file, board_id, output=None, results_count=10):
    query = loadQuery(database_file, board_id)

    ranking_data = queryAndScore({'query':query, 'board_id':board_id})

    if output:
        with open(output, 'w') as f:
            json.dump(ranking_data[:results_count], f, indent=1)
    else:
        # smartly print out top results_count results
        print('================================================================================')
        for subgraph in ranking_data[:results_count]:
            top_names = [n['name'] for n in subgraph['nodes']]
            print("{:.4f}    ".format(subgraph['score']['rank_score'])+' -> '.join(top_names))
        print('================================================================================')

if __name__ == '__main__':

    default_database = '../blackboards.db'
    default_query_id = 'Query1_Ebola_Virus_Disease_cdw_chemotext2_chemotext'
    default_n = 10

    parser = argparse.ArgumentParser(description='Test protocop result ranking.')
    parser.add_argument('query_id', nargs='?',\
        default=default_query_id)
    parser.add_argument('-d', '--database', action="store", type=str,\
        default=default_database)
    parser.add_argument('-o', '--output', action="store", type=str,\
        default=None,\
        help='A file path in which to save the results.')
    parser.add_argument('-n', action="store", type=int,\
        default=default_n)
    args = parser.parse_args()

    loadAndRank(args.database, args.query_id, output=args.output, results_count=args.n)