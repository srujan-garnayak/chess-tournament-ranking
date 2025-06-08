import { useState, useEffect } from 'react';

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
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoUpdate, setAutoUpdate] = useState(false);

  // Initialize matches when players change
  useEffect(() => {
    const allMatches = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        allMatches.push({ 
          id: `${players[i].username}-${players[j].username}`,
          p1: players[i], 
          p2: players[j], 
          result: null,
          gameUrl: null,
          lastChecked: null
        });
      }
    }
    setMatches(allMatches);
  }, [players]);

  // Auto-update interval
  useEffect(() => {
    let interval;
    if (autoUpdate) {
      interval = setInterval(() => {
        fetchLatestGames();
      }, 30000); // Check every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoUpdate, matches]);

  const fetchLatestGames = async () => {
    setIsLoading(true);
    try {
      const updatedMatches = [...matches];
      const updatedPlayers = [...players];
      let hasUpdates = false;

      for (const match of updatedMatches) {
        if (match.result) continue; // Skip already completed matches

        // Fetch recent games for both players
        const games1 = await fetchRecentGames(match.p1.username);
        const games2 = await fetchRecentGames(match.p2.username);

        // Look for games between these two players
        const commonGame = findCommonGame(games1, games2, match.p1.username, match.p2.username);
        
        if (commonGame && (!match.lastChecked || new Date(commonGame.end_time * 1000) > new Date(match.lastChecked))) {
          const result = determineResult(commonGame, match.p1.username, match.p2.username);
          
          if (result) {
            // Update match result
            const matchIndex = updatedMatches.findIndex(m => m.id === match.id);
            updatedMatches[matchIndex] = {
              ...match,
              result: result,
              gameUrl: commonGame.url,
              lastChecked: new Date().toISOString()
            };

            // Update player points
            const p1Index = updatedPlayers.findIndex(p => p.username === match.p1.username);
            const p2Index = updatedPlayers.findIndex(p => p.username === match.p2.username);

            if (result === 'draw') {
              updatedPlayers[p1Index].points += 0.5;
              updatedPlayers[p2Index].points += 0.5;
            } else if (result === 'p1') {
              updatedPlayers[p1Index].points += 1;
            } else if (result === 'p2') {
              updatedPlayers[p2Index].points += 1;
            }

            hasUpdates = true;
          }
        }
      }

      if (hasUpdates) {
        setMatches(updatedMatches);
        setPlayers(updatedPlayers);
      }
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentGames = async (username) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.games || [];
    } catch (error) {
      console.error(`Error fetching games for ${username}:`, error);
      return [];
    }
  };

  const findCommonGame = (games1, games2, username1, username2) => {
    for (const game1 of games1) {
      for (const game2 of games2) {
        if (game1.url === game2.url) {
          // Verify both players are in this game
          const players = [game1.white.username.toLowerCase(), game1.black.username.toLowerCase()];
          if (players.includes(username1.toLowerCase()) && players.includes(username2.toLowerCase())) {
            return game1;
          }
        }
      }
    }
    return null;
  };

  const determineResult = (game, username1, username2) => {
    const whitePlayer = game.white.username.toLowerCase();
    const blackPlayer = game.black.username.toLowerCase();
    const user1Lower = username1.toLowerCase();
    const user2Lower = username2.toLowerCase();

    if (game.white.result === 'win') {
      return whitePlayer === user1Lower ? 'p1' : 'p2';
    } else if (game.black.result === 'win') {
      return blackPlayer === user1Lower ? 'p1' : 'p2';
    } else if (game.white.result === 'agreed' || game.white.result === 'repetition' || 
               game.white.result === 'stalemate' || game.white.result === 'insufficient') {
      return 'draw';
    }
    return null;
  };

  const handleManualResult = (p1, p2, result) => {
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

    // Update match status
    const updatedMatches = matches.map(m => {
      if ((m.p1.name === p1.name && m.p2.name === p2.name) || 
          (m.p1.name === p2.name && m.p2.name === p1.name)) {
        return { ...m, result: result, lastChecked: new Date().toISOString() };
      }
      return m;
    });
    setMatches(updatedMatches);
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

  const resetTournament = () => {
    if (confirm("Are you sure you want to reset the tournament?")) {
      setPlayers(players.map(p => ({ ...p, points: 0 })));
      setMatches(matches.map(m => ({ ...m, result: null, gameUrl: null, lastChecked: null })));
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="p-4 max-w-6xl mx-auto text-sm sm:text-base">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">🏆 Live Chess Tournament</h1>

      {!admin ? (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mb-6">
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-2 border-blue-300 p-3 rounded-lg w-full sm:w-auto focus:border-blue-500 outline-none"
          />
          <button 
            onClick={() => {
              if (password === "Ayush@xerneas2006") setAdmin(true);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🔐 Admin Login
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
          <button 
            onClick={addPlayer}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            ➕ Add Player
          </button>
          <button 
            onClick={fetchLatestGames}
            disabled={isLoading}
            className="bg-purple-500 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? '🔄 Updating...' : '🔄 Update Games'}
          </button>
          <button 
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`${autoUpdate ? 'bg-orange-500 hover:bg-orange-700' : 'bg-gray-500 hover:bg-gray-700'} text-white font-bold py-2 px-4 rounded-lg transition-colors`}
          >
            {autoUpdate ? '⏸️ Stop Auto-Update' : '▶️ Auto-Update (30s)'}
          </button>
          <button 
            onClick={resetTournament}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            🔄 Reset Tournament
          </button>
        </div>
      )}

      {lastUpdate && (
        <div className="text-center text-gray-600 mb-4">
          Last updated: {lastUpdate} {autoUpdate && '(Auto-updating every 30s)'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standings */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-green-600">🏁 Standings</h2>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="p-3 text-left">Rank</th>
                  <th className="p-3 text-left">Player</th>
                  <th className="p-3 text-left">Points</th>
                  <th className="p-3 text-left">Username</th>
                  {admin && <th className="p-3 text-left">Action</th>}
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((p, i) => (
                  <tr key={p.name} className={`border-t ${i < 4 ? 'bg-yellow-50' : ''}`}>
                    <td className="p-3 font-bold">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td className="p-3 font-semibold">{p.name}</td>
                    <td className="p-3 text-xl font-bold text-blue-600">{p.points}</td>
                    <td className="p-3 text-gray-600">{p.username}</td>
                    {admin && (
                      <td className="p-3">
                        <button 
                          onClick={() => removePlayer(p.name)}
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                        >
                          ❌
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Matches */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">⚔️ Matches</h2>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <div className="space-y-2 p-4">
              {matches.map((m, idx) => (
                <div key={idx} className={`border rounded-lg p-3 ${m.result ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold">
                      {m.p1.name} vs {m.p2.name}
                    </div>
                    {m.result && (
                      <div className="text-sm font-bold text-green-600">
                        {m.result === 'draw' ? '🤝 Draw' : 
                         m.result === 'p1' ? `🏆 ${m.p1.name}` : `🏆 ${m.p2.name}`}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => window.open(`https://www.chess.com/play/online/new?opponent=${m.p2.username}`, '_blank')}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                    >
                      🎯 Challenge
                    </button>
                    
                    {m.gameUrl && (
                      <button 
                        onClick={() => window.open(m.gameUrl, '_blank')}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                      >
                        👁️ View Game
                      </button>
                    )}
                    
                    {admin && !m.result && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleManualResult(m.p1, m.p2, 'p1')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs transition-colors"
                        >
                          P1
                        </button>
                        <button 
                          onClick={() => handleManualResult(m.p1, m.p2, 'draw')}
                          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded text-xs transition-colors"
                        >
                          Draw
                        </button>
                        <button 
                          onClick={() => handleManualResult(m.p1, m.p2, 'p2')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs transition-colors"
                        >
                          P2
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🏆 Tournament Format</h3>
        <p className="text-gray-700">
          Round-robin format where each player plays every other player once. 
          After all matches, top 4 players qualify for knockout: 1st vs 4th, 2nd vs 3rd (semifinals), then final.
        </p>
        <div className="mt-2 text-sm text-gray-600">
          <strong>Scoring:</strong> Win = 1 point, Draw = 0.5 points, Loss = 0 points
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📝 How It Works</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Games are automatically detected from Chess.com when both players have matching usernames</li>
          <li>• Use "Challenge" button to start a game with your opponent</li>
          <li>• Results update automatically every 30 seconds when auto-update is enabled</li>
          <li>• Admins can manually update results if needed</li>
          <li>• Only games played after the tournament starts are counted</li>
        </ul>
      </div>
    </div>
  );
};

export default App;