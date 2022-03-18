import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

const ALLOWED_FILE = 'csv'

var selected_column;

function App() {
  const [selectedFile, setSelectedFile] = useState();

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
    let reader = new FileReader();
    reader.readAsText(event.target.files[0]);
    reader.onload = function () {
      document.getElementById("name").innerHTML = "";
      document.getElementById("name").appendChild(jsonToHTMLTable(csvToJson(reader.result.split('\n').slice(0, 10).join('\n'))));
      highlight_row()
    }


  };

  const handleSubmission = () => {
    if (!selectedFile || selectedFile.name.split('.')[1] != ALLOWED_FILE) return

    const formData = new FormData();
    formData.append('File', selectedFile);
    // var url = new URL("/file")
    // var params = { index: selected_column }
    // url.search = new URLSearchParams(params).toString();
    // console.log(url)
    var url = updateQueryStringParameter("/file", "index", selected_column)
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
          document.getElementById("name").innerHTML = "";
          document.getElementById("name").appendChild(jsonToHTMLTable(csvToJson(res)));

        });
        let href = window.URL.createObjectURL(res)
        document.getElementById('download').innerHTML = `<hr/> <a class='btn btn-danger' role='button' href=${href} download='result.csv'>Download</a>`;

      })
      .catch((error) => {
        document.getElementById('name').innerHTML = "Erreur";
      });
  };

  return (
    <div>
      <input className="form-control-file" type="file" name="file" onChange={changeHandler} />
      <br />
      <div>
        <button className="btn btn-primary" onClick={handleSubmission}>Submit</button>
      </div>
    </div>
  )
};
function csvToJson(csv) {
  const lines = csv.split('\n')
  const result = []
  const headers = lines[0].split(',')

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i])
      continue
    const obj = {}
    const currentline = lines[i].split(',')

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j]
    }
    result.push(obj)
  }
  return result
}

function jsonToHTMLTable(json) {
  var col = [];
  for (var i = 0; i < json.length; i++) {
    for (var key in json[i]) {
      if (col.indexOf(key) === -1) {
        col.push(key);
      }
    }
  }

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
  var styles = `    
    .scrollbar-primary::-webkit-scrollbar {
    width: 17px;
    background-color: #F5F5F5; }
    
    .scrollbar-primary::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
    background-color: #4285F4; }
    
    .scrollbar-primary {
    scrollbar-color: #4285F4 #F5F5F5;
    }
`

  var styleSheet = document.createElement("style")
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)



  return div;
}

export default App;

function Send() {
  var inputName = document.getElementById("nameinput").value;

  fetch('/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ title: inputName })
  })
    .then((response) => response.json()
      .then(res => { document.getElementById('name').innerHTML = "hello " + res.title; }));
}

function highlight_row() {
  var table = document.getElementById("sentCSV");
  var cells = table.getElementsByTagName("td");
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i];
    cell.onclick = function () {
      const parentTds = this.parentElement.children;
      const clickedTdIndex = [...parentTds].findIndex(td => td == this);
      selected_column = clickedTdIndex;
      const columns = document.querySelectorAll(`td:nth-child(${clickedTdIndex + 1}), th:nth-child(${clickedTdIndex + 1})`);
      document.querySelectorAll('.selected').forEach(col => col.classList.remove('selected'));
      columns.forEach(col => {
        col.classList.add('selected');
      });
    }
  }

}

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

// window.onload = highlight_row;


