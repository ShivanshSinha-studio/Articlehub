import axios from "axios";
import { API_ORIGIN } from "../constants";

const axiosClient = axios.create({
  baseURL: API_ORIGIN,
  withCredentials: true,
});

export default axiosClient;
