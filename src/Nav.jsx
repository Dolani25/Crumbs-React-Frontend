import { useState, useEffect } from 'react';
import './Nav.css'
import Default from './assets/profilePic.jpg'
import Cog from './assets/cog.svg'
import Profile from './assets/profile.svg'
import Activity from './assets/activity.svg'
import Bookmark from './assets/bookmark.svg'
import Near from './assets/near.svg'

import Logout from './assets/logout.svg'
import Pinned from './assets/pinned.svg'
import Planner from './assets/planner.svg'
import About from './assets/about.svg'
import Light from './assets/light.svg'
import Moon from './assets/moon.svg'
import Close from './assets/close.svg'

const Nav = ({ user, isVisible, closeNav, logout, toggleTheme, currentTheme }) => {
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [serverMode, setServerMode] = useState(user?.connectionMode || 'mock');

  useEffect(() => {
    setServerMode(user?.connectionMode || 'mock');
  }, [user]);

  useEffect(() => {
    // Check initial state
    if (window.puter && window.puter.auth && window.puter.auth.isSignedIn()) {
      setIsAiConnected(true);
    }

    // Polling for auth changes & Server Health
    const interval = setInterval(async () => {
      // 1. Puter Auth
      if (window.puter && window.puter.auth) {
        setIsAiConnected(window.puter.auth.isSignedIn());
      }

      // 2. Server Connection Health
      try {
        // Only poll if running locally/dev or if needed. 
        // Using relative path handles both generic fetch
        const res = await fetch('/api/health'); // This assumes proxy is set up or relative path works
        if (res.ok) {
          const data = await res.json();
          setServerMode(data.mode);
        } else {
          setServerMode('mock'); // Server unreachable
        }
      } catch (e) {
        setServerMode('mock');
      }

    }, 5000); // Check every 5s

    return () => clearInterval(interval);
  }, []);

  const handlePlaceholder = (e, name) => {
    e.preventDefault();
    alert(`The "${name}" feature is coming soon!`);
  }

  return (
    <nav id="nav" className={isVisible ? 'show' : 'hide'}>
      <span className="navtop">
        <div className="circle">
          <img id="profilePic" src={user?.profile_picture?.src || Default} alt="Profile Pic" />
        </div>

        <span id="userVerified">
          {user?.is_authenticated ? (
            <>
              <span id="Username">{user.username}</span>
              <h5>
                <strong style={{ color: "#6090E0" }}>VERIFIED</strong>
              </h5>
            </>
          ) : (
            <>
              <p>You are not logged in</p>
              <a href="/login">Log In</a>
            </>
          )}
        </span>

        {/* COG SVG */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <img style={{ marginTop: '-1em', cursor: 'pointer' }} src={Cog} alt="Settings" onClick={(e) => handlePlaceholder(e, 'Settings')} />
        </div>
      </span>

      {/* Close Button Positioned Outside (Only visible when Nav is open) */}
      {isVisible && (
        <div onClick={closeNav} style={{
          position: 'absolute',
          left: '100%',
          top: '20px',
          marginLeft: '10px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          <img src={Close} alt="Close" style={{ width: '20px', height: '20px', filter: 'invert(1)' }} />
        </div>
      )}

      <ul>
        <div className="rank_points">
          <div className="rank_item">
            <div className="rank_icon_circle">
              <svg fill="#8A51FF" height="24px" width="24px" viewBox="0 0 220 220">
                <path d="M220,98.865c0-12.728-10.355-23.083-23.083-23.083s-23.083,10.355-23.083,23.083c0,5.79,2.148,11.084,5.681,15.14l-23.862 21.89L125.22 73.002l17.787-20.892l-32.882-38.623L77.244 52.111l16.995 19.962l-30.216 63.464l-23.527-21.544c3.528-4.055 5.671-9.344 5.671-15.128c0-12.728-10.355-23.083-23.083-23.083C10.355 75.782 0 86.137 0 98.865c0 11.794 8.895 21.545 20.328 22.913l7.073 84.735H192.6l7.073-84.735C211.105 120.41 220 110.659 220 98.865z" />
              </svg>
            </div>
            <span>{user?.xp ? Math.floor(user.xp / 100) + 1 : 1}</span>
          </div>

          <div className="rank_item">
            <div className="rank_icon_circle">
              {/* Star Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#8A51FF" stroke="#8A51FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <span>{user?.xp || 0}</span>
          </div>
        </div>

        <ul className="Btnlist">
          <li className="item" id="community">
            <a href="/profile" className="btn"><img src={Profile} />
              Profile
            </a>
          </li>
          <li className="item" id="earn">
            <a href="#" onClick={(e) => handlePlaceholder(e, 'Activity')} className="btn"><img src={Activity} />
              Activity
            </a>
          </li>

          <li className="item" id="wallet">
            <a href="#" onClick={(e) => handlePlaceholder(e, 'Bookmarks')} className="btn"><img src={Bookmark} />
              Bookmarks
            </a>
          </li>

          <li className="item" id="trans">
            <a href="#" onClick={(e) => handlePlaceholder(e, 'Pinned')} className="btn"><img src={Pinned} />
              Pinned
            </a>
          </li>

          <li className="item" id="community">
            <a href="/community" className="btn"><img src={Near} />
              Community
            </a>
          </li>

          <li className="item" id="message">
            <a href="/planner" className="btn"><img src={Planner} />
              Planner
            </a>
          </li>
          <li className="item" id="about">
            <a href="#" onClick={(e) => handlePlaceholder(e, 'About')} className="btn"><img src={About} />
              About
            </a>
          </li>
          <li className="item" id="ai-connect">
            {isAiConnected ? (
              <button disabled className="btn" style={{ border: 'none', cursor: 'default', width: '100%', textAlign: 'left', paddingLeft: '18px', opacity: 0.7 }}>
                <img src={About} style={{ marginRight: '26px' }} />
                AI Connected
              </button>
            ) : (
              <button onClick={() => window.puter?.auth?.signIn()} className="btn" style={{ border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', paddingLeft: '18px' }}>
                <img src={About} style={{ marginRight: '26px' }} />
                Connect AI
              </button>
            )}
          </li>
          <li className="item" id="logout">
            <button onClick={logout} className="btn" style={{ border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', paddingLeft: '18px' }}><img src={Logout} style={{ marginRight: '26px' }} />
              Sign out
            </button>
          </li>
          <li className="item" id="theme">
            <button onClick={toggleTheme} className="btn" style={{ border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', paddingLeft: '18px' }}>
              <img src={currentTheme === 'dark' ? Light : Moon} style={{ marginRight: '26px', width: '24px' }} />
              {currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </li>
        </ul>
      </ul>

      {/* Status Bar */}
      <div className="status-indicator">
        <div className={`status-dot ${['remote', 'local'].includes(serverMode) ? 'online' : 'offline'}`}></div>
        <span className="status-text">
          {['remote', 'local'].includes(serverMode) ? '✅ Online (Synced)' : '⚠️ Offline (Local)'}
        </span>
      </div>
    </nav>
  );
};

export default Nav;