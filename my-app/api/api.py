import time
from flask import Flask, request, send_file
import os
from flask import Flask, flash, request, redirect, url_for
from werkzeug.utils import secure_filename
import pandas as pd
import chemspace


UPLOAD_FOLDER = '/path/to/the/uploads'
ALLOWED_EXTENSIONS = {'csv'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/post', methods=['POST'])
def updateCurrentName():
    return request.json


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/file', methods=['POST'])
def upload_file():
    if 'File' not in request.files:
        return {'nb_molecules': -1}

    file = request.files['File']
    if file.filename == '' or file and not allowed_file(file.filename):
        return {'nb_molecules': -1}

    df = pd.read_csv(request.files['File'])
    # print(df)
    chemspace.createChemicalSpace(df, "smiles")
    # print(res)

    # return {'nb_molecules': df.shape[0]}

    return send_file("example20chemicalsCoords.csv")
