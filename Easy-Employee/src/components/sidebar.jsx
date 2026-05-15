import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom"
import Admin from './Navigation/Admin';
import Leader from './Navigation/Leader';
import Employee from './Navigation/Employee';

const SideBar = () => {
  const { user } = useSelector(state => state.authSlice);
   // ✅ Sidebar close on overlay click
  const closeSidebar = () => {
    document.body.classList.remove("sidebar-open");
  };

  return (
    <>
       {/* ✅ Overlay background */}
      <div className="sidebar-overlay" onClick={closeSidebar}></div>
         <div className="main-sidebar custom-sidebar">
      <aside id="sidebar-wrapper">
        <div className="sidebar-brand">
          <button
  className="close-sidebar-btn"
  onClick={() => document.body.classList.remove("sidebar-open")}
>
  <i className="fas fa-times"></i>
</button>
          <NavLink to="/home">Target Management</NavLink>
        </div>
        <div className="sidebar-brand sidebar-brand-sm">
          <NavLink to="/home">TM</NavLink>
        </div>

        {
          (user.type === 'Admin')
            ? <Admin />
            : (user.type === 'Leader')
              ? <Leader />
              : <Employee />
        }

        <div className="mt-4 mb-4 p-3 hide-sidebar-mini">
          <a
            href="https://vercel.com/amitmaddheshiyas-projects"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-lg btn-block btn-icon-split"
          >
            <i className="fas fa-rocket"></i> Amit Maddheshiya
          </a>
        </div>
      </aside>
    </div>
    </>
 
  );
};

export default SideBar;
