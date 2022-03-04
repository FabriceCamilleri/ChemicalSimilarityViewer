import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    fetch('/time').then(res => res.json()).then(data => {
      setCurrentTime(data.time);
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={Send}>
          Send
        </button>
        <p>Hello {currentTime}.</p>
      </header>

    </div>


  );
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
    .then((response) => response.json().then(function (res) { console.log(res) }));
}
