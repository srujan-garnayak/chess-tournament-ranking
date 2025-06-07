import { useState } from 'react';

const initialPlayers = [
  { name: "Player1", username: "chesscom1", points: 0 },
  { name: "Player2", username: "chesscom2", points: 0 },
  { name: "Player3", username: "chesscom3", points: 0 },
  { name: "Player4", username: "chesscom4", points: 0 },
  { name: "Player5", username: "chesscom5", points: 0 },
  { name: "Player6", username: "chesscom6", points: 0 },
  { name: "Player7", username: "chesscom7", points: 0 },
  { name: "Player8", username: "chesscom8", points: 0 }
];

const App = () => {
  const [players, setPlayers] = useState(initialPlayers);
  const [admin, setAdmin] = useState(false);
  const [password, setPassword] = useState("");

  const allMatches = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = 0; j < players.length; j++) {
      if (i !== j) {
        allMatches.push({ p1: players[i], p2: players[j], result: null });
      }
    }
  }

  const handleResult = (p1, p2, result) => {
    const newPlayers = [...players];
    const i1 = newPlayers.findIndex(p => p.name === p1.name);
    const i2 = newPlayers.findIndex(p => p.name === p2.name);
    if (result === 'draw') {
      newPlayers[i1].points += 0.5;
      newPlayers[i2].points += 0.5;
    } else if (result === 'p1') {
      newPlayers[i1].points += 1;
    } else if (result === 'p2') {
      newPlayers[i2].points += 1;
    }
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    const name = prompt("Enter player name");
    const username = prompt("Enter chess.com username");
    if (name && username) {
      setPlayers([...players, { name, username, points: 0 }]);
    }
  };

  const removePlayer = (name) => {
    setPlayers(players.filter(p => p.name !== name));
  };

  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="p-4 max-w-4xl mx-auto text-sm sm:text-base">
      <h1 className="text-2xl font-bold text-center mb-4">Chess Tournament</h1>

      {!admin ? (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mb-4">
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
          />
          <button 
            onClick={() => {
              if (password === "Ayush@xerneas2006") setAdmin(true);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Login
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-center gap-2 mb-4">
          <button 
            onClick={addPlayer}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Player
          </button>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-2">Standings</h2>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <div className="p-2">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2">Rank</th>
                <th className="p-2">Name</th>
                <th className="p-2">Points</th>
                {admin && <th className="p-2">Remove</th>}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((p, i) => (
                <tr key={p.name} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.points}</td>
                  {admin && (
                    <td className="p-2">
                      <button 
                        onClick={() => removePlayer(p.name)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">Matchups</h2>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <div className="p-2">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2">Player 1</th>
                <th className="p-2">vs</th>
                <th className="p-2">Player 2</th>
                <th className="p-2">Action</th>
                {admin && <th className="p-2">Result</th>}
              </tr>
            </thead>
            <tbody>
              {allMatches.map((m, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{m.p1.name}</td>
                  <td className="p-2">vs</td>
                  <td className="p-2">{m.p2.name}</td>
                  <td className="p-2">
                    <button 
                      onClick={() => window.open(`https://www.chess.com/live#r=custom&opponent=${m.p2.username}`, '_blank')}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                    >
                      Challenge
                    </button>
                  </td>
                  {admin && (
                    <td className="p-2 space-x-1">
                      <button 
                        onClick={() => handleResult(m.p1, m.p2, 'p1')}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded text-sm border"
                      >
                        P1 Wins
                      </button>
                      <button 
                        onClick={() => handleResult(m.p1, m.p2, 'draw')}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded text-sm border"
                      >
                        Draw
                      </button>
                      <button 
                        onClick={() => handleResult(m.p1, m.p2, 'p2')}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded text-sm border"
                      >
                        P2 Wins
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">Knockout Format</h2>
      <p className="mb-4">After 56 matches, Top 4 qualify: 1st vs 2nd (winner to final), 3rd vs 4th (loser out), loser of 1v2 plays winner of 3v4, then final.</p>
    </div>
  );
};

export default App;