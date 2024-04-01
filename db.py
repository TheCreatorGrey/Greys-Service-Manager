from err import error

DataBase = {
    "apps":{
        "main":{
            "storage":{"items":{}, "subcats":{}}
        }
    },

    "users":{
        "thecreatorgrey":{
            "roles":["Admin"]
        }
    }
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
                return error("INVALID_PATH")
            
        current = current["subcats"][p]
    

    items = current["items"]
    if itemID in items:
        if not checkPermission(username, intent, items[itemID]):
            return error("NO_PERMISSION")
    

    # Read or write depending on intent
    if intent == "write": 
        if itemID in items:
            items[itemID]["value"] = kwargs["value"]
        else:
            if not ("permissions" in kwargs):
                return error("INSUFFICIENT_ARGUMENTS")
            if not ("value" in kwargs):
                return error("INSUFFICIENT_ARGUMENTS")
            
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
            return error("INVALID_ITEM_ID")
        
    elif intent == "append":
        if not ("value" in kwargs):
            return error("INSUFFICIENT_ARGUMENTS")

        if itemID in items:
            if type(items[itemID]["value"]) is list:
                items[itemID]["value"].append(kwargs["value"])
        else:
            return error("INVALID_ITEM_ID")