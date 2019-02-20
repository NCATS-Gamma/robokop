# Using ROBOKOP Templates

Robokop has a selection of templates to make life easier for common queries. A list of available templates, specified by their IDs, is available at 

```
curl -X GET "http://robokop.renci.org/api/simple/templates/" -H  "accept: application/json"
```

A template can be viewed by specifying a template id like so

```
curl -X GET "http://robokop.renci.org/api/simple/template/wf1mod1/" -H  "accept: application/json"
```

Within a template, identifiers are numberd inside of strings surrounded by "$". Such as $identifier1$ or $identifier2$. These terms can be filled in the template by specifying them in the URL

```
curl -X GET "http://robokop.renci.org/api/simple/template/wf1mod1/MONDO:0005148" -H  "accept: application/json"
```

If a template requires multiple identifers they can be specified in order

```
curl -X GET "http://robokop.renci.org/api/simple/template/cop_disease/PUBCHEM:5281881/MONDO:0005090/" -H  "accept: application/json"
```

The template may also contain other templated strings such as a human readable name for the identifiers. The most common being $name1$ and $name2$

```
curl -X GET "http://robokop.renci.org/api/simple/template/wf1mod1/MONDO:0005148/?name1=Type%202%20Diabetes" -H  "accept: application/json"
```
or 
```
curl -X GET "http://robokop.renci.org/api/simple/template/cop_disease/PUBCHEM:5281881/MONDO:0005090/?name1=FLUPENTIXOL&name2=Schizophrenia" -H  "accept: application/json"
```

The endpoint "simple/template" is primarily for retrieving and filling in templates. The endpoint "simple/quick/template/" works the same way, but also immediately submits the template to quick. All query params that are accepted by quick are also accepted there.

```
curl -X GET "http://robokop.renci.org/api/simple/quick/template/wf1mod1/MONDO:0005148/?name1=Type%202%20Diabetes" -H  "accept: application/json"
```

```
curl -X GET "http://robokop.renci.org/api/simple/quick/template/wf1mod1/MONDO:0005148/?name1=Type%202%20Diabetes/?max_connectivity=1000" -H  "accept: application/json"
```