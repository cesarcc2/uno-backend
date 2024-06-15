import { v4 as uuid } from "uuid";

export const generateId = (list: Array<any>): string => {
    if(list.length == 0 ) {
        return uuid();
    }
    
    const ids = new Set(list.map(item => item.id));
    let uniqueId: string;
  
    do {
      uniqueId = uuid();
    } while (ids.has(uniqueId));
  
    return uniqueId;
  };