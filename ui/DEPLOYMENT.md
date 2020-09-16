# Deployment

This contains a docker-compose configuration file for easy deployment. This UI contains a dependency on [Robokache](https://github.com/NCATS-Gamma/robokache) which is managed by using the Github Container Registry to pull the latest version.

Unfortunately, Github Container Registry does not allow you to pull images without credentials (even on public repositories). The way to solve this is to create a [Github Access Token](https://github.com/settings/tokens). This token only needs the `read:packages` permission. After getting the token, then use the `docker login` command to register that token on your local machine:

```bash
>>> echo "<token>" | docker login docker.pkg.github.com --username <github_username> --password-stdin
```
