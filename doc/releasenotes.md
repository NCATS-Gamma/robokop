
# Release Notes

These are general release notes that highlight a batch of ongoing updates. Across three repositories. The batches are marked when they were deployed to robokop.renci.org.


## 2018-02-26
- Better error handling in simple/template services
- Canceling of tasks and timeouts of tasks, now handle closing coupled tasks correctly.
- A lack of answers is no longer an error. ranker, simple/quick and the UI now handle this correctly.
- Fixed a bug in cypher query conditions
- Questions with a single node specification and no edges now return answers with complete meta data
  This is not fully tested but hopefully it will be a way to get a list of drugs of a certain type etc.

## 2018-02-20

- Node and edge lookup is now much faster. Making UI page loads waaaay faster and crash a lot less. This was just optimizing a few cypher queries.
- Added the directed edge property spec for questions (default is false if no predictate is specified)
- Expand service now has edge orientation capabilities that use the "directed" edge property
- The templating system in the backend has been overhauled provided new endpoints simple/templates/ simple/template/ simple/quick/template/
  This removes the old WF1Mod3 endpoint but the functionality has been moved to the templated system.
- The ranker prescreening process was optimized at a code level and is now muuuch faster
- Added omincorp back in to the ranker, which slowed it back down again but hopefully not too much. Task specific logs now provide more information for ranking timing.
- Overhauled JS build process again to make better use of environmental variables and allow us to change the graphql port easily
- Added the ability to look at logs in the UI. Also helps to find task specific logs much easier.
- Task specific logs are now stored outside of the containers in the common logs folder.
- Added an omnicorp container to robokop-rank/deploy. There is now a version running on both robokop and robokopdb2.

The ranker currently uses omnicorp ONLY if it is already in the redis requests cache. When the omnicorp postgres is full again, we will need to update ranker again to start using it effectively

These changes required a few modificiations to the env file. You now need
```
ROBOKOP_HOST=127.0.0.1
ROBOKOP_PROTOCOL=http
MANAGER_PORT=80
```
and you need to point the omnicorp to the correct place and port. To use a remote one (rather than local) use a url, to run a local version run omnicorp
```
OMNICORP_HOST=robokop.renci.org
#robokopdb2.renci.org
#omnicorp
OMNICORP_PORT=5433
OMNICORP_DB=robokop
OMNICORP_USER=murphy
```
Due to some changes in the docker infrastructure you will need to rebuild the ranker container.
