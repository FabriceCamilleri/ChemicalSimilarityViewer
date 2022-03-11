import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';


function App() {
  const [selectedFile, setSelectedFile] = useState();
  const [isFilePicked, setIsFilePicked] = useState(false);
  var isSelected = false;

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);

    isSelected = true;
  };

  const handleSubmission = () => {
    const formData = new FormData();

    formData.append('File', selectedFile);

    fetch(
      '/file',
      {
        method: 'POST',
        body: formData,
      }
    )
      .then((response) => response.blob())
      .then(res => { res.text().then(res => document.getElementById('name').innerHTML = res); })
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
function csvJSON(csv) {
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

function makeTableHTML(myArray) {
  var result = "<table border=1>";
  for (var i = 0; i < myArray.length; i++) {
    result += "<tr>";
    for (var j = 0; j < myArray[i].length; j++) {
      result += "<td>" + myArray[i][j] + "</td>";
    }
    result += "</tr>";
  }
  result += "</table>";

  return result;
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


