class Answer:
    def __init__(self):
        self.id = None
        self.name = None
        self.description = None

    @staticmethod
    def constructName(ranking_data):
        ''' Construct short name summarizing each subgraph. '''
        names = []
        for node in ranking_data['nodes']:
            names.append(node['name'])

        short_name = ''
        for name_idx, name in enumerate(names):
            if name_idx > 0:
                #short_name = short_name + '→'
                short_name = short_name + ' » '
            short_name = short_name + name[0:min(len(name), 4)]

        return short_name