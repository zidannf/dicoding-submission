import AuthModel from "../../models/auth-model";

export default class RegisterPagePresenter {
  constructor(view) {
    this.view = view;
  }

  async init() {
    try {
      this.view.addSubmitListener(this.handleRegisterSubmit.bind(this));
    } catch (error) {
      console.error("Error initializing RegisterPagePresenter:", error);
    }
  }

  async handleRegisterSubmit(event) {
    event.preventDefault();
    const formData = this.view.getFormData();
    const { name, email, password } = formData;

    this.view.hideErrorMessage();

    try {
      this.view.setLoadingState(true);

      await AuthModel.register(name, email, password);

      window.location.href = "/login";
    } catch (error) {
      this.view.setErrorMessage(error.message);
    } finally {
      this.view.setLoadingState(false);
    }
  }
}
