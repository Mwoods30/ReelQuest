
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';


function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-link">Home</Link>
      <Link to="/game" className='nav-link'>Play</Link>
      <Link to="/leaderboard" className="nav-link">Leaderboards</Link>
      <Link to="/about" className="nav-link">About</Link>
    </nav>
  );
}



function Leaderboard() {
  const scores = JSON.parse(localStorage.getItem('scores') || '[]');
  return (
    <div className="page leaderboard">
      <h1 className="title">Leaderboard</h1>
      <div className="leaderboard-list">
        {scores.length ? scores.map((s, i) => (
          <div key={i}>{i + 1}. {s} pts</div>
        )) : <div>No scores yet.</div>}
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="page about">
      <h1 className="title">About</h1>
      <div className="about-content">
        <p>ReelQuest is a modern web-based fishing game. Cast your line, catch rare fish, and compete for the top score!</p>
        <p>Developed by: Matthew Woods, Ryan McKearnin, Tyler Klimczak, Willow Iloka</p>
        <p>Powered by Unity and WebGL.</p>
      </div>
    </div>
  );
}

function Game() {
  return (
    <div className="page game">
      <div className="game-container">

      </div>
    </div>
  );
}


function Home() {
  const navigate = useNavigate();
  return (
    <div className="page home">
      <h1 className="title">ReelQuest Fishing</h1>
      <p style={{fontSize:'1.25em', color:'#fff', marginTop:'24px'}}>Welcome to ReelQuest, the most immersive fishing experience on the web!<br />
        Cast your line, catch rare fish, and climb the leaderboard.<br />
        Powered by Unity and React.
      </p>
      <ul>
        <li>🎮 Play a realistic fishing game in your browser</li>
        <li>🏆 Compete for high scores on the leaderboard</li>
        <li>🐟 Discover and catch rare fish</li>
        <li>🧑‍💻 Built by passionate developers</li>
      </ul>
      <button className="button" onClick={() => navigate('/game')}>Play Now</button>
    </div>
  );
}


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;
