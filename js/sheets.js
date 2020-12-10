// metrics oauth client id
var CLIENT_ID = '920239214134-ktpv8aljjqo654usd56tfumkatfolgku.apps.googleusercontent.com';

// api stuff
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// metrics spreadsheet id
var SPREADSHEET_ID = '1O5jxu3OARmucV18CX2rk2AkTahZSgca29qZL4vcZ2QU';

var btnLogin = $('#login');
var btnLogout = $('#logout');
var pnlUpdate = $('#upd-pnl');
var frmUpdate = $('#upd-frm');
var btnUpdate = $('#update');
var btnRefresh = $('#refresh');
var txtTitle = $('#title');
var txtCategory = $('#category');
var pInit = $('#init');
var tTotalHours = $('#total-hours');
var tMonthHours = $('#month-hours');
var tWeekHours = $('#week-hours');
var tDayHours = $('#day-hours');
var statItems = [tTotalHours, tMonthHours, tWeekHours, tDayHours];

// from page.js
clearTime = clear;

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    
        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        initUI();
    });
}

function updateSigninStatus(isSignedIn) {
    log('updating sign in status: ' + isSignedIn);
    pInit.hide();
    if (isSignedIn) {
        btnLogin.hide();
        btnLogout.show();
        frmUpdate.show();
        initSignedIn();
    } else {
        btnLogin.show();
        btnLogout.hide();
        frmUpdate.hide();
    }
}

function initUI() {
    btnLogin.click(function() {
        gapi.auth2.getAuthInstance().signIn();
    });
    btnLogout.click(function() {
        gapi.auth2.getAuthInstance().signOut();
    });
    btnUpdate.click(update);
    btnUpdate.on('click', function() {
        btnUpdate.blur();
    });
    btnRefresh.click(refresh);
    btnRefresh.on('click', function() {
        btnRefresh.blur();
    });
}

function initSignedIn() {
    loadItems();
}

function loadItems() {

    // fetch metrics data
    read('Summary!A8:H12', function(values) {
	// save previous metrics for comparison
	var prevMetrics = [];
	$('#metrics-body tr').each(function() {
	    var row = [];
	    prevMetrics.push(row);
	    $('td', this).each(function() {
                row.push(parseFloat($(this).html()));
	    });
	});
	// clear table
	$('#metrics-head-row').empty();
	$('#metrics-btn-row').empty();
	$('#metrics-body').empty();
	// add headers
	var btnIdx = 0;
	for (value of values[0]) {
	    $('#metrics-head-row').append('<th>' + value.toLowerCase() + '</th>');
	    var btnHtml = "";
	    var btnId = `metric-btn-${btnIdx}`;
	    if (value != "") {
		btnHtml = `<button type="button" class="btn btn-default btn-xs" id="${btnId}">+1</button>`;
	    }
	    $('#metrics-btn-row').append(`<td class="metrics-cell">${btnHtml}</td>`)
	    if (btnHtml) {
		$(`#${btnId}`).click(new Function(`updateMetrics(${btnIdx})`));
		$(`#${btnId}`).on('click', function() {$(`#${btnId}`).blur()});
            }
            btnIdx++;
	}
	// add rest of table
	var count = 1;
	for (row of values.slice(1)) {
	    var rowid = `metrics-row-${count}`;
	    $('#metrics-body').append(`<tr id="${rowid}"></tr>`)
	    for (cell of row) {
	        $(`#${rowid}`).append('<td class="metrics-cell">' + cell.toLowerCase() + '</td>')
	    }
	    count++;
	}
	// compare to previous
	if (prevMetrics.length > 0) {
	    var row = 0;
	    $('#metrics-body tr').each(function() {
    	    var col = 0;
	        $('td', this).each(function() {
                    if (parseFloat($(this).html()) > prevMetrics[row][col]) {
		        highlight($(this), 'good');
		    }
		    col++;
	        });
	        row++;
	    });
	}
    });
    read('Summary!A1:B5', function(values) {
        var totalHours = values[4][1]; // B5
        var totalStr = `${totalHours}h`;
        var monthHours = values[3][1]; // B4
        var monthStr = `${monthHours}h`;
        var weekHours =  values[2][1]; // B3
        var weekStr = `${weekHours}h`;
        var dayHours =  values[1][1]; // B2
        var dayStr = `${dayHours}h`;

	// get previous stats (those displayed on page)
	var prevStats = {};
	for (item of statItems) {
	   if (item.html() != "") {
	       prevStats[item[0].id] = parseFloat(item.html());
	       log('prev for ' + item[0].id + ' is ' + parseFloat(item.html()));
	   }
	}
	// update stats
        tTotalHours.html(totalStr);
        tMonthHours.html(monthStr);
        tWeekHours.html(weekStr);
        tDayHours.html(dayStr);

	// compare stats for highlights
	for (item of statItems) {
	   var prev = prevStats[item[0].id];
	   if (prev) {
	       var cur = parseFloat(item.html());
	       log('cur for ' + item[0].id + ' is ' + cur);
	       if (cur > prev) {
	           highlight(item, 'good');
	       } else if (cur < prev) {
	           //highlight(item, 'bad');
		   continue; // don't highlight bad
	       }
	   }
	}
    });

    // fetch items for autocomplete (start later for some efficiency)
    read('Hours!A2:C', function(values) {
        var titles = new Set(); // for autocomplete
        var categories = new Set();
        var rows = values.slice(-20); // take just the last entries
        for (row of rows) {
	       titles.add(row[2]);
	       categories.add(row[1]);
        }
        log(`adding ${titles.size} titles and ${categories.size} categories to autocomplete`);
        txtTitle.autocomplete({
            source: Array.from(titles)
        });
        txtCategory.autocomplete({
            source: Array.from(categories)
        });
    });
}

function highlight(element, type) {
    var cls = 'glow-' + type;
    element.addClass(cls);
    element.on('animationend MSAnimationEnd webkitAnimationEnd oAnimationEnd', function(){
        element.removeClass(cls);
    });
}

function clearForm() {
    txtTitle.val('');
    txtCategory.val('');
}

function log(message) {
    console.log(message);
}

function refresh() {
    loadItems();
}

function update() {
    var category = txtCategory.val();
    var name = txtTitle.val();
    var value = (sw.minutes()/60).toFixed(2);
    if (name == '' || value == 0) {
        log('not adding: ' + name + ', ' + value);
        return;
    }
    updateLog(category, name, value, function() {
        clearForm();
        clearTime();
        loadItems();
    });
}

function updateLog(type, name, value, then) {
    var row = [todayStr(), type, name, value];
    log('adding: ' + row);
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Hours!A:D',
        values: [row],
        valueInputOption: 'USER_ENTERED',
    }).then(function(response) {
        var updates = JSON.parse(response.body)['updates'];
        log(updates);
        log('added ' + updates['updatedRows'] + ' rows at ' + updates['updatedRange']);
        then();
    }, handleError);
}

function updateMetrics(index) { 
    // start by fetching current value and row num for update
    read('Summary!A14:H15', function(values) {
        var rownum = values[0][1]; //B14
	var val = values[1][index];
	if (!val) val = 0;
	var newVal = parseInt(val) + 1;
        var col = String.fromCharCode('A'.charCodeAt() + index);
	var cell = `${col}${rownum}`
        log(`updating ${cell} with ${newVal}`);
        gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Log!${cell}`,
            values: [[newVal]],
            valueInputOption: 'USER_ENTERED',
        }).then(function(response) {
            var updates = JSON.parse(response.body);
            log(updates);
            log('updated ' + updates['updatedCells'] + ' cells at ' + updates['updatedRange']);
	    loadItems();
        }, handleError);
    });
}

function read(range, then) {
    log('fetching ' + range);
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
    }).then(function(response) {
        var values = response.result.values;
        if (values.length > 0) {
            log('read ' + values.length + ' rows from ' + range);
            then(values);
        } else {
            log('no data found');
        }
    }, handleError);
}

function handleError(response) {
    log('error: ' + response.result.error.message);
}

