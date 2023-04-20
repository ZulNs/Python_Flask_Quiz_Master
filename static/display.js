var elmStage = document.getElementById('stage');

var elmTeamA = document.getElementById('team_a');
var elmTeamB = document.getElementById('team_b');
var elmTeamC = document.getElementById('team_c');
var elmTeamD = document.getElementById('team_d');

var elmMarkA = document.getElementById('mark_a');
var elmMarkB = document.getElementById('mark_b');
var elmMarkC = document.getElementById('mark_c');
var elmMarkD = document.getElementById('mark_d');

var elmScoreTotA = document.getElementById('score_tot_a');
var elmScoreTotB = document.getElementById('score_tot_b');
var elmScoreTotC = document.getElementById('score_tot_c');
var elmScoreTotD = document.getElementById('score_tot_d');

var elmTeam = [elmTeamA, elmTeamB, elmTeamC, elmTeamD];
var elmMark = [elmMarkA, elmMarkB, elmMarkC, elmMarkD];
var elmScoreTot = [elmScoreTotA, elmScoreTotB, elmScoreTotC, elmScoreTotD];

var colorTheme = ['orange', 'indigo', 'cyan', 'purple'];

var ctx = [];
var osc = [];
var gain = [];
var freq = [1047, 1319, 1568, 1760];

for (var i = 0; i < 4; i++) {
  ctx[i] = new AudioContext();
  osc[i] = null;
  gain[i] = null;
}

var audioRightAns = new Audio("/static/audio/right-answer.wav");
var audioWrongAns = new Audio("/static/audio/wrong-answer.wav");
var audioUpdScore = new Audio("/static/audio/update-score.wav");

var SIO_PATH = '/socket.io';
var INIT_DATA_EVENT = 'init_data';
var TEAM_CONNECTED_EVENT = 'team_connected';
var TEAM_DISCONNECTED_EVENT = 'team_disconnected';
var STAGE_CHANGE_EVENT = 'stage_change';
var BUTTON_EVENT = 'button';
var SELECT_TEAM_EVENT = 'select_team';
var MARK_ANSWER_EVENT = 'mark_answer';
var UPDATE_SCORE_EVENT = 'update_score';

var stageName = ['Persiapan', 'Ronde 1', 'Ronde 2', 'Ronde 3', 'Selesai'];
var currentStage = 0;

var socket = io({
  path: SIO_PATH,
  query: {
    client_type: 'display'
  }
});

socket.on('connect', function() {

});

socket.on(INIT_DATA_EVENT, function(data) {
  currentStage = data.stage;
  elmStage.innerHTML = stageName[currentStage];
  for (var i = 0; i < 4; i++) {
    if (data.available_team[i]) {
      showTeam(i);
    }
    if (data.selected_team[i]) {
      selectTeam(i);
      if (data.answer_mark[i] != null) {
        mark(i, data.answer_mark[i], false);
      }
      else {
        unmark(i);
      }
    }
    else if (data.highlighted_team[i]) {
      highlight(i);
    }
    elmScoreTot[i].innerHTML = data.total_score[i];
  }
});

socket.on(STAGE_CHANGE_EVENT, function(stage) {
  currentStage = stage;
  elmStage.innerHTML = stageName[stage];
  for (var i = 0; i < 4; i++) {
    unmark(i);
    unhighlight(i);
    unselectTeam(i);
    if (stage == 0) {
      elmScoreTot[i].innerHTML = 0;
    }
  }
});

socket.on(BUTTON_EVENT, function(data) {
  if (data.button) {
    highlight(data.team);
    ring(data.team);
  }
  else {
    if (currentStage == 0) {
      unhighlight(data.team);
    }
    stopRing(data.team);
  }
});

socket.on(TEAM_CONNECTED_EVENT, function(data) {
  showTeam(data);
});

socket.on(TEAM_DISCONNECTED_EVENT, function(data) {
  hideTeam(data);
});

socket.on(SELECT_TEAM_EVENT, function(data) {
  unhighlight(data.team);
  if (data.value) {
    selectTeam(data.team);
  }
  else {
    unmark(data.team);
    unselectTeam(data.team);
  }
});

socket.on(MARK_ANSWER_EVENT, function(data) {
  if (data.value != null) {
    mark(data.team, data.value);
  }
  else {
    unmark(data.team);
  }
});

socket.on(UPDATE_SCORE_EVENT, function(data) {
  var oldScore = parseInt(elmScoreTot[data.team].innerHTML);
  var total = oldScore + data.value;
  animateScore(elmScoreTot[data.team], oldScore, total, 1000);
});

function mark(team, mrk, playAudio=true) {
  if (mrk) {
    if (playAudio) {
      audioRightAns.play();
    }
    elmMark[team].className = 'fa fa-check w3-text-green';
  }
  else {
    if (playAudio) {
      audioWrongAns.play();
    }
    elmMark[team].className = 'fa fa-xmark w3-text-red';
  }
}

function unmark(team) {
  elmMark[team].className = '';
}

function ring(team) {
  if (osc[team] == null) {
    osc[team] = ctx[team].createOscillator();
    gain[team] = ctx[team].createGain();
    osc[team].type = 'sawtooth';
    osc[team].connect(gain[team]);
    osc[team].frequency.value = freq[team];
    gain[team].connect(ctx[team].destination);
    osc[team].start(0);
  }
}

function stopRing(team) {
  if (gain[team]) {
    gain[team].gain.exponentialRampToValueAtTime(0.00001, ctx[team].currentTime + 0.04);
    osc[team] = null;
    gain[team] = null;
  }
}

function animateScore(obj, start, end, duration) {
  audioUpdScore.play();
  var startTimestamp = null;
  var step = function(timestamp) {
    if (!startTimestamp) startTimestamp = timestamp;
    var progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function showTeam(team) {
  elmTeam[team].classList.remove('w3-hide');
}

function hideTeam(team) {
  elmTeam[team].classList.add('w3-hide');
}

function highlight(team) {
  elmTeam[team].classList.add('bg-highlight');
}

function unhighlight(team) {
  elmTeam[team].classList.remove('bg-highlight');
}

function selectTeam(team) {
  elmTeam[team].classList.remove('w3-text-' + colorTheme[team]);
  elmTeam[team].classList.add   ('w3-'      + colorTheme[team]);
}

function unselectTeam(team) {
  elmTeam[team].classList.remove('w3-'     + colorTheme[team]);
  elmTeam[team].classList.add   ('w3-text-' + colorTheme[team]);
}
