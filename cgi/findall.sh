# Configuration part
LIMIT=200
BASE_DIR="/home/hjz"
BASE_URL="/smallwhite"
TMP_FILE=$(mktemp)
TIME_STYLE="+%m/%d/%Y"
DB_FILE="/var/lib/mlocate/mlocate.db"

BASE_DIR=${BASE_DIR%/}

locate -d $DB_FILE -ib "$KEYWORD" | tee $TMP_FILE | wc -l
echo $BASE_URL
cd $BASE_DIR
head -n $LIMIT $TMP_FILE | while read X
do
	ls -ldh --time-style="$TIME_STYLE" "${X#${BASE_DIR}/}"
done \
| sed 's/^\(\S\)\S\{9\}\s\+\(\S\+\s\+\)\{3\}\(\S\+\)\s\+\(\S\+\)\s\+\(\S\+\)\b/\1,\3,\4,\5/'
rm -f $TMP_FILE

