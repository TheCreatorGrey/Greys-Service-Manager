import time

def getUTC():
    string = "%Y/%m/%d/%H/%M/%S"
    raw = time.strftime("%Y/%m/%d/%H/%M/%S", time.gmtime()).split("/")
    result = []
    for r in raw:
        result.append(int(r))
    return result