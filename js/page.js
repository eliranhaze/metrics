
// elements
var btnStart = $('#start');
var btnClear = $('#clear');
var pTime = $('#time');
var pMs = $('#ms');
var details = $('#details');
var sum = $('#sum');
var docTitle = document.title;

// state
var started = false;

// TODO: store stuff with localStorage
$(document).ready(function() {
    btnStart.one('click', start);
    btnClear.on('click', clear);
    btnStart.on('click', function() {
        btnStart.blur();
    });
    btnClear.on('click', function() {
        btnClear.blur();
    });
});

function observer(text, ms) {
    pTime.text(text);
    pMs.text(ms);
    document.title = text;
}
var sw = new Stopwatch(observer);

window.onbeforeunload = function(e) {
    // ask before closing window if watch has started (return nothing otherwise)
    if (sw.total() > 0)
        return true;
}

function start() {
    if (!started) {
        sw.start();
        btnStart.text('pause'); 
        btnStart.one('click', pause);
        updPct();
        details.html(timeStr(date()));
        started = true;
    }
}

function pause() {
    sw.pause();
    btnStart.text('resume'); 
    btnStart.one('click', resume);
    updPct();
    document.title += ' [paused]';
    details.html(details.html() + '-' + timeStr(date()));
}

function resume() {
    sw.resume();
    btnStart.text('pause'); 
    btnStart.one('click', pause);
    updPct();
    document.title = document.title.slice(0,' [paused]'.length * -1);
    details.html(details.html() + '<br>' + timeStr(date()));
}

function clear() {
    if (started) {
        sw.stop();
        btnStart.text('start'); 
        btnStart.one('click', start);
        btnStart.off('click', pause);
        btnStart.off('click', resume);
        details.text('');
        sum.text('');
	document.title = docTitle;
        started = false;
    }
}

function updPct() {
    var abs = now() - sw.absStart;
    var total = sw.total();
    var pct = round(100 * (total / abs), 1);
    if (total == 0) {
        var pct = 100;
    }
    sum.text(pct + '%');
}

