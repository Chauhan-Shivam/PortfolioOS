import { useState, forwardRef } from 'react';
import '../styles/startmenu.css';
import '../styles/global.css';

export interface StartMenuItem {
  label: string;
  icon: string;
  action: () => void;
}

interface Props {
  open: boolean;
  items: StartMenuItem[];
  onClose: () => void;
}

const StartMenu = forwardRef<HTMLDivElement, Props>(({ open, items, onClose }, ref) => {
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);

  if (!open) return null;

  const handleShutdown = () => {
    window.close();
  };
  
  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="start-menu glass" ref={ref} onClick={e => e.stopPropagation()}>
      <div className="start-menu-left">
        {items.map((item) => (
          <div key={item.label} className="start-item" onClick={() => { item.action(); onClose(); }}>
            <img src={item.icon} alt={item.label} className="start-item-icon" />
            <span className="start-item-label">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="start-menu-right">
        <div className="user-info">
          <div className="user-avatar"></div>
          <span className="user-name">User</span>
        </div>
        <div className="power-controls">
          {powerMenuOpen && (
            <div className="power-menu glass">
              <div className="power-menu-item" onClick={handleRestart}>Restart</div>
              <div className="power-menu-item" onClick={handleShutdown}>Shut Down</div>
            </div>
          )}
          <button 
            className="power-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setPowerMenuOpen(p => !p);
            }}
          >
            ▶ Power
          </button>
        </div>
      </div>
    </div>
  );
});

export default StartMenu;