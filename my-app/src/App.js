import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';
// import * as XLSX from 'xlsx.js';
// import * as JSON from 'jszip.js';
// import 'jquery.min.js'
// import logo from './logo.svg';
import './App.css';

//Encodage pris en compte pour le fichier d'entrée
const ALLOWED_ENCODINGS = ['UTF-8']

//Extensions du fichiers d'entrée pris en compte
const ALLOWED_FILES = ['csv', 'xlsx']

var selected_column;
var selected_columnName;
var jsonResult;
var myChart;
var pointIsSelected;
var colorsOg;
const languageEncoding = require("detect-file-encoding-and-language");

//Application principale
function App() {
  //Stocke le fichier soumis par l'utilisateur
  const [selectedFile, setSelectedFile] = useState();
  const [disable, setDisable] = useState(true);

  //  The user uploads a file //

  const changeHandler = (event) => {
    //change event appelé dès que l'utilisateur entre un fichier
    var filename = document.getElementById('chooseFile').value;
    var fileSub = event.target.files[0];

    let fileUp = document.getElementsByClassName('file-upload')[0]
    let noFile = document.getElementById('noFile')

    //class 'active' pour le css quand fichier valide
    //class 'wrong' sinon
    if (/^\s*$/.test(filename)) {
      fileUp.classList.remove('active');
      fileUp.classList.remove('wrong');
      noFile.innerHTML = "No file chosen...";
    }
    else {
      fileUp.classList.remove('wrong');
      fileUp.classList.add('active');
      let filena = filename.replace("C:\\fakepath\\", "")
      //à l'affichage, on troncatène le nom du fichier si trop long
      noFile.innerHTML = filena.length > 28 ? filena.substring(0, 25) + '...' : filena;
    }

    if (!fileSub) {
      return
    }

    //on vérifie que l'extension du fichier soit valide, sinon on affiche un message d'avertissement
    if (!ALLOWED_FILES.includes(event.target.files[0].name.split('.')[1])) {

      fileUp.classList.remove('active');
      fileUp.classList.add('wrong');
      document.getElementById("graphMenu").innerHTML = "";
      document.getElementById("chartDiv").innerHTML = "The file extension is not correct, please submit a .csv or a .xlsx file";
      return;
    }

    //on vérifie que l'encodage du fichier soit valide, sinon on affiche un message d'avertissement
    languageEncoding(fileSub).then((fileInfo) => {
      if (!ALLOWED_ENCODINGS.includes(fileInfo.encoding) && fileSub.name.split('.')[1] == "csv") {
        fileUp.classList.remove('active');
        fileUp.classList.add('wrong');
        document.getElementById("graphMenu").innerHTML = "";
        document.getElementById("chartDiv").innerHTML = "The file encoding: " + fileInfo.encoding + " is not correct, please submit an UTF-8-encoded file";
        return;
      }
      //si le fichier est valide, on set le current selected file
      else {
        setSelectedFile(event.target.files[0]);
        setDisable(true)
        //on affiche le fichier dans une table

        //affichage les instructions
        let text = document.createElement("p")
        text.innerHTML = "Select the column containing SMILES code"
        text.setAttribute("id", "selectionText");
        let strong = document.createElement("strong")
        let p = document.createElement("p")
        strong.appendChild(text)
        p.appendChild(strong)

        //On crée le reader pour parser le fichier
        let reader = new FileReader();

        //2 types d'extensions acceptés : xlsx et csv

        //--- xlsx
        if (event.target.files[0].name.split('.')[1] == 'xlsx') {
          //parsing
          reader.onload = function (e) {
            var data = e.target.result;
            var XLSX = require("xlsx");
            var workbook = XLSX.read(data, {
              type: 'binary'
            });
            workbook.SheetNames.forEach((sheetName) => {
              var XLSX = require("xlsx");
              //on convertit le xlsx en json
              let json_object = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
              //ajout du paragraphe d'instruction
              clear(p)
              //ajout de la table (on convertit le json en table html)
              document.getElementById("chartDiv").appendChild(jsonToHTMLTable(json_object));
              //les colonnes sont interactibles (on peut les sélectionner)
              select_column(setDisable)
              //puis conversion du json en csv (comme le back-end s'attendra à recevoir un csv et non pas un xlsx)
              let converter = require('json-2-csv');
              converter.json2csv(json_object, (err, csv) => {
                //blob de type csv
                const parts = [
                  new Blob(["\ufeff", csv])
                ];
                //création du fichier avec son contenu
                const csvFile = new File(parts, 'result.csv', {
                  lastModified: Date.now(),
                  type: "text/csv"
                });
                //reset le fichier selectionné par l'utilisateur par celui nouvellement crée
                //au moment du submit, on enverra le fichier actuellement sélectionné
                setSelectedFile(csvFile);
              })
            });

          };

          reader.onerror = function (ex) {
            console.log("erreur = ", ex);
          };

          reader.readAsBinaryString(event.target.files[0]);

        }

        //--- csv
        else {
          reader.readAsText(event.target.files[0]);
          reader.onload = function () {
            clear(p)
            //on convertit le csv en json, pour ensuite convertir en table html et l'ajouter à la page
            document.getElementById("chartDiv").appendChild(jsonToHTMLTable(csvToJson(reader.result.split('\n').slice(0, 10).join('\n'))));
            select_column(setDisable)
          }
        }
      }
    })
  };

  //  The user sends the request by clicking on the submit button //

  const handleSubmission = () => {
    //vérification de la validité du fichier
    if (!selectedFile || !ALLOWED_FILES.includes(selectedFile.name.split('.')[1])) return
    const formData = new FormData();

    formData.append('File', selectedFile);
    //la sélection des colonnes ainsi que le choix des algos/distances sont paramètrisés dans l'url
    var url = updateQueryStringParameter("/file", "index", selected_column)
    url = updateQueryStringParameter(url, "nameIndex", selected_columnName)
    var algo1 = + document.getElementById("algo1").checked
    var algo2 = + document.getElementById("algo2").checked
    url = updateQueryStringParameter(url, "algo1", algo1)
    url = updateQueryStringParameter(url, "algo2", algo2)
    var d1 = + document.getElementById("d1").checked
    var d2 = + document.getElementById("d2").checked
    var d3 = + document.getElementById("d3").checked

    //si l'utilisateur n'a coché aucune algo/distance, on affiche un message d'avertissement
    if (!(algo1 | algo2)) {
      document.getElementById("chartDiv").innerHTML = "Please choose an algorithm.";
      return;
    }
    if (!(d1 | d2 | d3)) {
      document.getElementById("chartDiv").innerHTML = "Please choose a distance.";
      return;
    }
    url = updateQueryStringParameter(url, "d1", d1)
    url = updateQueryStringParameter(url, "d2", d2)
    url = updateQueryStringParameter(url, "d3", d3)

    //création du menu déroulant : il pourra ainsi afficher le graphe en fonction des différentes distances/algos qui a sélectionné
    createMenu([algo1, algo2, d1, d2, d3])

    //requête post pour envoyer le fichier au back-end avec l'url paramétrisé
    fetch(
      url,
      {
        method: 'POST',
        body: formData,
      }
    )
      .then((response) => response.blob())
      .then(res => {
        res.text().then(res => {
          var divRes = document.getElementById("chartDiv");
          divRes.innerHTML = "";
          let canvas = document.createElement("canvas");
          canvas.setAttribute("id", "myChart");
          divRes.appendChild(canvas);
          jsonToGraph(csvToJson(res));

        });
        let href = window.URL.createObjectURL(res)
        document.getElementById('dlButton').style.display = "block"
        document.getElementById('dlButton').addEventListener('click', () => {
          window.location.assign(href)
        })

        document.getElementById('dlLabel').style.display = "block"

      })
      .catch((error) => {
        document.getElementById('chartDiv').innerHTML = "Erreur";
      });
    let loader = document.createElement("div")
    loader.setAttribute('class', 'loader')
    document.getElementById("chartDiv").innerHTML = "";
    document.getElementById("chartDiv").appendChild(loader)
  };

  document.getElementById('chooseFile').addEventListener('change', (e) => changeHandler(e))

  //construction du boutton submit en React
  return (
    <div style={{ textAlign: "center" }}>
      <button id="submitButton" className="btn btn-primary" disabled={disable} onClick={handleSubmission}>Submit</button>
    </div>
  )
};

//construit le menu déroulant à partir du tableau de boolean
function createMenu(checkList) {
  let selectAlgo = document.createElement('select')
  selectAlgo.setAttribute('name', 'algoGr')
  selectAlgo.setAttribute('id', 'algoGr')
  //au changement, on retire le graphique actuellement et on le remplace par celui qui correspond aux options choisis
  selectAlgo.addEventListener('change', () => {
    myChart.destroy();
    jsonToGraph(jsonResult);
  })

  let selectDistance = document.createElement('select')
  selectDistance.setAttribute('name', 'distGr')
  selectDistance.setAttribute('id', 'distGr')
  selectDistance.addEventListener('change', () => {
    myChart.destroy();
    jsonToGraph(jsonResult);
  })

  //création de toute les options
  //--- algorithmes
  let option1 = document.createElement('option')
  option1.setAttribute('value', 'tsne')
  option1.innerHTML = "tSNE"
  let option2 = document.createElement('option')
  option2.setAttribute('value', 'umap')
  option2.innerHTML = "UMAP"

  //--- distances
  let option3 = document.createElement('option')
  option3.setAttribute('value', 'DiceDist')
  option3.innerHTML = "Dice"
  let option4 = document.createElement('option')
  option4.setAttribute('value', 'CosDist')
  option4.innerHTML = "Cosine"
  let option5 = document.createElement('option')
  option5.setAttribute('value', 'TanimotoDist')
  option5.innerHTML = "Tanimoto"

  //on l'ajoute au menu déroulant que s'il le faut, en fonction de la liste des booléens
  if (checkList[0]) selectAlgo.appendChild(option1)
  if (checkList[1]) selectAlgo.appendChild(option2)
  if (checkList[2]) selectDistance.appendChild(option3)
  if (checkList[3]) selectDistance.appendChild(option4)
  if (checkList[4]) selectDistance.appendChild(option5)

  //ajout des labels + du padding
  let algoLabel = document.createElement('label')
  algoLabel.setAttribute('style', 'padding-right: 5px')
  algoLabel.innerHTML = "Algorithm"
  let l = document.createElement('label')
  l.setAttribute('style', 'padding-left: 8px; padding-right: 8px')
  l.innerHTML = "-"
  let distanceLabel = document.createElement('label')
  distanceLabel.setAttribute('style', 'padding-right: 5px')
  distanceLabel.innerHTML = "Distance"

  //ajout du menu crée à la page
  let graphMenu = document.getElementById('graphMenu')
  graphMenu.innerHTML = ""
  graphMenu.appendChild(algoLabel)
  graphMenu.appendChild(selectAlgo)
  graphMenu.appendChild(l)
  graphMenu.appendChild(distanceLabel)
  graphMenu.appendChild(selectDistance)


}

//  Takes a JSON and build a Chartjs graph  //

function jsonToGraph(jsonFile) {
  jsonResult = jsonFile;

  var dataDict = []
  var labelsList = []
  var labelIncorrectSmileList = []
  let algo = document.getElementById("algoGr").value
  let distance = document.getElementById("distGr").value
  let pointRadiusList = []
  pointIsSelected = []
  let pointSize = jsonFile.length <= 100 ? 5 : (jsonFile.length <= 1000 ? 2 : 1)

  for (var i = 0; i < jsonFile.length; i++) {
    if (jsonFile[i][`X_${algo}_${distance}`] != "") {
      dataDict.push({ x: parseFloat(jsonFile[i][`X_${algo}_${distance}`]), y: parseFloat(jsonFile[i][`Y_${algo}_${distance}`]) });
      labelsList.push(jsonFile[i]["names"])
      pointRadiusList.push(pointSize)
      pointIsSelected.push(false)
    }
    else labelIncorrectSmileList.push(jsonFile[i]["names"])
  }

  var colors = [
    "rgb(176,224,230)", "rgb(135,206,250)", "rgb(0,191,255)", "rgb(30,144,255)", "rgb(95,158,160)", "rgb(106,90,205)", "rgb(0,0,255)",
    "rgb(0,0,139)", "rgb(100,149,237)", "rgb(0, 0, 34)"
  ]

  while (colors.length < labelsList.length) {
    colors = colors.concat(colors)
    console.log(colors);
  }

  colorsOg = colors.slice()

  const data = {
    datasets: [{
      // label: 'tSNE - Dice distance',
      labels: labelsList,
      backgroundColor: colors,
      borderColor: colors,
      data: dataDict,
      // pointRadius: jsonFile.length <= 100 ? 5 : (jsonFile.length <= 1000 ? 2 : 1),
      pointRadius: pointRadiusList,
      pointHoverRadius: jsonFile.length <= 100 ? 7 : (jsonFile.length <= 1000 ? 3 : 2)
    }]
  };

  const config = {
    type: 'scatter',
    data: data,
    options: {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              let label = ctx.dataset.labels[ctx.dataIndex];
              label += " (" + ctx.parsed.x + ", " + ctx.parsed.y + ")";
              return label;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'x',
            color: 'rgb(211,211,211)',
            font: {
              size: 15,
              weight: 'bold',
              lineHeight: 1.2,
            },
            padding: { top: 10, left: 0, right: 0, bottom: 0 }
          }
        },
        y: {
          title: {
            display: true,
            text: 'y',
            color: 'rgb(211,211,211)',
            font: {
              size: 15,
              weight: 'bold',
              lineHeight: 1.2,
            },
            padding: { top: 0, left: 0, right: 0, bottom: 10 }
          }
        }

      }
    }
  };

  //display the list of molecules
  let ind = 0;
  let list = document.getElementById("moleculesList");
  let listTitle = document.getElementById("validSmilesTitle");
  listTitle.style.display = "block";
  list.innerHTML = ""
  labelsList.forEach((item) => {
    let li = document.createElement("li");
    ind++;
    // li.setAttribute('onclick', `highLightGraph("${item}")`)
    li.onclick = () => {
      highLightGraph(item);
      li.style.color == "blue" ? li.style.color = "black" : li.style.color = "blue"
      li.style.fontWeight == "bold" ? li.style.fontWeight = "normal" : li.style.fontWeight = "bold"
    }
    li.onmouseover = () => {
      if (li.style.color == "black") li.style.color = "#0d6efd"
    }
    li.onmouseout = () => {
      if (li.style.color != "blue") li.style.color = "black"
    }
    li.innerText = item;
    list.appendChild(li);
  })

  ind = 0;
  let divNoSmile = document.getElementById("noSmileDiv");
  list = document.getElementById("noSmileList");
  list.innerHTML = ""
  if (labelIncorrectSmileList.length == 0) { divNoSmile.style.display = "none" }
  else { divNoSmile.style.display = "block" }

  labelIncorrectSmileList.forEach((item) => {
    let li = document.createElement("li");
    ind++;
    li.setAttribute('onclick', `console.log("${ind}", "${item}")`)
    li.innerText = item;
    li.style.color = "red"
    list.appendChild(li);
  })


  myChart = new Chart(
    document.getElementById('myChart'),
    config
  );
}

function highLightGraph(pointToChange) {
  var chartIndexArray = myChart.data
  console.log(chartIndexArray)
  var chartIndex = chartIndexArray.datasets[0].labels.indexOf(pointToChange)
  myChart.data.datasets[0].backgroundColor[chartIndex] = pointIsSelected[chartIndex] ? colorsOg[chartIndex] : 'lime';
  myChart.data.datasets[0].pointRadius[chartIndex] += pointIsSelected[chartIndex] ? -3 : 3;
  pointIsSelected[chartIndex] = !pointIsSelected[chartIndex]
  console.log(colorsOg);
  myChart.update();
}

//  Transforms a csv file to Json //

function csvToJson(csv) {
  //split sur les lignes
  const lines = csv.split(/\r\n|\r|\n/)

  //json
  const result = []

  const headers = lines[0].split(/,|;/)
  //boucle sur les lignes
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i])
      continue
    const obj = {}
    const currentline = lines[i].split(/,|;/)

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j]
    }
    result.push(obj)
  }
  return result
}

//  Transforms a JSON file to an HTML table //

function jsonToHTMLTable(json) {
  //itération sur le attributs pour avoir les colonnes
  var col = [];
  for (var i = 0; i < json.length; i++) {
    for (var key in json[i]) {
      if (col.indexOf(key) === -1) {
        col.push(key);
      }
    }
  }
  //initialise la table html
  var table = document.createElement("table");


  var tr = table.insertRow(-1);

  for (var i = 0; i < col.length; i++) {
    var th = document.createElement("th");
    th.innerHTML = col[i];
    tr.appendChild(th);
  }

  for (var i = 0; i < json.length; i++) {

    tr = table.insertRow(-1);

    for (var j = 0; j < col.length; j++) {
      var tabCell = tr.insertCell(-1);
      tabCell.innerHTML = json[i][col[j]];
    }
  }


  table.setAttribute('class', 'table table-bordered table-striped mb-0');
  table.setAttribute('id', 'sentCSV');

  var div = document.createElement("div")

  div.setAttribute('style', 'max-height:570px; max-width:1000px;')
  div.setAttribute('class', 'table-responsive text-nowrap scrollbar-primary')
  div.appendChild(table)

  return div;
}

export default App;

//  The user can select the clumn containing the molecules' SMILE after uploading a file  //

function select_column(setDisable) {
  var table = document.getElementById("sentCSV");
  var cells = table.getElementsByTagName("td");
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i];

    cell.onclick = function () {
      clickEvent(this)
      document.getElementById("selectionText").innerHTML = "Select the column containing molecule names"
      select_columnName(setDisable)
    }

    cell.onmouseover = function () {
      mouseEvent(this, true)
    }

    cell.onmouseleave = function () {
      mouseEvent(this, false)
    }

  }

}

//  The user can select the clumn containing the molecules' name after selecting the column with the SMILE  //

function select_columnName(setDisable) {
  var table = document.getElementById("sentCSV");
  var cells = table.getElementsByTagName("td");
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i];

    cell.onclick = function () {
      clickEventName(this)
      setDisable(false)
    }
  }

}

//  HTML table for column selections interacts with user's input  //

function mouseEvent(cell, isEntering) {
  const parentTds = cell.parentElement.children;
  const clickedTdIndex = [...parentTds].findIndex(td => td == cell);
  const columns = document.querySelectorAll(`td:nth-child(${clickedTdIndex + 1}), th:nth-child(${clickedTdIndex + 1})`);
  document.querySelectorAll('.highlighted').forEach(col => col.classList.remove('highlighted'));
  if (isEntering) columns.forEach(col => { col.classList.add('highlighted'); });
}

function clickEvent(cell) {
  const parentTds = cell.parentElement.children;
  const clickedTdIndex = [...parentTds].findIndex(td => td == cell);
  selected_column = clickedTdIndex;
  const columns = document.querySelectorAll(`td:nth-child(${clickedTdIndex + 1}), th:nth-child(${clickedTdIndex + 1})`);
  document.querySelectorAll('.selected').forEach(col => col.classList.remove('selected'));
  columns.forEach(col => { col.classList.add('selected'); });
}

function clickEventName(cell) {
  const parentTds = cell.parentElement.children;
  const clickedTdIndex = [...parentTds].findIndex(td => td == cell);
  selected_columnName = clickedTdIndex;
  const columns = document.querySelectorAll(`td:nth-child(${clickedTdIndex + 1}), th:nth-child(${clickedTdIndex + 1})`);
  document.querySelectorAll('.selectedName').forEach(col => col.classList.remove('selectedName'));
  columns.forEach(col => { col.classList.add('selectedName'); });
}

//  Utilititary function to add a parameter in the uri  //

function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf('?') !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + "=" + value + '$2');
  }
  else {
    return uri + separator + key + "=" + value;
  }
}

function clear(p) {
  document.getElementById("graphMenu").innerHTML = "";
  document.getElementById("chartDiv").innerHTML = "";
  document.getElementById("chartDiv").appendChild(p);
}
