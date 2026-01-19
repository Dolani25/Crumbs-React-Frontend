import { useState } from 'react';
import './Header.css';
import hamburger from './assets/Hamburger.svg';
import bell from './assets/Bell.svg';
import Nav from './Nav'; // Import Nav component

function Header({ user, logout, toggleTheme, currentTheme }) {
  const [showNav, setShowNav] = useState(false);

  const toggleNav = () => {
    setShowNav(!showNav);
  };

  return (
    <>
      <header>
        <img src={hamburger} className="NavMenu" onClick={toggleNav} alt="menu" />
        <span id="Logo">Crumbs</span>
        <div id="bell">
          <img src={bell} className="bell" alt="notifications" />
          <span id="notifications">3</span>
        </div>
      </header>

      {/* Pass showNav as a prop to Nav */}
      <Nav isVisible={showNav} closeNav={() => setShowNav(false)} user={user} logout={logout} toggleTheme={toggleTheme} currentTheme={currentTheme} />
    </>
  );
}

export default Header;