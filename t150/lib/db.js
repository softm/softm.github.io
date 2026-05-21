IDBKeyRange.prototype.includes = IDBKeyRange.prototype.includes || function(key) {
  var r = this, c;
  if (r.lower !== undefined) {
    c = indexedDB.cmp(key, r.lower);
    if (r.lowerOpen && c <= 0) return false;
    if (!r.lowerOpen && c < 0) return false;
  }
  if (r.upper !== undefined) {
    c = indexedDB.cmp(key, r.upper);
    if (r.upperOpen && c >= 0) return false;
    if (!r.upperOpen && c > 0) return false;
  }
  return true;
};

//  var db;

    function indexedDBOk() {
        return "indexedDB" in window;
    }

    function InitLocalStorage(dbname,createKeys) {
        this.dbname = dbname;
        this.createKeys = createKeys;
        this.db = null;
        this.openRequest = null;
//        document.addEventListener("DOMContentLoaded", function() {
            //No support? Go in the corner and pout.
            if(!indexedDBOk) return;
            var v = '1.1';
            var thisobj = this;

            this.openRequest = indexedDB.open(this.dbname,2);

            this.openRequest.onupgradeneeded = function(e) {
                var thisDB = e.target.result;

                if(!thisDB.objectStoreNames.contains(thisobj.dbname)) {
                    thisDB.createObjectStore(thisobj.dbname, {
                        keyPath: '_id',
                        autoIncrement: true
                    });
                }

                var store   = thisobj.openRequest.transaction.objectStore(thisobj.dbname);
                for( key in createKeys) {
                    store.createIndex(createKeys[key], createKeys[key]);
                }
//                var id      = store.createIndex('id'    , 'id'  );
//                var name    = store.createIndex('name'  , 'name');
//                var key     = store.createIndex('key'   , 'key' );
                console.log("running onupgradeneeded");

            }
            this.openRequest.onsuccess = function(e) {
                console.log("running onsuccess");
                thisobj.db = e.target.result;
                if (typeof dbinit === "function") dbinit(db);
            }

            this.openRequest.onerror = function(e) {
                //Do something for the error
            }
//        },false);

    };

    InitLocalStorage.prototype.getPoi = function(gubun,s,callBack,like) {
        var range = null;
        if ( !like ) {
            range = IDBKeyRange.only(s);
        } else {
            range = IDBKeyRange.bound(s,s + '\uffff');
        }
//      var range = IDBKeyRange.bound('4000000000', '5000000000');

        var transaction = this.db.transaction([this.dbname],"readonly");
        var store = transaction.objectStore(this.dbname);

        var index = store.index(gubun);
        var rtn = [];
        var request = index.openCursor(range);
            request.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                var data = cursor.value;
//              alert(JSON.stringify(cursor.value));
                console.log(JSON.stringify(cursor.value));
                rtn.push(data);
                cursor.continue();
            } else {
                console.info("result",rtn.length>1?rtn:rtn[0], rtn.length);
                if (callBack) callBack(rtn);
            }
        }
    }

    InitLocalStorage.prototype.getPoiCount = function(gubun,s,callBack,like) {
        var range = null;
        if ( !like ) {
            range = IDBKeyRange.only(s);
        } else {
            range = IDBKeyRange.bound(s,s + '\uffff');
        }
        var transaction = this.db.transaction([this.dbname],"readonly");
        var store = transaction.objectStore(this.dbname);

        var index = store.index(gubun);
        var count = 0;
        var request = index.openCursor(range);
        request.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                var data = cursor.value;
//              alert(JSON.stringify(cursor.value));
//              console.log(JSON.stringify(cursor.value));
                count++;
                cursor.continue();
            } else {
                console.info("count",count);
                if (callBack) callBack(count);
            }
        }
    }

    InitLocalStorage.prototype.allPoi = function(callBack) {
        var transaction = this.db.transaction([this.dbname],"readonly");
        var store = transaction.objectStore(this.dbname);

        var request = store.openCursor(); // all
        var rtn = [];
        request.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
//              console.log(JSON.stringify(cursor.value));
                var data = cursor.value;
                rtn.push(data);
                cursor.continue();
            } else {
                console.info("result",rtn.length>1?rtn:rtn[0], rtn.length);
                if (callBack) callBack(rtn);
            }
        }

    }

    InitLocalStorage.prototype.addPoi = function(poi,callBack) {
        console.log("add : " + poi.id + "_" + poi.name + " / " );

        var transaction = this.db.transaction([this.dbname],"readwrite");
        var store = transaction.objectStore(this.dbname);

        //Define a poi
//      var person = {
//          name:name,
//          email:email,
//          created:new Date()
//      }

        poi.key = poi.id + "_" + poi.name;

        poi.created = new Date();

        //Perform the add
//      var request = store.add(person,1);
        var request = store.add(poi);

        request.onerror = function(e) {
            console.log("Error",e.target.error.name);
            //some type of error handler
            if (callBack) callBack(false);
        }

        request.onsuccess = function(e) {
            if (callBack) callBack(true);
        }
    }

    InitLocalStorage.prototype.delPoi = function(gubun,s,callBack,like) {
        var range = null;
        if ( !like ) {
            range = IDBKeyRange.only(s);
        } else {
            range = IDBKeyRange.bound(s,s + '\uffff');
        }

        var transaction = this.db.transaction([this.dbname],"readwrite");
        var store = transaction.objectStore(this.dbname);

        var index = store.index(gubun);
        var rtn = [];
        var request = index.openCursor(range);
        request.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                var data = cursor.value;
//              alert(JSON.stringify(cursor.value));
                console.log(JSON.stringify(cursor.value));
                rtn.push(data);
                cursor.delete();
                cursor.continue();
            } else {
                console.info("result",rtn.length>1?rtn:rtn[0], rtn.length);
                if (callBack) callBack(rtn);
            }
        }
    }