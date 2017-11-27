Set up Python with Anaconda:
    1. Go to https://www.continuum.io/downloads
       - Download the Python 3.6 version
       - It will be a graphical installer for both windows and mac, so you shall be fine for this step. But just in case, here are the instructions for [Windows](https://docs.continuum.io/anaconda/install/windows) and [macOS](https://docs.continuum.io/anaconda/install/mac-os#macos-graphical-install)
       - There is only a command line installer for Linux platform, just follow [this](https://docs.continuum.io/anaconda/install/linux), also shouldn't be too hard.
    2. Check your installation
       - For Windows users, please use the Conda prompt (which has already been installed), for macOS and Linux users, just use terminal.
       - Enter 'conda --version', you'll see something like 'conda 4.4.0'.


Set up virtual environment:
    1. In terminal (Anaconda prompt for Windows users), cd to the git repo
    2. Enter command
        `conda env create'
        This will automatically load the dependencies specified in environment.yaml and install them for you.

    3. After installation is complete, for Windows users, do:
        `activate covar-ncats'
        and for macOS/Linux users, do:
        `source activate covar-ncats'
        You should see the command prompt now starts with '(covar-ncats)'.


    jupyter notebook
    After opening a file, make sure the top right of the page (right side of the toolbar) says 'conda env: covar-ncats'
    If it says something different, like 'Python 3', click 'Kernel' at toolbar, then 'Change Kernel' and select the right one.
