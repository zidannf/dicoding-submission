import RegisterPagePresenter from "../../presenter/auth-presenter/register-presenter";

export default class RegisterPage {
  constructor() {
    this.presenter = new RegisterPagePresenter(this);
  }

  async render() {
    return `
      <section id="register" class="container">
        <h1>Register</h1>
        <form id="register-form" class="register-form">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required aria-required="true" />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required aria-required="true" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required aria-required="true" />
          </div>
          <button type="submit" class="primary-button">Register</button>
        </form>
        <p>Sudah punya akun? <a href="#/login" class="secondary-button">Login</a></p>
        <p id="error-message" class="error-message hidden" aria-live="assertive"></p>
      </section>
    `;
  }

  async afterRender() {
    await this.presenter.init();
  }

  addSubmitListener(listener) {
    document.getElementById("register-form").addEventListener("submit", listener);
  }

  getFormData() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    return { name, email, password };
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
      submitButton.textContent = "Registering...";
    } else {
      submitButton.disabled = false;
      submitButton.textContent = "Register";
    }
  }
}
