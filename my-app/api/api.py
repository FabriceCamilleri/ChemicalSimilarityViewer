import time
from flask import Flask, request

app = Flask(__name__)


@app.route('/time')
def get_current_time():
    return {'time': time.time()}


@app.route('/post', methods=['POST'])
def updateCurrentName():
    # if key doesn't exist, returns None
    return request.json
