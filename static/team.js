
var elmStage = document.getElementById('stage');

var team = document.getElementById('team').innerHTML.toString().charCodeAt(0) - 65;

var SIO_PATH = '/socket.io';
var STAGE_CHANGE_EVENT = 'stage_change';
var BUTTON_EVENT = 'button';

var stageName = ['Persiapan', 'Ronde 1', 'Ronde 2', 'Ronde 3', 'Selesai'];

var socket = io({
  path: SIO_PATH,
  query: {
    client_type: 'team',
    team: team
  }
});

socket.on(STAGE_CHANGE_EVENT, function(stage) {
  elmStage.innerHTML = stageName[stage];
});

function onMouseDown() {
  socket.emit(BUTTON_EVENT, true);
}

function onMouseUp() {
  socket.emit(BUTTON_EVENT, false);
}

function onTouchStart() {
  onMouseDown();
}

function onTouchEnd() {
  onMouseUp();
}
