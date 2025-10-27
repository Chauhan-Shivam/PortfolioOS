import React, { useMemo } from 'react';
// We need the DesktopIconDef type
import type { DesktopIconDef } from '../components/types';
import '../styles/gamesContent.css'; // Use this for styling the launcher

// --- Define Props ---
interface GamesContentProps {
  allIcons: DesktopIconDef[];
  openWindow: (iconDef: DesktopIconDef) => void;
}

const GamesContent: React.FC<GamesContentProps> = ({ allIcons, openWindow }) => {

  const gameIcons = useMemo(() => {
    return allIcons.filter(icon =>
        icon.id === 'minesweeper'
    );
  }, [allIcons]);

  return (
    <div className="games-launcher">
      {gameIcons.length === 0 ? (
        <p>No games found.</p>
      ) : (
        gameIcons.map(gameIcon => (
          <button
            key={gameIcon.id}
            className="game-launcher-button"
            onClick={() => openWindow(gameIcon)}
            title={`Launch ${gameIcon.title}`}
          >
            <img src={gameIcon.icon} alt={gameIcon.title} />
            <span>{gameIcon.title}</span>
          </button>
        ))
      )}
    </div>
  );
};

export default GamesContent;