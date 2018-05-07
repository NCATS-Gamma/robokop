DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export ROBOKOP_HOME="$DIR/../.."
export $(cat $ROBOKOP_HOME/shared/robokop.env | grep -v ^# | xargs)