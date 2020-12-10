
///////////////////////////////////////////////////////////////
// time utils

function date() {
    return new Date();
}

function time() {
    return date().getTime();
}

function now() {
    return Date.now();
}

function startOfMonth() {
    var today = date(); 
    return new Date(today.getFullYear(), today.getMonth(), 1);
}

function startOfWeek() {
    var today = date(); 
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
}

function timeStr(date) {
    var h = zeropad(date.getHours());
    var m = zeropad(date.getMinutes());
    var s = zeropad(date.getSeconds());
    return h + ':' + m + ':' + s;
}

function todayStr() {
    var today = date();
    var d = zeropad(today.getDate());
    var m = zeropad(today.getMonth()+1);
    var y = zeropad(today.getYear());
    return m + '/' + d + '/' + y; // american time format fot sheets
}

///////////////////////////////////////////////////////////////
// string utils

function zeropad(n, count) {
    count = count || 2;
    return ('0'.repeat(count)+n).slice(-count);
}

///////////////////////////////////////////////////////////////
// math utils

function round(x, places) {
    var mult = Math.pow(10, places);
    return Math.round(x * mult) / mult;
}

