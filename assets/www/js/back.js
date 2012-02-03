// Wait for PhoneGap to load
//
document.addEventListener("deviceready", onDeviceReady, false);

function initDB(tx) {
	/*
	 * Each item is in one list. (multi-lists are not supported in first
	 * version)
	 * 
	 * This item expires in length(0-30) length_unit(day, week, month, year).
	 * 
	 * If this item is is_unique(1/0), it will occur in "defined expire item"
	 * list when adding new expire item. Whenever a new item is inserted, we'll
	 * check and set this property. Note that this unique is only over the same
	 * list.
	 */
	tx.executeSql('DROP TABLE IF EXISTS items');
	tx
			.executeSql('CREATE TABLE IF NOT EXISTS items (item_id INTEGER PRIMARY KEY, \
        		list_id INTEGER, \
        		name TEXT, \
        		thumbnail_url TEXT, \
        		added_date TEXT, \
        		expire_date TEXT, \
        		length INTEGER, \
        		length_unit TEXT, \
        		is_unique INTEGER, \
        		deleted INTEGER, \
        		FOREIGN KEY(list_id) REFERENCES lists(list_id))');
	tx.executeSql('DROP TABLE IF EXISTS lists');
	tx
			.executeSql('CREATE TABLE IF NOT EXISTS lists(id INTEGER PRIMARY KEY, name TEXT)');
	tx.executeSql('INSERT INTO lists(id, name) VALUES(1, "default")');
}

function setDummyItems(tx) {
	tx.executeSql("DELETE FROM items");
	tx
			.executeSql(
					'INSERT INTO items(name, thumbnail_url, added_date, expire_date, \
								length, length_unit, is_unique, deleted, list_id) \
								VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
					[ "Banana", "images/banana.png", "2012/01/01",
							"2012/01/29", 5, "weeks", 1, 0, 1 ]);
	tx
			.executeSql(
					'INSERT INTO items(name, thumbnail_url, added_date, expire_date, \
						length, length_unit, is_unique, deleted, list_id) \
						VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
					[ "Apple", "images/apple.jpg", "2011/01/01", "2011/11/01",
							10, "months", 1, 0, 1 ]);
}

function errorCB(err) {
	alert("Error processing SQL: " + err.message);
}

function successCB() {
	console.log("DB transaction success!");
}

// PhoneGap is ready
//
function onDeviceReady() {
	db = window.openDatabase("expirelist", "1.0", "Expire List DB", 1000000);
	db.transaction(initDB, errorCB, successCB);
	db.transaction(setDummyItems, errorCB, successCB);
	$.mobile.changePage("#homepage");
}
