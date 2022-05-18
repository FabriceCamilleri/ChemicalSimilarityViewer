import time
from flask import Flask, request, send_file
from flask_cors import CORS
from flask.helpers import send_from_directory
import os
from flask import Flask, flash, request, redirect, url_for
from werkzeug.utils import secure_filename
import pandas as pd
import chemspace
import io


UPLOAD_FOLDER = '/path/to/the/uploads'
ALLOWED_EXTENSIONS = {'csv'}

app = Flask(__name__)
CORS(app)
#app = Flask(__name__, static_folder="../build", static_url_path="")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# NOTE: This route is needed for the default EB health check route


@app.route('/')
def home():
    return "ok"


@app.route('/api/post', methods=['POST'])
def updateCurrentName():
    return request.json


def allowed_file(filename):
    """The filename is accepted or not

    Parameters
    ----------
    filename : str
        The name of the file

    Returns
    -------
    boolean
        The extension belongs the allowed extensions
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/file', methods=['POST'])
def upload_file():
    """The main endpoint. The user has submitted a file and the back-end will process the calculation.

    Returns
    -------
    dict
        a json, containing the key which identify the work, in response to the front-end
    """
    # content's name must be "File"
    if 'File' not in request.files:
        print("if1")
        return {'nb_molecules': -1}

    file = request.files['File']
    print(file.filename)
    # file must be valid
    if file.filename == '' or file and not allowed_file(file.filename):
        print("if2")
        return {'nb_molecules': -1}

    # user choices is retrieved in the url
    index = request.args.get('index')
    indexName = request.args.get('nameIndex')
    # currently, 2 algos can be chosen
    listAlgo = [int(request.args.get('algo1')), int(request.args.get('algo2'))]
    # currently, 3 types of distances can be chosen
    listDist = [int(request.args.get('d1')), int(
        request.args.get('d2')), int(request.args.get('d3'))]
    # "[true, false]
    print("file=", file)
    # Reading of the csv's content
    df = pd.read_csv(request.files['File'], sep=";|,", header=None)
    print("df=", df)
    df = chemspace.createChemicalSpace(
        df, int(index), int(indexName), listAlgo, listDist)

    print("res\n", df)

    # return {'nb_molecules': df.shape[0]}
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False, sep=";")
    buffer.seek(0)
    return send_file(buffer, mimetype="text/csv")

# @app.route('/')
# def serve():
#     return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    app.run(port=8080)
