class Answer:
    def __init__(self):
        self.id = None
        self.name = None

class AnswerSet:
    '''
    An "answer" to a Question.
    Contains a ranked list of paths through the Knowledge Graph.
    '''

    def __init__(self):
        self.answers = None

    def construct_name(self):
        ''' Construct short name summarizing each subgraph. '''
        names = []
        for node in self.nodes:
            names.append(node['name'])

        short_name = ''
        for name_idx, name in enumerate(names):
            if name_idx > 0:
                #short_name = short_name + '→'
                short_name = short_name + ' » '
            short_name = short_name + name[0:min(len(name), 4)]

        return short_name