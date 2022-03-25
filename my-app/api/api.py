import time
from flask import Flask, request, send_file
from flask.helpers import send_from_directory
import os
from flask import Flask, flash, request, redirect, url_for
from werkzeug.utils import secure_filename
import pandas as pd
import chemspace


UPLOAD_FOLDER = '/path/to/the/uploads'
ALLOWED_EXTENSIONS = {'csv'}

app = Flask(__name__)
#app = Flask(__name__, static_folder="../build", static_url_path="")
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

    index = request.args.get('index')
    indexName = request.args.get('nameIndex')

    df = pd.read_csv(request.files['File'], header=None)
    df = chemspace.createChemicalSpace(df, int(index), int(indexName))

    print("res\n", df)

    # return {'nb_molecules': df.shape[0]}
    df.to_csv("res.csv", index=False)
    return send_file("res.csv")

# @app.route('/')
# def serve():
#     return send_from_directory(app.static_folder, 'index.html')


# if __name__ == "__main__":
#     app.run()
