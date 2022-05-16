import time
from flask import Flask, request, send_file
from flask.helpers import send_from_directory
import os
from flask import Flask, flash, request, redirect, url_for
from werkzeug.utils import secure_filename
import pandas as pd
import chemspace
import io
from rq import Queue
from worker import conn


UPLOAD_FOLDER = '/path/to/the/uploads'
ALLOWED_EXTENSIONS = {'csv'}

# app = Flask(__name__)
app = Flask(__name__, static_folder="../build", static_url_path="/")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Dictionnaire stockant les travaux soumis
df = {}


def createKey():
    """ Return a unique newly created key (based on time). """
    id = time.time_ns()
    print("ID IS EQUAL TO : ", id)
    return "df" + str(id)


@app.route('/post', methods=['POST'])
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


@app.route('/file', methods=['POST'])
def upload_file():
    """The main endpoint. The user has submitted a file and the back-end will process the calculation.

    Returns
    -------
    dict
        a json, containing the key which identify the work, in response to the front-end
    """
    global df
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
    # df = pd.read_csv(request.files['File'], sep=";|,", header=None)

    # Reading of the csv's content
    work = pd.read_csv(request.files['File'], sep=";|,", header=None)
    print("df=", df)

    # Creation of the worker
    q = Queue(connection=conn)

    # df = q.enqueue(chemspace.createChemicalSpace, args=(
    #     df, int(index), int(indexName), listAlgo, listDist))
    # Adding of a work (computation of the points by using the algorithm) to the worker
    work = q.enqueue(chemspace.createChemicalSpace, result_ttl=86400, args=(
        work, int(index), int(indexName), listAlgo, listDist))

    # Creation of a unique key which will be linked to this work
    key = createKey()

    df[key] = work

    print("------------------------")
    print("df[", key, "] = ", df[key])
    print("res=", df[key].result)
    print("------------------------")

    # Front-end will receive the reference of the work
    return {'key': key}

    # time.sleep(25)

    # print("res=", df.result)

    # # return {'nb_molecules': df.shape[0]}
    # buffer = io.BytesIO()
    # df.result.to_csv(buffer, index=False, sep=";")
    # buffer.seek(0)
    # return send_file(buffer, mimetype="text/csv")


@app.route("/fetchForDf")
def fetchForDf():
    """Called by the front-end instantly when launching the application.

    Returns
    -------
    dict
        a json, containing all the keys which identify the work and the state of it, in response to the front-end
    """
    print("user fetching for DF: ", df.keys())
    # if the dictionnary is empty
    if(len(df.keys()) == 0):
        print("empty df here")
        return {"dico": "Empty"}
    dfcopy = df.copy()
    # else, for each key in the dict, we check if the associated value is typed as a Dataframe (so the worker
    # ended with this Job), and we mark it by "Done" or "In Progress" if it's still a Job)
    for key in dfcopy.keys():
        if(isinstance(df[key].result, pd.DataFrame)):
            dfcopy[key] = "Done"
        else:
            dfcopy[key] = "In Progress"
    print("dfcopy: ", dfcopy)
    return dfcopy


@app.route('/fetchForResult')
def fetchForResult():
    """The short-polling endpoint. Called every 5 seconds to maintain a connection between front and back-end.

    Returns
    -------
    File
        the result in csv format in response to the front-end
    """
    global df

    # manage request rate
    time.sleep(5)

    # recovery of the key
    key = request.args.get("key")

    print("df: ", df)

    # if key not belongs this current process
    if(key not in df):
        print("key ", key, " is NOT in global dict df")
        return ({'result': -1}, 201)

    print("key: ", key)

    print("df[", df[key], "] is a dataframe: ",
          isinstance(df[key].result, pd.DataFrame))

    print("FETCHING! df[", key, "] is : ", df[key])

    if(df[key] == "df global"):
        return ({'result': -1}, 201)

    # if the key belongs this process, but the worker have not finished
    if not (isinstance(df[key].result, pd.DataFrame)):
        return ({'result': -1}, 201)

    # else, conversion to csv
    buffer = io.BytesIO()
    df[key].result.to_csv(buffer, index=False, sep=";")
    buffer.seek(0)
    # sending of the result file
    return (send_file(buffer, mimetype="text/csv"), 200)


@app.route('/')
def serve():
    """The starting endpoint. Where the back-end initiate the front-end.

    Returns
    -------
    Response
        The html file
    """
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))
