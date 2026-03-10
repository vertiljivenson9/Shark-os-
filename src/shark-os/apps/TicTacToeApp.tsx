import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const TicTacToeApp: React.FC = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const winner = calculateWinner(board);

  function handleClick(i: number) {
    if (calculateWinner(board) || board[i]) return;
    const next = board.slice();
    next[i] = isXNext ? 'X' : 'O';
    setBoard(next);
    setIsXNext(!isXNext);
  }

  function calculateWinner(squares: any[]) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

  const isDraw = !winner && board.every(Boolean);

  return (
    <div className="h-full bg-gray-900 flex flex-col items-center justify-center text-white">
       <div className="mb-4 text-xl font-bold">
           {winner ? `Winner: ${winner}` : isDraw ? "It's a Draw!" : `Player: ${isXNext ? 'X' : 'O'}`}
       </div>
       
       <div className="grid grid-cols-3 gap-2 bg-gray-700 p-2 rounded-lg">
           {board.map((val, i) => (
               <button 
                key={i}
                onClick={() => handleClick(i)}
                className={`w-20 h-20 text-4xl font-bold flex items-center justify-center rounded transition-colors ${val === 'X' ? 'bg-blue-600' : val === 'O' ? 'bg-red-500' : 'bg-gray-800 hover:bg-gray-700'}`}
               >
                   {val}
               </button>
           ))}
       </div>

       <button 
        onClick={() => { setBoard(Array(9).fill(null)); setIsXNext(true); }}
        className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
       >
           <RefreshCw size={16} /> Reset Game
       </button>
    </div>
  );
};