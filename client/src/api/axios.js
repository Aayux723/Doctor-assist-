//axios->js library ussed to send HTTPS req like fetch from frontend to backend 
//messenger 
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
});

// Automatically attach JWT token
//interceptor is the code that runs before every req 
//config is everything that axios needs to send a request 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
//if authorization is of the form  `Bearer woiwjfie...` then it is a token 
  }
  return config;
});

export default api;
