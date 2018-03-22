import argparse
import json
import sqlite3
import os
from Question import Question

def loadQuery(database_file, board_id):
    conn = sqlite3.connect(database_file)
    cursor = conn.cursor()
    args = (board_id,)
    cursor.execute('SELECT * FROM blackboards WHERE id=?', args)
    rows = cursor.fetchall()
    conn.close()
    return json.loads(rows[0][3])

def loadAndRank(database_file, board_id, output=None, results_count=-1):
    query = loadQuery(database_file, board_id)
    q = Question(query, board_id)
    ranking_data = q.answer()

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

    default_database = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','blackboards.db'))
    default_query_id = 'Query1_Ebola_Virus_Disease_cdw_chemotext2_chemotext'
    default_n = -1

    parser = argparse.ArgumentParser(description='Test protocop result ranking.')
    parser.add_argument('query_id', nargs='?',\
        default=None)
    parser.add_argument('-f', '--file', action="store", type=str,\
        default=None)
    parser.add_argument('-d', '--database', action="store", type=str,\
        default=default_database)
    parser.add_argument('-o', '--output', action="store", type=str,\
        default=None,\
        help='A file path in which to save the results.')
    parser.add_argument('-n', action="store", type=int,\
        default=default_n)
    args = parser.parse_args()

    if args.query_id and args.file or not (args.query_id or args.file):
        raise RuntimeError("You must supply exactly one of file or query id.")

    if args.query_id:
        loadAndRank(args.database, args.query_id, output=args.output, results_count=args.n)
    if args.file:
        if args.output:
            raise Warning("Command-line argument --output ignored for file input.")
        with open(args.file) as f:
            for line in f:
                line = line.strip()
                print(line)
                loadAndRank(args.database, line, output=line+'.json', results_count=args.n)