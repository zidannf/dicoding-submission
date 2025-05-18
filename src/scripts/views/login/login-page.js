import LoginPagePresenter from "../../presenter/auth-presenter/login-presenter";

export default class LoginPage {
  constructor() {
    this.presenter = new LoginPagePresenter(this);
  }

  async render() {
    return `
      <section class="login-container">
        <h1 tabindex="0">Login</h1>
        <form id="login-form" aria-labelledby="login-heading">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required
              aria-required="true"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required
              aria-required="true"
            />
          </div>
          
          <button type="submit" class="primary-button">Login</button>
        </form>
        <p>Belum punya akun? <a href="#/register" class="secondary-button">Daftar</a></p>
        <p id="error-message" class="error-message hidden" aria-live="assertive"></p>
      </section>
    `;
  }

  async afterRender() {
    await this.presenter.init();
  }

  addSubmitListener(listener) {
    document.getElementById("login-form").addEventListener("submit", listener);
  }

  getFormData() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    return { email, password };
  }

  getErrorMessageElement() {
    return document.getElementById("error-message");
  }

  setErrorMessage(message) {
    const errorMessage = this.getErrorMessageElement();
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
  }

  hideErrorMessage() {
    const errorMessage = this.getErrorMessageElement();
    errorMessage.classList.add("hidden");
    errorMessage.textContent = "";
  }

  setLoadingState(isLoading) {
    const submitButton = document.querySelector("button[type='submit']");
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = "Logging in...";
    } else {
      submitButton.disabled = false;
      submitButton.textContent = "Login";
    }
  }
}
