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
      .then((response) => response.json())
      .then(res => { document.getElementById('name').innerHTML = res.nb_molecules != -1 ? "Nombre de molécules : " + res.nb_molecules : "Erreur : Mauvais type de fichier"; })
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


