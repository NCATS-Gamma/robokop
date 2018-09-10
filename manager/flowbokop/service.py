from .curieset import CurieSet

class Service:
    def __init__(self, *args, **kwargs):
        
        self.input = None
        self.options = {}

        # apply json properties to existing attributes
        if args:
            struct = args[0]
            if "input" in struct:
                self.input = CurieSet(struct["input"])
            if "options" in struct:
                self.options = struct["options"]

        # override any json properties with the named ones
        attributes = self.__dict__.keys()
        for key in kwargs:
            if key in attributes:
                setattr(self, key, kwargs[key])
            else:
                # warnings.warn("Keyword argument {} ignored.".format(key))
                pass

        # assert self.url and isinstance(self.url, str), "url must be specified upon construction, and be a non-empty string"
        assert self.options == None or isinstance(self.options, dict), "options must be None or dict"