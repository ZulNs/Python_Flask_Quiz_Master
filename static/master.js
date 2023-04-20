var elmStagePrepare = document.getElementById('prepare');
var elmStage1       = document.getElementById('stage_1');
var elmStage2       = document.getElementById('stage_2');
var elmStage3       = document.getElementById('stage_3');
var elmStageFinish  = document.getElementById('prepare');

var elmTeamA = document.getElementById('team_a');
var elmTeamB = document.getElementById('team_b');
var elmTeamC = document.getElementById('team_c');
var elmTeamD = document.getElementById('team_d');

var elmSelectA = document.getElementById('select_a');
var elmSelectB = document.getElementById('select_b');
var elmSelectC = document.getElementById('select_c');
var elmSelectD = document.getElementById('select_d');

var elmSelectChkA = document.getElementById('select_chk_a');
var elmSelectChkB = document.getElementById('select_chk_b');
var elmSelectChkC = document.getElementById('select_chk_c');
var elmSelectChkD = document.getElementById('select_chk_d');

var elmAnswerA = document.getElementById('answer_a');
var elmAnswerB = document.getElementById('answer_b');
var elmAnswerC = document.getElementById('answer_c');
var elmAnswerD = document.getElementById('answer_d');

var elmAnsRightA = document.getElementById('ans_right_a');
var elmAnsRightB = document.getElementById('ans_right_b');
var elmAnsRightC = document.getElementById('ans_right_c');
var elmAnsRightD = document.getElementById('ans_right_d');

var elmAnsWrongA = document.getElementById('ans_wrong_a');
var elmAnsWrongB = document.getElementById('ans_wrong_b');
var elmAnsWrongC = document.getElementById('ans_wrong_c');
var elmAnsWrongD = document.getElementById('ans_wrong_d');

var elmScoreA = document.getElementById('score_a');
var elmScoreB = document.getElementById('score_b');
var elmScoreC = document.getElementById('score_c');
var elmScoreD = document.getElementById('score_d');

var elmScoreValA = document.getElementById('score_val_a');
var elmScoreValB = document.getElementById('score_val_b');
var elmScoreValC = document.getElementById('score_val_c');
var elmScoreValD = document.getElementById('score_val_d');

var elmScoreTotA = document.getElementById('score_tot_a');
var elmScoreTotB = document.getElementById('score_tot_b');
var elmScoreTotC = document.getElementById('score_tot_c');
var elmScoreTotD = document.getElementById('score_tot_d');

var elmStage = [elmStagePrepare, elmStage1, elmStage2, elmStage3, elmStageFinish];
var elmTeam = [elmTeamA, elmTeamB, elmTeamC, elmTeamD];
var elmSelect = [elmSelectA, elmSelectB, elmSelectC, elmSelectD];
var elmSelectChk = [elmSelectChkA, elmSelectChkB, elmSelectChkC, elmSelectChkD];
var elmAnswer = [elmAnswerA, elmAnswerB, elmAnswerC, elmAnswerD];
var elmAnsRight = [elmAnsRightA, elmAnsRightB, elmAnsRightC, elmAnsRightD];
var elmAnsWrong = [elmAnsWrongA, elmAnsWrongB, elmAnsWrongC, elmAnsWrongD];
var elmScore = [elmScoreA, elmScoreB, elmScoreC, elmScoreD];
var elmScoreVal = [elmScoreValA, elmScoreValB, elmScoreValC, elmScoreValD];
var elmScoreTot = [elmScoreTotA, elmScoreTotB, elmScoreTotC, elmScoreTotD];

var colorTheme = ['orange', 'indigo', 'cyan', 'purple'];

var SIO_PATH = '/socket.io';
var INIT_DATA_EVENT = 'init_data';
var TEAM_CONNECTED_EVENT = 'team_connected';
var TEAM_DISCONNECTED_EVENT = 'team_disconnected';
var STAGE_CHANGE_EVENT = 'stage_change';
var BUTTON_EVENT = 'button';
var SELECT_TEAM_EVENT = 'select_team';
var MARK_ANSWER_EVENT = 'mark_answer';
var UPDATE_SCORE_EVENT = 'update_score';

var currentStage = 0;

var socket = io({
  path: SIO_PATH,
  query: {
    client_type: 'master'
  }
});

socket.on('connect', function() {

});

socket.on(INIT_DATA_EVENT, function(data) {
  currentStage = data.stage;
  elmStage[currentStage].checked = true;
  if (0 < currentStage && currentStage < 4) {
    disableElm(elmStagePrepare.parentElement);
    elmStagePrepare.name = '';
  }
  for (var i = 0; i < 4; i++) {
    if (data.available_team[i]) {
      showTeam(i);
    }
    if (data.selected_team[i]) {
      elmSelectChk[i].checked = true;
      selectTeam(i, false);
      if (data.answer_mark[i] != null) {
        enableElm(elmScore[i]);
        if (data.answer_mark[i]) {
          elmAnsRight[i].checked = true;
        }
        else {
          elmAnsWrong[i].checked = true;
        }
        markAnswer(i, data.answer_mark[i], false);
      }
    }
    else if (data.highlighted_team[i]) {
      highlight(i);
    }
    elmScoreTot[i].innerHTML = data.total_score[i];
  }
});

socket.on(BUTTON_EVENT, function(data) {
  if (data.button) {
    if (currentStage == 3) {
      enableElm(elmSelect[data.team]);
    }
    elmSelectChk[data.team].focus();
    highlight(data.team);
  }
  else {
    if (currentStage == 0) {
      unhighlight(data.team);
    }
  }
});

socket.on(TEAM_CONNECTED_EVENT, function(data) {
  showTeam(data);
});

socket.on(TEAM_DISCONNECTED_EVENT, function(data) {
  hideTeam(data);
});

function changeStage(stage) {
  if (currentStage == stage) {
    return;
  }
  currentStage = stage;
  if (0 < stage && stage < 4) {
    disableElm(elmStagePrepare.parentElement);
    elmStagePrepare.name = '';
  }
  else {
    enableElm(elmStagePrepare.parentElement);
    elmStagePrepare.name = 'stage';
  }
  for (var i = 0; i < 4; i++) {
    unhighlight(i);
    if (stage == 0) {
      elmScoreTot[i].innerHTML = 0;
    }
    if (elmSelectChk[i].checked) {
      elmSelectChk[i].checked = false;
      selectTeam(i, false);
    }
    else if (stage == 3) {
      disableElm(elmSelect[i]);
    }
    else {
      enableElm(elmSelect[i]);
    }
  }
  socket.emit(STAGE_CHANGE_EVENT, stage);
}

function selectTeam(team, toEmit=true) {
  var data = {'team': team, 'value': false};
  if (elmSelectChk[team].checked) {
    elmTeam[team].classList.remove('w3-text-' + colorTheme[team]);
    elmTeam[team].classList.add   ('w3-'      + colorTheme[team]);
    if (currentStage != 0 && currentStage != 4) {
      enableElm(elmAnswer[team]);
      elmAnsRight[team].focus();
    }
    unhighlight(team);
    data.value = true;
  }
  else {
    elmTeam[team].classList.remove('w3-'     + colorTheme[team]);
    elmTeam[team].classList.add   ('w3-text-' + colorTheme[team]);
    elmAnsRight[team].checked = false;
    elmAnsWrong[team].checked = false;
    disableElm(elmAnswer[team]);
    disableElm(elmScore[team]);
    if (currentStage == 3) {
      disableElm(elmSelect[team]);
    }
  }
  if (toEmit) {
    socket.emit(SELECT_TEAM_EVENT, data);
  }
}

function markAnswer(team, ans, toEmit=true) {
  var data = {'team': team, 'value': null};
  if (ans && elmAnsRight[team].checked) {
    elmAnsWrong[team].checked = false;
    enableElm(elmScore[team]);
    elmScoreVal[team].focus();
    data.value = true;
  }
  else if (!ans && elmAnsWrong[team].checked) {
    elmAnsRight[team].checked = false;
    enableElm(elmScore[team]);
    elmScoreVal[team].focus();
    data.value = false;
  }
  else {
    disableElm(elmScore[team]);
  }
  if (toEmit) {
    socket.emit(MARK_ANSWER_EVENT, data);
  }
}

function updateScore(team) {
  var score = Math.abs(parseInt(elmScoreVal[team].value));
  if (score) {
    if (elmAnsWrong[team].checked) {
      score = -score;
    }
    var oldScore = parseInt(elmScoreTot[team].innerHTML);
    var total = oldScore + score;
    socket.emit(UPDATE_SCORE_EVENT, {'team': team, 'value': score});
    animateScore(elmScoreTot[team], oldScore, total, 1000);
    elmScoreVal[team].value = "";
  }
  elmSelectChk[team].focus();
}

function animateScore(elm, start, end, duration) {
  var startTimestamp = null;
  var step = function(timestamp) {
    if (!startTimestamp) startTimestamp = timestamp;
    var progress = Math.min((timestamp - startTimestamp) / duration, 1);
    elm.innerHTML = Math.floor(progress * (end - start) + start);
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

function disableElm(elm) {
  elm.classList.add('w3-disabled');
}

function enableElm(elm) {
  elm.classList.remove('w3-disabled');
}
