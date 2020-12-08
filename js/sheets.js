// stopwatch client id
var CLIENT_ID = '920239214134-9hgqb8jm5jdag9vpnuc1ohn7dljh3vql.apps.googleusercontent.com';

// api stuff
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// intellecting spreadsheet id
var SPREADSHEET_ID = '1vdCniswTZHnMOgVZe3GS_tzvZtgctes1OkPKCD8LP4o';

var btnLogin = $('#login');
var btnLogout = $('#logout');
var pnlUpdate = $('#upd-pnl');
var frmUpdate = $('#upd-frm');
var btnUpdate = $('#update');
var btnRefresh = $('#refresh');
var txtTitle = $('#title');
var selType = $('#type');
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

    // add category options if empty
    if (selType.find('option').length == 0) {
        read('Categories!A2:A', function(values) {
            for (i = 0; i < values.length; i++) {
                selType.append($("<option />").text(values[i]));
            }
        });
    }

    read('Data!A1:B8', function(values) {
	    // TODO: generate rows and their labels from the data instead of having them hardcoded
        var totalHours = values[0][1]; // B1
        var totalUtil = values[1][1]; // B2
        var totalStr = `${totalHours}h (${totalUtil})`;
        var monthHours = values[2][1]; // B3
        var monthUtil = values[3][1]; // B4
        var monthStr = `${monthHours}h (${monthUtil})`;
        var weekHours =  values[4][1]; // B5
        var weekUtil =  values[5][1]; // B6
        var weekStr = `${weekHours}h (${weekUtil})`;
        var dayHours =  values[6][1]; // B7
        var dayUtil =  values[7][1]; // B8
        var dayStr = `${dayHours}h (${dayUtil})`;

	// get previous stats
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
	           highlight(item, 'bad');
	       }
	   }
	}
    });

    // fetch items for autocomplete (start later for some efficiency)
    read('Log!A1800:C', function(values) {
        var titles = new Set(); // for autocomplete
        var today = date();
        for (i = 0; i < values.length; i++) {
            var row = values[i];
            var itemDate = parseDate(row[0]);
            // autocomplete
            if (daysDiff(today, itemDate) < 14) {
                titles.add(row[2]);
            }
        }
        log('adding ' + titles.size + ' titles to autocomplete');
        txtTitle.autocomplete({
            source: Array.from(titles)
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
    selType.removeAttr('selected');
}

function pct(x, y) {
    return (100*x/y).toFixed(1) + '%';
}

function parseDate(str) {
    var spl = str.split('/');
    var d = spl[0];
    var m = parseInt(spl[1]) - 1; // zero indexed
    var y = '20' + spl[2];
    return new Date(y, m, d);
}

function daysDiff(date1, date2) {
    return hoursDiff(date1, date2)/24;
}

function hoursDiff(date1, date2) {
    return (date1 - date2)/1000/60/60;
}

function log(message) {
    console.log(message);
}

function refresh() {
    loadItems();
}

function update() {
    var type = selType.val();
    var name = txtTitle.val();
    var value = (sw.minutes()/60).toFixed(2);
    if (name == '' || value == 0) {
        log('not adding: ' + name + ', ' + value);
        return;
    }
    updateLog(type, name, value, function() {
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
        range: 'Log!A:D',
        values: [row],
        valueInputOption: 'USER_ENTERED',
    }).then(function(response) {
        var updates = JSON.parse(response.body)['updates'];
        log(updates);
        log('added ' + updates['updatedRows'] + ' rows at ' + updates['updatedRange']);
        then();
    }, handleError);
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

