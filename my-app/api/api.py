from random import randint
import time
from flask import Flask, request, send_file
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
#app = Flask(__name__, static_folder="../build", static_url_path="")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/post', methods=['POST'])
def updateCurrentName():
    return request.json


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/fetchForDf")
def fetchForDf():
    return {createKey(): "Done" if (randint(0, 1) >= 0.5) else "In Progress"}


@app.route('/file', methods=['POST'])
def upload_file():
    if 'File' not in request.files:
        print("if1")
        return {'nb_molecules': -1}

    file = request.files['File']
    print(file.filename)
    if file.filename == '' or file and not allowed_file(file.filename):
        print("if2")
        return {'nb_molecules': -1}

    index = request.args.get('index')
    indexName = request.args.get('nameIndex')
    listAlgo = [int(request.args.get('algo1')), int(request.args.get('algo2'))]
    listDist = [int(request.args.get('d1')), int(
        request.args.get('d2')), int(request.args.get('d3'))]
    # "[true, false]
    print("file=", file)
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


# if __name__ == "__main__":
#     app.run()


# import time
# from flask import Flask, request, send_file
# from flask.helpers import send_from_directory
# import os
# from flask import Flask, flash, request, redirect, url_for
# from werkzeug.utils import secure_filename
# import pandas as pd
# import chemspace
# import io
# from rq import Queue
# from worker import conn


# UPLOAD_FOLDER = '/path/to/the/uploads'
# ALLOWED_EXTENSIONS = {'csv'}

# # app = Flask(__name__)
# app = Flask(__name__, static_folder="../build", static_url_path="/")
# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# # df = "df global"
# df = {}


def createKey():
    id = time.time_ns()
    print("ID IS EQUAL TO : ", id)
    return "df" + str(id)


# @app.route('/post', methods=['POST'])
# def updateCurrentName():
#     return request.json


# def allowed_file(filename):
#     return '.' in filename and \
#            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# @app.route('/file', methods=['POST'])
# def upload_file():
#     global df
#     if 'File' not in request.files:
#         print("if1")
#         return {'nb_molecules': -1}

#     file = request.files['File']
#     print(file.filename)
#     if file.filename == '' or file and not allowed_file(file.filename):
#         print("if2")
#         return {'nb_molecules': -1}

#     index = request.args.get('index')
#     indexName = request.args.get('nameIndex')
#     listAlgo = [int(request.args.get('algo1')), int(request.args.get('algo2'))]
#     listDist = [int(request.args.get('d1')), int(
#         request.args.get('d2')), int(request.args.get('d3'))]
#     # "[true, false]
#     print("file=", file)
#     # df = pd.read_csv(request.files['File'], sep=";|,", header=None)
#     work = pd.read_csv(request.files['File'], sep=";|,", header=None)
#     print("df=", df)

#     q = Queue(connection=conn)

#     # df = q.enqueue(chemspace.createChemicalSpace, args=(
#     #     df, int(index), int(indexName), listAlgo, listDist))
#     work = q.enqueue(chemspace.createChemicalSpace, result_ttl=86400, args=(
#         work, int(index), int(indexName), listAlgo, listDist))

#     key = createKey()

#     df[key] = work

#     print("------------------------")
#     print("df[", key, "] = ", df[key])
#     print("res=", df[key].result)
#     print("------------------------")

#     return {'key': key}

#     # time.sleep(25)

#     # print("res=", df.result)

#     # # return {'nb_molecules': df.shape[0]}
#     # buffer = io.BytesIO()
#     # df.result.to_csv(buffer, index=False, sep=";")
#     # buffer.seek(0)
#     # return send_file(buffer, mimetype="text/csv")


# @app.route("/fetchForDf")
# def fetchForDf():
#     print("user fetching for DF: ", df.keys())
#     if(len(df.keys()) == 0):
#         print("empty df here")
#         return {"dico": "empty"}
#     dfcopy = df.copy()
#     for key in dfcopy.keys():
#         if(isinstance(df[key].result, pd.DataFrame)):
#             dfcopy[key] = "done"
#         else:
#             dfcopy[key] = "In progress"
#     print("dfcopy: ", dfcopy)
#     return dfcopy


# @app.route('/fetchForResult')
# def fetchForResult():
#     global df

#     time.sleep(5)

#     key = request.args.get("key")

#     print("df: ", df)

#     if(key not in df):
#         print("key ", key, " is NOT in global dict df")
#         return ({'result': -1}, 201)

#     print("key: ", key)

#     print("df[", df[key], "] is a dataframe: ",
#           isinstance(df[key].result, pd.DataFrame))

#     print("FETCHING! df[", key, "] is : ", df[key])

#     if(df[key] == "df global"):
#         return ({'result': -1}, 201)

#     if not (isinstance(df[key].result, pd.DataFrame)):
#         return ({'result': -1}, 201)

#     buffer = io.BytesIO()
#     df[key].result.to_csv(buffer, index=False, sep=";")
#     buffer.seek(0)
#     return (send_file(buffer, mimetype="text/csv"), 200)


# @app.route('/')
# def serve():
#     return send_from_directory(app.static_folder, 'index.html')


# if __name__ == "__main__":
#     app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))
