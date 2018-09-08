from .servicedefinition import ServiceDefinition

class Operation:
    def __init__(self, *args, **kwargs):

        self.input = ""
        self.output = ""
        self.label = ""
        self.service = ServiceDefinition()

        # apply json properties to existing attributes
        if args:
            struct = args[0]
            if "input" in struct:
                if isinstance(struct["input"], str):
                    self.input = [struct["input"]] # a variable name if list it is a list of variable names
                else:
                    self.input = struct["input"] # trust and check below
            if "output" in struct:
                self.output = struct["output"] # a variable name
            if "label" in struct:
                self.label = struct["label"] # a string for notes/visualization
            if "service" in struct:
                if "options" in struct:
                    self.service = ServiceDefinition(struct["service"], struct["options"])
                else:
                    self.service = ServiceDefinition(struct["service"])

        # override any json properties with the named ones
        attributes = self.__dict__.keys()
        for key in kwargs:
            if key in attributes:
                setattr(self, key, kwargs[key])
            else:
                pass
                # warnings.warn("Keyword argument {} ignored.".format(key))

        assert self.input and (isinstance(self.input, list) and all([isinstance(ins, str) for ins in self.input])), "input must be specified upon construction, and be a non-empty string, or a list of string"
        assert self.output and isinstance(self.output, str), "output must be specified upon construction, and be a non-empty string"
        assert self.service and isinstance(self.service, ServiceDefinition), "service must be specified upon construction, and be a valid ServiceDefinition"

        if not self.label:
            # Label is still empty, make one up
            self.label = f"{self.service.url}"
    
    def run(self, curies):
        # Call the service using the service object
        return self.service.run(curies)

    def __repr__(self):
        return f"{self.input} -{self.service.url}-> {self.output}"

    def __str__(self):
        return self.__repr__()