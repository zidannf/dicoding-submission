import { login, register, logout, TokenManager } from "../data/api";

class AuthModel {
  static async login(email, password) {
    return login(email, password);
  }

  static async register(name, email, password) {
    return register(name, email, password);
  }
  static isUserLoggedIn() {
    return TokenManager.hasToken();
  }

  static logout() {
    logout();
  }
}

export default AuthModel;
