#Kubernetes Setup notes


> Required images can be found on docker hub. 

We assume that you have installed and configured kubectl to talk to the cluster.
Instruction on how to do so can be found at [Kubernetes docs](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

Installation 
1. Edit the `environment.conf` file in this directory, place some passwords at the end of the file.
2. Create config map
    > $ kubectl create configmap robokop-env --from-env-file=environment.conf  
3. Adjust the volume types in the following files to suite your needs
    * logs_persistence.yaml
    * shared_persistence.yaml
4. Create the persistence volumes and claims
    > $ kubectl create -f logs_persistence.yaml shared_persistence.yaml
5. Copy the `enviroment.conf` file to the shared volume mount.
 
6. Create  the other kubernetes resources.
    > $ kubectl create -f manager_service.yaml\
                          manager_deployment.yaml\
                          backend_deployment.yaml\ 
                          backend_service.yaml\
            
                                               
                                                 
                                                 
                                                  
                                                               