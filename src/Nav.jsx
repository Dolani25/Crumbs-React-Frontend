import './Nav.css'
import Default from './assets/profilePic.jpg'
import Cog from './assets/cog.svg'
import Profile from './assets/profile.svg'
import Activity from './assets/activity.svg'
import Bookmark from './assets/bookmark.svg'
import Near from './assets/near.svg'

import Logout from  './assets/logout.svg'
import Pinned from  './assets/pinned.svg'
import Planner from  './assets/planner.svg'
import About from  './assets/about.svg'
import Light from './assets/light.svg'

const Nav = ({ user, isVisible }) => {
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
        <img style={{marginTop: '-1em'}} src={Cog}/>
      </span>

      <ul>
        <div className="rank_points">
          <h5 style={{ background: "#DDE2F8" }}>
            <svg fill="#3975ED" height="24px" width="24px" viewBox="0 0 220 220">
              <path d="M220,98.865c0-12.728-10.355-23.083-23.083-23.083s-23.083,10.355-23.083,23.083c0,5.79,2.148,11.084,5.681,15.14l-23.862 21.89L125.22 73.002l17.787-20.892l-32.882-38.623L77.244 52.111l16.995 19.962l-30.216 63.464l-23.527-21.544c3.528-4.055 5.671-9.344 5.671-15.128c0-12.728-10.355-23.083-23.083-23.083C10.355 75.782 0 86.137 0 98.865c0 11.794 8.895 21.545 20.328 22.913l7.073 84.735H192.6l7.073-84.735C211.105 120.41 220 110.659 220 98.865z"/>
            </svg>
          </h5>
          
          <h5><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#8A51FF" stroke="#8A51FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></h5>
          
        </div>

        <div className="rank_points">
          <h4>32</h4>
          <h4>459</h4>
        </div>

        <ul className="Btnlist">
          <li className="item" id="community">
            <a href={`/profile/${user?.username}`} className="btn"><img src={Profile}/>
              Profile
            </a>
          </li>
          <li className="item" id="earn">
            <a href="#earn" className="btn"><img src={Activity}/>
              Activity
            </a>
          </li>
          
          <li className="item" id="wallet">
            <a href="#wallet" className="btn"><img src={Bookmark}/>
              Bookmarks
            </a>
          </li>
          
          <li className="item" id="trans">
            <a href="#trans" className="btn"><img src={Pinned}/>
              Pinned
            </a>
          </li>
          
          <li className="item" id="news">
            <a href="#news" className="btn"><img src={Near}/>
              Nearby Users
            </a>
          </li>
          
          <li className="item" id="message">
            <a href="#message" className="btn"><img src={Planner}/>
              Planner
            </a>
          </li>
          <li className="item" id="about">
            <a href="#about" className="btn"><img src={About}/>
              About
            </a>
          </li>
          <li className="item" id="logout">
            <a href="/logout" className="btn"><img src={Logout}/>
              Sign out
            </a>
          </li>
          <li className="item" id="theme">
            <a href="#theme" className="btn"><img src={Light}/>
              Light Mode
            </a>
          </li> 
        </ul>
      </ul>
    </nav>
  );
};

export default Nav;