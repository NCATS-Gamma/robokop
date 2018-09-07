class CurieSet:
    def __init__(self, inst):
        self.data = CurieSet.to_curie_dict(inst)
        
    @staticmethod
    def is_curie(val):
        return isinstance(val, dict) and "curie" in val

    @staticmethod
    def is_curie_list(val):
        return isinstance(val, list) and all([CurieSet.is_curie(c) for c in val])
    
    @staticmethod
    def to_curie_dict(val):
        if CurieSet.is_curie(val):
            return {'input': [val]} 
        if CurieSet.is_curie_list(val):
            return {'input': val}
        if isinstance(val, dict) or isinstance(val, CurieSet):
            if isinstance(val, CurieSet):
                val = val.data
            return {k: CurieSet.to_curie_list(val[k]) for k in val.keys()}
        
        raise ValueError('Invalid Curie List')

    @staticmethod
    def to_curie_list(val):
        if CurieSet.is_curie(val):
            return [val]
        if CurieSet.is_curie_list(val):
            return val
        if isinstance(val, dict) or isinstance(val, CurieSet):
            # If CurieSet just grab the dictionary
            if isinstance(val, CurieSet):
                val = val.data

            # A dictionary can be squashed into a curie list through union
            curie_str_list = []
            list_of_curie_lists = []
            for key in val.keys():
                # Each field could be a CurieSet or dict, call recursively
                this_curie_list = CurieSet.to_curie_list(val[key])
                this_curie_str_list = [c['curie'] for c in this_curie_list]

                curie_str_list.extend(this_curie_str_list)
                list_of_curie_lists.append(this_curie_list)

            # Unique over the curies
            curie_str_keep = set(curie_str_list)
            
            # Loop through and combine dictionaries
            unique_curie_list = []
            for curie_str in curie_str_keep:
                c = {}
                for cl in list_of_curie_lists:
                    this_c = [x for x in cl if x['curie'] == curie_str]
                    if len(this_c) > 0:
                        this_c = this_c[0]
                        c = {**c, **this_c}
                unique_curie_list.append(c)

            return unique_curie_list

        raise ValueError('Invalid Curie List')
    def union(self):
        names = self.names()
        return CurieSet({names[0]: CurieSet.to_curie_list(self)})

    def intersect(self):
        curie_str_set = set()
        for key in self.data:
            this_curie_list = self.get_list(key)
            this_curie_str_set = set([c['curie'] for c in this_curie_list])
            if len(curie_str_set) == 0:
                curie_str_set = this_curie_str_set
            else:
                curie_str_set = curie_str_set & this_curie_str_set
        
        curie_str_keep = list(curie_str_set)
        curie_list_keep = []
        for curie_str in curie_str_keep:
            c = {}
            for key in self.data:
                this_curie = [x for x in self.data[key] if x['curie'] == curie_str] 
                this_curie = this_curie[0]
                c = {**c, **this_curie}
            curie_list_keep.append(c)
        
        return CurieSet(curie_list_keep)

    def names(self):
        return list(self.data.keys())

    def num_lists(self):
        return len(self.names())
    
    def has_list(self, name):
        return name in self.data

    def get_list(self, name):
        return self.data[name]

    def get_list_ind(self, name):
        return list(self.data).index(name)

    def to_json(self):
        return self.data

    def __repr__(self):
        return self.data.__str__()

    def __str__(self):
        return self.__repr__()