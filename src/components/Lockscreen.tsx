import React, { useState, useCallback } from "react";
import "../styles/lockscreen.css";

interface Props {
  onUnlock: () => void;
  userName: string;
  hint: string;
}

const handleRestart = () => window.location.reload();
const handleShutdown = () => window.close();

const Lockscreen: React.FC<Props> = ({ onUnlock, userName, hint }) => {
  const [password, setPassword] = useState("");
  const [isWrong, setIsWrong] = useState(false);
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);

  const [statusText, setStatusText] = useState("Locked");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1234") {
      onUnlock();
    } else {
      setIsWrong(true);
      setStatusText("Incorrect password. Try again.");
      setPassword("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (isWrong) {
      setIsWrong(false);
      setStatusText(hint);
    }
  };

  const handleFocus = () => {
    if (!isWrong) {
      setStatusText(hint);
    }
  };

  const handleBlur = () => {
    if (!isWrong && !password) {
      setStatusText("Locked");
    }
  };

  const togglePowerMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPowerMenuOpen((p) => !p);
  }, []);

  return (
    <div className="lockscreen-overlay" onClick={() => setPowerMenuOpen(false)}>
      {/* Dedicated div for the background image */}
      <div className="lockscreen-background"></div>

      {/* Panel for layout */}
      <div className={`lockscreen-panel ${isWrong ? "shake" : ""}`}>
        <img
          src="/icons/profile.png"
          alt="User Avatar"
          className="lockscreen-avatar"
        />
        <h2 className="lockscreen-username">{userName}</h2>
        <p className="lockscreen-status">{statusText}</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="password"
              className="lockscreen-input"
              placeholder="Password"
              value={password}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <button
              type="submit"
              className="lockscreen-submit-btn"
              title="Submit"
            >
              →
            </button>
          </div>
        </form>
      </div>

      {/* Power Button and Menu */}
      <div className="lockscreen-power-container">
        {powerMenuOpen && (
          <div className="lockscreen-power-menu glass">
            <div className="power-menu-item" onClick={handleRestart}>
              Restart
            </div>
            <div className="power-menu-item" onClick={handleShutdown}>
              Shut Down
            </div>
          </div>
        )}
        <button
          className="lockscreen-power-btn"
          onClick={togglePowerMenu}
          title="Power Options"
        >
          ⏻
        </button>
      </div>

      {/* NEW: OS Name and Icon */}
      <div className="lockscreen-os-name">
        <img
          src="/icons/startmenu.png"
          alt="OS Icon"
          className="lockscreen-os-icon"
        />
        <span>PortfolioOS</span>
      </div>
    </div>
  );
};

export default Lockscreen;