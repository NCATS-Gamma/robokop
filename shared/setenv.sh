DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export $(cat $DIR/robokop.env | grep -v ^# | xargs)