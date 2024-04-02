from err import error
from timeManager import getUTC

DataBase = {
    "apps":{
        "main":{
            "storage":{"items":{}, "subcats":{}}
        }
    },

    "users":{
        "guest":{
            "key":"4b949c130904506119a31ad2ca94bc9a97f56be914676fe08a5de594ea4c96bd", # this is a temporary throwaway account; I'm not oblivious
            "nick":"guest",
            "description":"This user has not created a description yet.",
            "roles":["Member"],
            "appdata":{},
            "joinDT":getUTC(),
            "lastOnline":getUTC()
        }
    },

    "sessions":{}
}

def checkPermission(username, intent, item):
    result = False
    roles = DataBase["users"][username]["roles"]
    permCode = item["perms"]

    if item["owner"] == username:
        result =  True

    if intent in permCode:
        perm = permCode[intent]

        if "*" in perm:
            result =  True
        if username in perm:
            result = True

        for r in roles:
            if ("*" + r) in perm:
                result = True
    
    return result

def itemProcess(username, app, path="", intent="write", **kwargs):
    current = DataBase["apps"][app]["storage"]

    pathChunks = path.split("/") # Here, the path is separated from the item ID
    itemID = pathChunks[-1]
    pathChunks.pop()


    for p in pathChunks:
        if p not in current["subcats"]: # If path subcategory does not exist, create it if the intent is "write".
            if intent == "write":
                current["subcats"][p] = {
                    "items":{}, 
                    "subcats":{}
                }
            else:
                return "INVALID_PATH"
            
        current = current["subcats"][p]
    

    items = current["items"]
    if itemID in items:
        if not checkPermission(username, intent, items[itemID]):
            return "NO_PERMISSION"
        

    # Read or write depending on intent
    if intent == "write": 
        if itemID in items:
            items[itemID]["value"] = kwargs["value"]
        else:
            if not ("permissions" in kwargs):
                return "INSUFFICIENT_ARGUMENTS"
            if not ("value" in kwargs):
                return "INSUFFICIENT_ARGUMENTS"
            
            items[itemID] = {
                "value":kwargs["value"], 
                "owner":username, 
                "perms":kwargs["permissions"]
            }
            
        return True
    
    elif intent == "read":
        if itemID in items:
            item = items[itemID]

            if "mode" in kwargs:
                mode = kwargs["mode"]
                mArgs = kwargs["mArgs"]

                if mode == "plain":
                    return item["value"]
                if mode == "whole":
                    return item
                if mode == "length":
                    return len(item["value"])
                if mode == "chunk":
                    return item["value"][mArgs["start"]:mArgs["end"]]

            return item
        else:
            return "INVALID_ITEM_ID"
        
    elif intent == "append":
        if not ("value" in kwargs):
            return "INSUFFICIENT_ARGUMENTS"

        if itemID in items:
            if type(items[itemID]["value"]) is list:
                items[itemID]["value"].append(kwargs["value"])
        else:
            return "INVALID_ITEM_ID"
        


    if not (intent == "read"):
        items[itemID]["lastModified"] = getUTC()