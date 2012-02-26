//Listen for any attempts to call changePage().
$(document).bind("pagebeforechange", function(e, data) {

	// We only want to handle changePage() calls where the caller is
	// asking us to load a page by URL.
	if (typeof data.toPage === "string") {
		// We are being asked to load a page by URL, but we only
		// want to handle URLs that request the data for a specific
		// category.
		var u = $.mobile.path.parseUrl(data.toPage);

		if (u.hash.search(/^#homepage/) !== -1) {
			showList(u, data.options);

			// Make sure to tell changePage() we've handled this call so it
			// doesn't
			// have to do anything.
			e.preventDefault();
		} else if (u.hash.search(/^#editpage/) !== -1) {
			predictExpireDate();
			// editItem(u, data.options);
			// e.preventDefault();
		} else if (u.hash.search(/^#addpage/) !== -1) {
			showAddList(u, data.options);
			e.preventDefault();
		}
	}
});

function predictExpireDate() {
	var length = parseInt($('#expire').val());
	var unit = $('input:radio[name=unit]:checked').val();
	var now = new Date();
	if ($('#added_date').val() != 'null')
		now = new Date($('#added_date').val());

	var expire = now;
	if (unit == "days")
		expire.setDate(now.getDate() + length);
	else if (unit == "weeks")
		expire.setDate(now.getDate() + length * 7);
	else if (unit == "months")
		expire.setMonth(now.getMonth() + length);
	else if (unit == "years")
		expire.setYear(now.getYear() + length);
	$("#predicted_expire_date").html(
			"(expires on date:  " + expire.toLocaleDateString() + ")");
}

function date2string(date) {
	return date.toString();
	// return date.getFullYear() + '/' + (date.getMonth()+1) + '/' +
	// date.getDate();
}

function date2shortString(date) {
	return date.getFullYear() + '/' + (date.getMonth() + 1) + '/'
			+ date.getDate();
}
function calcExpireDate(now, length, unit) {
	var expire = now;
	if (unit == "days")
		expire.setDate(now.getDate() + length);
	else if (unit == "weeks")
		expire.setDate(now.getDate() + length * 7);
	else if (unit == "months")
		expire.setMonth(now.getMonth() + length);
	else if (unit == "years")
		expire.setYear(now.getYear() + length);
	return expire;
}

function removeNotifications(item_id) {
	for ( var i = 0; i < 10; i++)
		plugins.localNotification.cancel(item_id * 10 + i);
}

function addNotifications(item_id, name, expire_date) {
	var now = new Date();
	for ( var i = 0; i < 10; i++) {
		notification_date = expire_date;
		notification_date.setDate(expire_date.getDate() + i - 2);
		if (notification_date < now)
			continue;

		plugins.localNotification.add({
			date : notification_date,
			message : name + " need to be finished!",
			id : item_id * 10 + i
		});
	}
}

function saveItem(name, thumbnail_url, length, unit) {
	if (name == null)
		name = $('#name').val();
	if (thumbnail_url == null)
		thumbnail_url = $('.thumb').attr("src");
	if (length == null)
		length = parseInt($('#expire').val());
	if (unit == null)
		unit = $('input:radio[name=unit]:checked').val();
	var now = new Date();

	if ($('#added_date').val() != 'null')
		now = new Date($('#added_date').val());

	var expire = calcExpireDate(now, length, unit);
	var added_date = date2string(now);
	var expire_date = date2string(expire)
	db.transaction(function(tx) {
		tx.executeSql("UPDATE items SET is_unique = 0 WHERE list_id=?"
				+ " AND name=? AND thumbnail_url=? AND length=?"
				+ " AND length_unit=?",
				[ 1, name, thumbnail_url, length, unit ]);
		if ($('#item_id').val() != 'null') {
			removeNotifications(parseInt($('#item_id').val()));
			addNotifications(parseInt($('#item_id').val()), name, expire);
			tx.executeSql("UPDATE items SET name=?, thumbnail_url=?, "
					+ "added_date=?, expire_date=?, length=?, "
					+ "length_unit=?, is_unique=?, deleted=? "
					+ "WHERE item_id=?", [ name, thumbnail_url, added_date,
					expire_date, length, unit, 1, 0, $('#item_id').val() ]);
		} else {
			tx.executeSql("INSERT INTO items(list_id, name, thumbnail_url, "
					+ "added_date, expire_date, length, length_unit, "
					+ "is_unique, deleted) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)",
					[ 1, name, thumbnail_url, added_date, expire_date, length,
							unit, 1, 0 ]);
			tx.executeSql(
					"SELECT item_id FROM items ORDER BY item_id DESC LIMIT 1",
					[], function(tx, results) {
						addNotifications(results.rows.item(0).item_id, name, expire);
					}, errorCB);
		}
	}, errorCB, successCB);
}

function expireSet(dateText) {
	var expireDate = new Date(dateText);
	var nowDate = new Date();
	var leftDays = (expireDate - nowDate) / 3600 / 1000 / 24;
	var length = Math.abs(leftDays);
	var unit = "days";
	if (length > 60) {
		unit = "months";
		length /= 30;
	} else if (length > 14) {
		unit = "weeks";
		length /= 7;
	}
	var className = "green";
	var end = "left";
	if (leftDays < 7)
		className = "orange-warning";
	if (leftDays < 0) {
		className = "red-warning";
		end = "expired";
	}
	return {
		expire_class : className,
		expire_string : Math.round(length) + " " + unit + " " + end
	}
}

function expireHtml(dateText) {
	var expireDate = new Date(dateText);
	var nowDate = new Date();
	var leftDays = (expireDate - nowDate) / 3600 / 1000 / 24;
	var length = Math.abs(leftDays);
	var unit = "days";
	if (length > 60) {
		unit = "months";
		length /= 30;
	} else if (length > 14) {
		unit = "weeks";
		length /= 7;
	}
	var className = "green";
	var end = "left";
	if (leftDays < 7)
		className = "orange-warning";
	if (leftDays < 0) {
		className = "red-warning";
		end = "expired";
	}
	return '<p><strong class="' + className + '">' + Math.round(length) + " "
			+ unit + " " + end + '</strong></p>';
}

function deleteItem(item_id, name) {
	navigator.notification.confirm("Are you sure to delete item " + name + "?",
			function() {
				db.transaction(function(tx) {
					tx.executeSql("UPDATE items SET deleted=1 WHERE item_id=?",
							[ item_id ])
				}, errorCB, function() {
					console.log("Delete success!");
					$("#item_" + item_id).remove();
				})
			});
}

// <ul></ul> will be taken out by .html() method
$
		.template(
				"showItemTemplate",
				'<ul><li id="item_${item_id}"><a href="#editpage" onclick="setEditItem(\'${name}\', \
						\'${thumbnail_url}\', ${length}, \'${unit}\', ${item_id}, \'${added_date}\')"> <img src="${thumbnail_url}" />\
					<h3>${name}</h3>\
					<p>Added on ${added_date}</p>\
					<p><strong class="${expire_class}">${expire_string}</strong></p></a>\
				<a href="#homepage" onclick="deleteItem(${item_id}, \'${name}\')">\
				whatever</a></li></ul>');

function showList(urlObj, options) {
	db
			.transaction(function(tx) {
				tx
						.executeSql(
								"SELECT * FROM items WHERE deleted=0 ORDER BY expire_date",
								[],
								function(tx, results) {
									// Get the page we are going to dump our
									// content into.
									var $page = $("#homepage"),

									// Get the header for the page.
									$header = $page
											.children(":jqmData(role=header)"),

									// Get the content area element for the
									// page.
									$content = $page
											.children(":jqmData(role=content)"),

									// The markup we are going to inject into
									// the content
									// area of the page.
									markup = '<ul data-role="listview" data-split-icon="delete">',

									// The number of items in the category.
									numItems = results.rows.length;

									// Generate a list item for each item in the
									// category
									// and add it to our markup.
									for ( var i = 0; i < numItems; i++) {
										var item = {
											added_date : date2shortString(new Date(
													results.rows.item(i).added_date)),
											item_id : results.rows.item(i).item_id,
											name : results.rows.item(i).name,
											thumbnail_url : results.rows
													.item(i).thumbnail_url,
											length : results.rows.item(i).length,
											unit : results.rows.item(i).length_unit
										};
										var expire_date = new Date(results.rows
												.item(i).expire_date);
										item.expire_date = date2shortString(expire_date);
										expire_set = expireSet(expire_date);
										item.expire_string = expire_set.expire_string;
										item.expire_class = expire_set.expire_class;
										markup += $.tmpl("showItemTemplate",
												item).html();
									}
									markup += "</ul>";

									// Inject the category items markup into the
									// content element.
									$content.html(markup);

									// Pages are lazily enhanced. We call page()
									// on the page
									// element to make sure it is always
									// enhanced before we
									// attempt to enhance the listview markup we
									// just injected.
									// Subsequent calls to page() are ignored
									// since a page/widget
									// can only be enhanced once.
									$page.page();

									// Enhance the listview we just injected.
									$content.find(":jqmData(role=listview)")
											.listview();
									// We don't want the data-url of the page we
									// just modified
									// to be the url that shows up in the
									// browser's location field,
									// so set the dataUrl option to the URL for
									// the category
									// we just loaded.
									options.dataUrl = urlObj.href;

									// Now call changePage() and tell it to
									// switch to
									// the page we just modified.
									$.mobile.changePage($page, options);
								}, errorCB);
			});
}

function setEditItem(name, thumbnail_url, length, unit, item_id, added_date) {
	// See
	// https://forum.jquery.com/topic/how-to-dynamically-change-the-value-of-a-slider
	$("#editpage").page();

	$('#name').val(name);
	$('.thumb').attr("src", thumbnail_url);
	$('#expire').val(length);
	$('input:radio[name=unit]:checked').attr('checked', false);
	$('#radio-' + unit).attr('checked', true);

	if (item_id != null) {
		$('#item_id').val(item_id);
		$('#added_date').val(added_date);
	} else {
		$('#item_id').val("null");
		$('#added_date').val("null");
	}

	$("#expire").slider("refresh");
	$('input:radio').checkboxradio("refresh");
}

function resetEditItem() {
	$('#name').val("");
	$('.thumb').attr("src", "images/default.png");
	$('#expire').val(10);
	$('input:radio[name=unit]:checked').attr('checked', false);
	$('#radio-days').attr('checked', true);
	$('#item_id').val("null");
	$('#added_date').val("null");
	$('input:radio').checkboxradio("refresh");
	$("#expire").slider("refresh");
}

function takePhoto() {
	navigator.camera.getPicture(onSuccess, onFail, {
		quality : 50,
		destinationType : Camera.DestinationType.FILE_URI,
		targetWidth : 80,
		targetHeight : 80
	});

	function onSuccess(imageURI) {
		// alert(imageURI);
		$('.thumb').attr("src", imageURI);
		// $("#editpage").page();
	}

	function onFail(message) {
		alert('Failed because: ' + message);
	}
}

// <ul></ul> will be taken out by .html() method
$
		.template(
				"addItemTemplate",
				'<ul><li><a href="#homepage" onclick="saveItem(\'${name}\', \'${thumbnail_url}\', ${length}, \'${unit}\')">\
				<img src="${thumbnail_url}" /><h3>${name}</h3>\
					<p>Expire on ${expire_date}</p>\
					<p><strong class="${expire_class}">${expire_string}</strong></p></a>\
				<a href="#editpage" onclick="setEditItem(\'${name}\', \
				\'${thumbnail_url}\', ${length}, \'${unit}\')"> \
				whatever</a></li></ul>');

function showAddList(urlObj, options) {
	db
			.transaction(function(tx) {
				tx
						.executeSql(
								"SELECT * FROM items WHERE is_unique=1 ORDER BY name",
								[],
								function(tx, results) {
									// Get the page we are going to dump our
									// content into.
									var $page = $("#addpage"),

									// Get the header for the page.
									$header = $page
											.children(":jqmData(role=header)"),

									// Get the content area element for the
									// page.
									$content = $page
											.children(":jqmData(role=content)"),

									// The markup we are going to inject into
									// the content
									// area of the page.
									markup = '<ul data-role="listview" data-split-icon="gear">',

									// The number of items in the category.
									numItems = results.rows.length;

									// TODO Why the add a new type button
									// changes style after the first adding?
									markup += '<li><a href="#editpage" data-role="button" \
										onclick="resetEditItem()">Add a new type\
													of expire item</a></li>\
												<li data-role="list-divider">Add defined expire item:</li>'

									// Generate a list item for each item in the
									// category
									// and add it to our markup.
									for ( var i = 0; i < numItems; i++) {
										var item = {
											name : results.rows.item(i).name,
											thumbnail_url : results.rows
													.item(i).thumbnail_url,
											length : results.rows.item(i).length,
											unit : results.rows.item(i).length_unit
										};
										var expire_date = calcExpireDate(
												new Date(), item.length,
												item.unit);
										item.expire_date = date2shortString(expire_date);
										expire_set = expireSet(expire_date);
										item.expire_string = expire_set.expire_string;
										item.expire_class = expire_set.expire_class;
										markup += $.tmpl("addItemTemplate",
												item).html();
									}
									markup += "</ul>";

									// Inject the category items markup into the
									// content element.
									$content.html(markup);

									// Pages are lazily enhanced. We call page()
									// on the page
									// element to make sure it is always
									// enhanced before we
									// attempt to enhance the listview markup we
									// just injected.
									// Subsequent calls to page() are ignored
									// since a page/widget
									// can only be enhanced once.
									$page.page();

									// Enhance the listview we just injected.
									$content.find(":jqmData(role=listview)")
											.listview();
									// We don't want the data-url of the page we
									// just modified
									// to be the url that shows up in the
									// browser's location field,
									// so set the dataUrl option to the URL for
									// the category
									// we just loaded.
									options.dataUrl = urlObj.href;

									// Now call changePage() and tell it to
									// switch to
									// the page we just modified.
									$.mobile.changePage($page, options);
								}, errorCB);
			});
}