from db import DataBase
from timeManager import getUTC
from random import randint
import hashlib, logging

def makeHash(string):
    h = hashlib.new('sha256')
    h.update(string.encode())
    return h.hexdigest()

def generateID(length, taken):
    chars = list("qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890")
    result = ""
    for _ in range(length):
        result += chars[randint(0, len(chars)-1)]
    if result in taken:
        return generateID(length, taken)
    return result

def keyAuth(user, key):
    if not (user in DataBase["users"]):
        return "NO_USER"
    return DataBase["users"][user]["key"] == makeHash(key)

def sessionAuth(user, sessID):
    if not (user in DataBase["users"]):
        return "NO_USER"
    if user in DataBase["sessions"]:
        return (DataBase["sessions"][user] == sessID)
    else:
        return False

def makeSession(user, key):
    if not (user in DataBase["users"]):
        return "NO_USER"
    if not (keyAuth(user, key)):
        return "BAD_AUTH"
    sessID = DataBase["sessions"][user] = generateID(16, DataBase["sessions"].keys())
    return sessID

def createAccount(username, key):
    if username in DataBase["users"]:
        return "USERNAME_TAKEN"
    
    acceptedChars = list("qwertyuiopasdfghjklzxcvbnm1234567890_")
    
    final = ""
    for i in username.lower():
        if i in acceptedChars:
            final += i
        else:
            return "BAD_CHARS"
        
    logging.info(final)
    
    DataBase["users"][final] = {
        "key":makeHash(key),
        "nick":final.title(),
        "description":"This user has not created a description yet.",
        "roles":["Member"],
        "appdata":{},
        "joinDT":getUTC(),
        "lastOnline":getUTC()
    }

    return True