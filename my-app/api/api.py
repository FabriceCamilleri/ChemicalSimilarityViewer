import time
from flask import Flask, request
import os
from flask import Flask, flash, request, redirect, url_for
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = '/path/to/the/uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', '.csv', '7z'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app = Flask(__name__)


@app.route('/post', methods=['POST'])
def updateCurrentName():
    return request.json


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/file', methods=['POST'])
def upload_file():
    # check if the post request has the file part
    print("req files :", request.files)
    return {'file': "test.csv"}
    # if 'file' not in request.files:
    #     print("test1")
    #     #flash('No file part')
    #     # return redirect(request.url)
    #     return {file: "first"}
    file = request.files['file']
    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if file.filename == '':
        #flash('No selected file')
        print("test2")
        # return redirect(request.url)
        return {file: "second"}
    if file and allowed_file(file.filename):
        print("i saved the file")
        # filename = secure_filename(file.filename)
        # file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        # return redirect(url_for('download_file', name=filename))
        return {file: "file.csv"}
