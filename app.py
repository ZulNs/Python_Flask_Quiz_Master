import socket

HOST = socket.gethostbyname_ex(socket.gethostname())[2]
HOST = HOST[len(HOST)-1]

print()
print('========================================================')
print(' Selamat datang di aplikasi Quiz-Master oleh ZulNs')
print('========================================================')
print(f' Alamat untuk tampilan: "http://{HOST}/"')
print()
print(f' Alamat untuk juri:     "http://{HOST}/juri"')
print()
print(f' Alamat untuk Regu A:   "http://{HOST}/regu/a"')
print(f' Alamat untuk Regu B:   "http://{HOST}/regu/b"')
print(f' Alamat untuk Regu C:   "http://{HOST}/regu/c"')
print(f' Alamat untuk Regu D:   "http://{HOST}/regu/d"')
print('========================================================')
print()

import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

SIO_PATH = '/socket.io'

INIT_DATA_EVENT = 'init_data'
TEAM_CONNECTED_EVENT = 'team_connected'
TEAM_DISCONNECTED_EVENT = 'team_disconnected'
STAGE_CHANGE_EVENT = 'stage_change'
BUTTON_EVENT = 'button'
SELECT_TEAM_EVENT = 'select_team'
MARK_ANSWER_EVENT = 'mark_answer'
UPDATE_SCORE_EVENT = 'update_score'

MASTER_CLIENT_TYPE = 'master'
TEAM_CLIENT_TYPE = 'team'
DISPLAY_CLIENT_TYPE = 'display'

DISPLAY_ROOM = 'display'

master_client = None
team_client = [None, None, None, None]
raced_team = -1
selected_team = False

cdata = {
  'stage': 0,
  'available_team': [False, False, False, False],
  'selected_team': [False, False, False, False],
  'highlighted_team': [False, False, False, False],
  'answer_mark': [None, None, None, None],
  'total_score': [0, 0, 0, 0]
}

app = Flask(__name__)
app.config['SECRET_KEY'] = 'ZulNs'
sio = SocketIO(app, path=SIO_PATH, cors_allowed_origins="*")
sio.init_app(app, async_mode="eventlet")

@app.route('/')
@app.route('/display')
def route_display():
  color = ['orange', 'indigo', 'cyan', 'purple']
  lcase = ['a', 'b', 'c', 'd']
  ucase = ['A', 'B', 'C', 'D']
  return render_template('display.html', title='Display', color=color, lcase=lcase, ucase=ucase)

@app.route('/master')
@app.route('/juri')
def route_master():
  stage = ['Persiapan', 'Ronde 1', 'Ronde 2', 'Ronde 3', 'Selesai']
  elmId = ['prepare', 'stage_1', 'stage_2', 'stage_3', 'finish']
  color = ['orange', 'indigo', 'cyan', 'purple']
  lcase = ['a', 'b', 'c', 'd']
  ucase = ['A', 'B', 'C', 'D']
  numch = ['0', '1', '2', '3', '4']
  if master_client == None:
    return render_template('master.html', title='Master', stage=stage, elmId=elmId, color=color, lcase=lcase, ucase=ucase, numch=numch)
  else:
    return f'Maaf, Master (Juri) sudah terdaftar sebelumnya!'

@app.route('/team/<team>')
@app.route('/regu/<team>')
def route_team(team):
  idx = None
  if len(team) == 1:
    idx = ord(team.lower()) - 97
    if 0 <= idx and idx <= 3:
      team = chr(65 + idx)
      if team_client[idx] == None:
        return render_template("team.html", title=f'Team {team}', team=team)
      else:
        return f'Maaf, Regu "{team}" sudah terdaftar!'
  return f'Maaf, Regu "{team}" tidak dikenal!!!'

@sio.on('connect')
def handle_connect():
  global master_client
  client_type = request.args.get('client_type')
  if client_type == MASTER_CLIENT_TYPE:
    master_client = request.sid
    emit(INIT_DATA_EVENT, cdata)
  elif client_type == TEAM_CLIENT_TYPE:
    team = int(request.args.get('team'))
    team_client[team] = request.sid
    cdata['available_team'][team] = True
    emit(TEAM_CONNECTED_EVENT, team, broadcast=True)
    emit(STAGE_CHANGE_EVENT, cdata['stage'])
  elif client_type == DISPLAY_CLIENT_TYPE:
    join_room(DISPLAY_ROOM)
    emit(INIT_DATA_EVENT, cdata)

@sio.on('disconnect')
def handle_disconnect():
  global master_client, raced_team
  client_type = request.args.get('client_type')
  if client_type == MASTER_CLIENT_TYPE:
    master_client = None
  elif client_type == TEAM_CLIENT_TYPE:
    team = int(request.args.get('team'))
    team_client[team] = None
    if raced_team == team:
      raced_team == -1
    cdata['available_team'][team] = False
    emit(TEAM_DISCONNECTED_EVENT, team, broadcast=True)
  elif client_type == DISPLAY_CLIENT_TYPE:
    leave_room(DISPLAY_ROOM)

@sio.on(STAGE_CHANGE_EVENT)
def handle_stage_change(stage):
  global selected_team, raced_team
  cdata['stage'] = stage
  cdata['selected_team'] = [False, False, False, False]
  cdata['highlighted_team'] = [False, False, False, False]
  #cdata['answer_mark'] = [None, None, None, None]
  selected_team = False
  raced_team = -1
  if stage == 0:
    cdata['total_score'] = [0, 0, 0, 0]
  emit(STAGE_CHANGE_EVENT, stage, broadcast=True)

@sio.on(BUTTON_EVENT)
def handle_team_connected(pressed):
  global raced_team
  team = int(request.args.get('team'))
  dlvr = {'team': team, 'button': pressed}
  if cdata['stage'] == 0:
    cdata['highlighted_team'][team] = pressed
  elif raced_team == team and not pressed:
    pass
  elif cdata['stage'] == 2 and selected_team and not cdata['selected_team'][team] and pressed and raced_team == -1:
    raced_team = team
    cdata['highlighted_team'][team] = True
  elif cdata['stage'] == 3 and not selected_team and pressed and raced_team == -1:
    raced_team = team
    cdata['highlighted_team'][team] = True
  else:
    return
  emit(BUTTON_EVENT, dlvr, broadcast=True)


@sio.on(SELECT_TEAM_EVENT)
def handle_select_team(data):
  global selected_team, raced_team
  cdata['selected_team'][data['team']] = data['value']
  cdata['highlighted_team'][data['team']] = False
  selected_team = (cdata['selected_team'] != [False, False, False, False])
  if data['value']:
    cdata['answer_mark'][data['team']] = None
  elif not data['value'] and data['team'] == raced_team:
    raced_team = -1
  emit(SELECT_TEAM_EVENT, data, to=DISPLAY_ROOM)

@sio.on(MARK_ANSWER_EVENT)
def handle_mark_answer(data):
  cdata['answer_mark'][data['team']] = data['value']
  emit(MARK_ANSWER_EVENT, data, to=DISPLAY_ROOM)

@sio.on(UPDATE_SCORE_EVENT)
def handle_update_score(data):
  cdata['total_score'][data['team']] += data['value']
  emit(UPDATE_SCORE_EVENT, data, to=DISPLAY_ROOM)

if __name__ == '__main__':
  sio.run(app, host=HOST, port=80, debug=False)
