import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/auth-slice";

export const useAutoLogin = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const base = process.env.REACT_APP_BASE_URL?.replace(/\/+$/, ""); // remove trailing slashes
        const res = await axios.get(`${base}/api/auth/refresh`, {
          withCredentials: true,
        });

        if (res.status === 200 && res.data.success) {
          dispatch(setAuth(res.data.user));
        }
      } catch (err) {
        console.error("Auto login failed:", err.response?.status || err.message);
      } finally {
        setLoading(false);
      }
    };

    autoLogin();
  }, [dispatch]); // ✅ dependency added

  return loading;
};
